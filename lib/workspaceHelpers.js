/**
 * Pure validation, payload builder, and formatting helpers for VaultFlow workspace entities
 * (My Files, My Notes, Team Members). Shared between the browser app and unit tests.
 */

export function validateFolderInput(input) {
  const name = (input?.name || '').trim();
  if (!name) {
    return { valid: false, error: 'Folder name is required.' };
  }
  if (name.length > 100) {
    return { valid: false, error: 'Folder name must be 100 characters or fewer.' };
  }
  return { valid: true, error: '', data: { name } };
}

export function validateFileInput(input) {
  const name = (input?.name || '').trim();
  const size = (input?.size || '').trim();
  const folderId = (input?.folderId || '').trim();

  if (!name) {
    return { valid: false, error: 'File name is required.' };
  }
  if (name.length > 160) {
    return { valid: false, error: 'File name must be 160 characters or fewer.' };
  }
  if (!size) {
    return { valid: false, error: 'File size is required (e.g., 2.4 MB).' };
  }
  if (size.length > 40) {
    return { valid: false, error: 'File size must be 40 characters or fewer.' };
  }

  const data = { name, size };
  if (folderId) {
    data.folderId = folderId;
  }

  return { valid: true, error: '', data };
}

export function validateNoteInput(input) {
  const title = (input?.title || '').trim();
  const content = (input?.content || '').trim();

  if (!title) {
    return { valid: false, error: 'Note title is required.' };
  }
  if (title.length > 160) {
    return { valid: false, error: 'Note title must be 160 characters or fewer.' };
  }
  if (content.length > 10000) {
    return { valid: false, error: 'Note content must be 10,000 characters or fewer.' };
  }

  const data = { title };
  if (content) {
    data.content = content;
  }

  return { valid: true, error: '', data };
}

export function validateMemberInput(input) {
  const name = (input?.name || '').trim();
  const role = (input?.role || '').trim();

  if (!name) {
    return { valid: false, error: 'Member name is required.' };
  }
  if (name.length > 120) {
    return { valid: false, error: 'Member name must be 120 characters or fewer.' };
  }
  if (role.length > 120) {
    return { valid: false, error: 'Role must be 120 characters or fewer.' };
  }

  const data = { name };
  if (role) {
    data.role = role;
  }

  return { valid: true, error: '', data };
}

export function buildUserProfilePayload(user) {
  const email = (user?.email || '').trim();
  const fallbackName = email.includes('@') ? email.split('@')[0] : 'Researcher';
  const displayName = (user?.displayName || fallbackName).trim().slice(0, 120) || 'Researcher';
  return {
    displayName,
    email,
    plan: 'Free',
  };
}

export function resolveFolderName(folderId, folders) {
  if (!folderId || !Array.isArray(folders)) return 'Root';
  const match = folders.find((f) => f.id === folderId);
  return match ? match.name : 'Root';
}

export function formatFirestoreDate(value) {
  if (!value) return 'Just now';
  try {
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    if (typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  } catch {
    return 'Just now';
  }
  return 'Just now';
}

export function buildSurveyResponsePayload(formData, customId) {
  const safeId = (customId || `RESP-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`)
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 64);

  const payload = {
    id: safeId || `RESP-${Date.now()}`,
    timestamp: new Date().toLocaleString().slice(0, 100),
    name: String(formData?.name || '').trim().slice(0, 120),
    city: (String(formData?.city || '').trim() || 'Lahore').slice(0, 120),
    consent: Boolean(formData?.consent),
  };

  for (let q = 1; q <= 20; q++) {
    const key = `q${q}`;
    payload[key] = String(formData?.[key] || '').trim().slice(0, 80);
  }

  return payload;
}

