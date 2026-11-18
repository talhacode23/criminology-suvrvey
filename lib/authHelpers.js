/**
 * Pure authentication helper functions shared between the browser app and unit tests.
 */

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email or password is incorrect',
  USER_EXISTS: 'User already exists. Please sign in',
  WEAK_PASSWORD: 'Password must be at least 6 characters',
  INVALID_EMAIL: 'Please enter a valid email address',
  TOO_MANY_REQUESTS: 'Too many attempts. Please try again later',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  OPERATION_NOT_ALLOWED: 'Email/password sign-in is not enabled in Firebase Console',
  GENERIC_ERROR: 'Authentication failed. Please try again',
};

/**
 * Validates email and password inputs prior to calling Firebase Auth.
 * @param {string} email
 * @param {string} password
 * @param {'signin' | 'signup'} mode
 * @returns {{ valid: boolean, error: string }}
 */
export function validateAuthInput(email, password, mode = 'signin') {
  const trimmedEmail = (email || '').trim();
  const rawPassword = password || '';

  if (!trimmedEmail || !rawPassword) {
    return {
      valid: false,
      error: mode === 'signin'
        ? AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
        : 'Please enter both email and password',
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return {
      valid: false,
      error: mode === 'signin'
        ? AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
        : AUTH_ERROR_MESSAGES.INVALID_EMAIL,
    };
  }

  if (mode === 'signup' && rawPassword.length < 6) {
    return {
      valid: false,
      error: AUTH_ERROR_MESSAGES.WEAK_PASSWORD,
    };
  }

  return { valid: true, error: '' };
}

/**
 * Maps Firebase Auth error codes to user-facing messages.
 * @param {string} code
 * @param {'signin' | 'signup'} mode
 * @returns {string}
 */
export function mapFirebaseAuthError(code, mode = 'signin') {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS;
    case 'auth/email-already-in-use':
      return AUTH_ERROR_MESSAGES.USER_EXISTS;
    case 'auth/invalid-email':
      return mode === 'signin'
        ? AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS
        : AUTH_ERROR_MESSAGES.INVALID_EMAIL;
    case 'auth/weak-password':
      return AUTH_ERROR_MESSAGES.WEAK_PASSWORD;
    case 'auth/too-many-requests':
      return AUTH_ERROR_MESSAGES.TOO_MANY_REQUESTS;
    case 'auth/network-request-failed':
      return AUTH_ERROR_MESSAGES.NETWORK_ERROR;
    case 'auth/operation-not-allowed':
      return AUTH_ERROR_MESSAGES.OPERATION_NOT_ALLOWED;
    default:
      return AUTH_ERROR_MESSAGES.GENERIC_ERROR;
  }
}

const STATIC_DASHBOARD_PASSCODE_SHA256 =
  '89688336c5003e6b35cf512e3c450bd967330f197d949759b79674fe31d8167a';

/**
 * Verifies the dashboard passcode using Web Crypto SHA-256 when hosted statically
 * (e.g., GitHub Pages where no Node backend API exists).
 * @param {string} submittedPassword
 * @returns {Promise<boolean>}
 */
export async function verifyStaticDashboardPasscode(submittedPassword) {
  if (typeof submittedPassword !== 'string') return false;
  const trimmed = submittedPassword.trim();
  if (!trimmed || !globalThis.crypto?.subtle) return false;
  const encoded = new TextEncoder().encode(trimmed);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hex === STATIC_DASHBOARD_PASSCODE_SHA256;
}

