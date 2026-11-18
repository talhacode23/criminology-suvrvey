import crypto from 'node:crypto';

export function verifyDashboardPasscode(submittedPassword, expectedPasscode) {
  if (typeof submittedPassword !== 'string' || typeof expectedPasscode !== 'string') {
    return false;
  }

  const submitted = submittedPassword.trim();
  const expected = expectedPasscode.trim();

  if (!submitted || !expected) {
    return false;
  }

  const submittedBuf = Buffer.from(submitted, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (submittedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(submittedBuf, expectedBuf);
}
