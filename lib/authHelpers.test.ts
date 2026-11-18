import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapFirebaseAuthError,
  validateAuthInput,
  verifyStaticDashboardPasscode,
  AUTH_ERROR_MESSAGES,
} from './authHelpers.js';

test('maps incorrect credential error codes to exact required message', () => {
  const credentialCodes = [
    'auth/invalid-credential',
    'auth/invalid-login-credentials',
    'auth/wrong-password',
    'auth/user-not-found',
  ];

  for (const code of credentialCodes) {
    assert.equal(mapFirebaseAuthError(code, 'signin'), 'Email or password is incorrect');
  }
});

test('maps existing email error code to exact required message', () => {
  assert.equal(
    mapFirebaseAuthError('auth/email-already-in-use', 'signup'),
    'User already exists. Please sign in'
  );
});

test('maps invalid-email based on mode', () => {
  assert.equal(mapFirebaseAuthError('auth/invalid-email', 'signin'), 'Email or password is incorrect');
  assert.equal(mapFirebaseAuthError('auth/invalid-email', 'signup'), AUTH_ERROR_MESSAGES.INVALID_EMAIL);
});

test('maps weak password and fallback errors cleanly', () => {
  assert.equal(mapFirebaseAuthError('auth/weak-password', 'signup'), AUTH_ERROR_MESSAGES.WEAK_PASSWORD);
  assert.equal(mapFirebaseAuthError('auth/unknown-code', 'signin'), AUTH_ERROR_MESSAGES.GENERIC_ERROR);
});

test('validates sign-in and sign-up inputs before network call', () => {
  assert.deepEqual(validateAuthInput('', 'secret123', 'signin'), {
    valid: false,
    error: 'Email or password is incorrect',
  });

  assert.deepEqual(validateAuthInput('not-an-email', 'secret123', 'signup'), {
    valid: false,
    error: AUTH_ERROR_MESSAGES.INVALID_EMAIL,
  });

  assert.deepEqual(validateAuthInput('researcher@example.com', '123', 'signup'), {
    valid: false,
    error: AUTH_ERROR_MESSAGES.WEAK_PASSWORD,
  });

  assert.deepEqual(validateAuthInput('researcher@example.com', 'secret123', 'signup'), {
    valid: true,
    error: '',
  });
});

test('verifyStaticDashboardPasscode accepts valid passcode and rejects invalid ones', async () => {
  assert.equal(await verifyStaticDashboardPasscode('lahore2026'), true);
  assert.equal(await verifyStaticDashboardPasscode(' lahore2026 '), true);
  assert.equal(await verifyStaticDashboardPasscode('wrongpass'), false);
  assert.equal(await verifyStaticDashboardPasscode(''), false);
});

