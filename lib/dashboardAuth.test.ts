import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyDashboardPasscode } from './dashboardAuth.js';

test('verifyDashboardPasscode accepts exact matching passcode', () => {
  assert.equal(verifyDashboardPasscode('lahore2026', 'lahore2026'), true);
  assert.equal(verifyDashboardPasscode('  lahore2026  ', 'lahore2026'), true);
});

test('verifyDashboardPasscode rejects wrong, empty, or non-string passcodes', () => {
  assert.equal(verifyDashboardPasscode('wrongpass', 'lahore2026'), false);
  assert.equal(verifyDashboardPasscode('lahore2025', 'lahore2026'), false);
  assert.equal(verifyDashboardPasscode('', 'lahore2026'), false);
  assert.equal(verifyDashboardPasscode('   ', 'lahore2026'), false);
  assert.equal(verifyDashboardPasscode(null as unknown as string, 'lahore2026'), false);
});
