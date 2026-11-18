import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { buildUserProfilePayload } from "/lib/workspaceHelpers.js";

export const OperationType = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
  LIST: "list",
  GET: "get",
  WRITE: "write",
};

export function handleFirestoreError(error, operationType, path, auth) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  return new Error(JSON.stringify(errInfo));
}

export function createFirestoreService(app, auth) {
  const db = getFirestore(app);

  async function testConnection() {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("Please check your Firebase configuration.");
      }
    }
  }

  testConnection();

  function sortByCreatedAtDesc(items) {
    return items.slice().sort((a, b) => {
      const aMs = a.createdAt?.toMillis ? a.createdAt.toMillis() : Number.MAX_SAFE_INTEGER;
      const bMs = b.createdAt?.toMillis ? b.createdAt.toMillis() : Number.MAX_SAFE_INTEGER;
      return bMs - aMs;
    });
  }

  let activeUnsubscribe = null;

  return {
    stopWorkspaceSync() {
      if (typeof activeUnsubscribe === "function") {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }
    },

    async ensureUserProfile(user) {
      const userPath = `users/${user.uid}`;
      const userRef = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(userRef);
        if (auth?.currentUser?.uid !== user.uid) return null;
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() };
        }
        const profilePayload = buildUserProfilePayload(user);
        await setDoc(userRef, {
          ...profilePayload,
          createdAt: serverTimestamp(),
        });
        return { id: user.uid, ...profilePayload };
      } catch (error) {
        if (!auth?.currentUser) return null;
        throw handleFirestoreError(error, OperationType.WRITE, userPath, auth);
      }
    },

    subscribeUserWorkspace(uid, callbacks) {
      if (typeof activeUnsubscribe === "function") {
        activeUnsubscribe();
        activeUnsubscribe = null;
      }

      let disposed = false;
      const unsubscribers = [];
      const collections = [
        { name: "folders", handler: callbacks.onFolders },
        { name: "files", handler: callbacks.onFiles },
        { name: "notes", handler: callbacks.onNotes },
        { name: "teamMembers", handler: callbacks.onMembers },
      ].filter((col) => typeof col.handler === "function");

      for (const col of collections) {
        const colPath = `users/${uid}/${col.name}`;
        const colRef = collection(db, "users", uid, col.name);
        const unsub = onSnapshot(
          colRef,
          (snapshot) => {
            if (disposed || auth?.currentUser?.uid !== uid) return;
            const items = [];
            snapshot.forEach((docSnap) => {
              items.push({ id: docSnap.id, ...docSnap.data() });
            });
            col.handler(sortByCreatedAtDesc(items));
          },
          (error) => {
            if (disposed || !auth?.currentUser) return;
            const wrapped = handleFirestoreError(error, OperationType.LIST, colPath, auth);
            if (callbacks.onError) {
              callbacks.onError(wrapped, error);
            }
          }
        );
        unsubscribers.push(unsub);
      }

      activeUnsubscribe = () => {
        disposed = true;
        unsubscribers.forEach((unsub) => {
          try {
            unsub();
          } catch {
            // ignore cleanup errors
          }
        });
      };

      return activeUnsubscribe;
    },

    async createFolder(uid, data) {
      const path = `users/${uid}/folders`;
      try {
        const docRef = await addDoc(collection(db, "users", uid, "folders"), {
          name: data.name,
          createdAt: serverTimestamp(),
        });
        return { id: docRef.id, name: data.name, createdAt: null };
      } catch (error) {
        throw handleFirestoreError(error, OperationType.CREATE, path, auth);
      }
    },

    async deleteFolder(uid, folderId) {
      const path = `users/${uid}/folders/${folderId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "folders", folderId));
      } catch (error) {
        throw handleFirestoreError(error, OperationType.DELETE, path, auth);
      }
    },

    async createFile(uid, data) {
      const path = `users/${uid}/files`;
      try {
        const payload = {
          name: data.name,
          size: data.size,
          createdAt: serverTimestamp(),
        };
        if (data.folderId) {
          payload.folderId = data.folderId;
        }
        const docRef = await addDoc(collection(db, "users", uid, "files"), payload);
        return {
          id: docRef.id,
          name: data.name,
          size: data.size,
          ...(data.folderId ? { folderId: data.folderId } : {}),
          createdAt: null,
        };
      } catch (error) {
        throw handleFirestoreError(error, OperationType.CREATE, path, auth);
      }
    },

    async deleteFile(uid, fileId) {
      const path = `users/${uid}/files/${fileId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "files", fileId));
      } catch (error) {
        throw handleFirestoreError(error, OperationType.DELETE, path, auth);
      }
    },

    async createNote(uid, data) {
      const path = `users/${uid}/notes`;
      try {
        const payload = {
          title: data.title,
          createdAt: serverTimestamp(),
        };
        if (data.content) {
          payload.content = data.content;
        }
        const docRef = await addDoc(collection(db, "users", uid, "notes"), payload);
        return {
          id: docRef.id,
          title: data.title,
          ...(data.content ? { content: data.content } : {}),
          createdAt: null,
        };
      } catch (error) {
        throw handleFirestoreError(error, OperationType.CREATE, path, auth);
      }
    },

    async deleteNote(uid, noteId) {
      const path = `users/${uid}/notes/${noteId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "notes", noteId));
      } catch (error) {
        throw handleFirestoreError(error, OperationType.DELETE, path, auth);
      }
    },

    async createMember(uid, data) {
      const path = `users/${uid}/teamMembers`;
      try {
        const payload = {
          name: data.name,
          createdAt: serverTimestamp(),
        };
        if (data.role) {
          payload.role = data.role;
        }
        const docRef = await addDoc(collection(db, "users", uid, "teamMembers"), payload);
        return {
          id: docRef.id,
          name: data.name,
          ...(data.role ? { role: data.role } : {}),
          createdAt: null,
        };
      } catch (error) {
        throw handleFirestoreError(error, OperationType.CREATE, path, auth);
      }
    },

    async deleteMember(uid, memberId) {
      const path = `users/${uid}/teamMembers/${memberId}`;
      try {
        await deleteDoc(doc(db, "users", uid, "teamMembers", memberId));
      } catch (error) {
        throw handleFirestoreError(error, OperationType.DELETE, path, auth);
      }
    },
  };
}
