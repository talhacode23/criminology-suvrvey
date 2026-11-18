import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFolderInput,
  validateFileInput,
  validateNoteInput,
  validateMemberInput,
  buildUserProfilePayload,
  resolveFolderName,
  formatFirestoreDate,
} from './workspaceHelpers.js';

test('validateFolderInput validates required name and length', () => {
  assert.deepEqual(validateFolderInput({ name: '   ' }), {
    valid: false,
    error: 'Folder name is required.',
  });

  assert.deepEqual(validateFolderInput({ name: '  Field Reports  ' }), {
    valid: true,
    error: '',
    data: { name: 'Field Reports' },
  });
});

test('validateFileInput enforces name and size while keeping folderId optional', () => {
  assert.equal(validateFileInput({ name: '', size: '1 MB' }).valid, false);
  assert.equal(validateFileInput({ name: 'report.pdf', size: '' }).valid, false);

  assert.deepEqual(
    validateFileInput({ name: ' survey.csv ', size: ' 420 KB ', folderId: '' }),
    {
      valid: true,
      error: '',
      data: { name: 'survey.csv', size: '420 KB' },
    }
  );

  assert.deepEqual(
    validateFileInput({ name: 'survey.csv', size: '420 KB', folderId: 'fld_123' }),
    {
      valid: true,
      error: '',
      data: { name: 'survey.csv', size: '420 KB', folderId: 'fld_123' },
    }
  );
});

test('validateNoteInput requires title and keeps content optional', () => {
  assert.equal(validateNoteInput({ title: '', content: 'text' }).valid, false);

  assert.deepEqual(validateNoteInput({ title: ' Interview #4 ', content: '  ' }), {
    valid: true,
    error: '',
    data: { title: 'Interview #4' },
  });

  assert.deepEqual(
    validateNoteInput({ title: 'Summary', content: 'Key findings from Lahore' }),
    {
      valid: true,
      error: '',
      data: { title: 'Summary', content: 'Key findings from Lahore' },
    }
  );
});

test('validateMemberInput requires name and keeps role optional', () => {
  assert.equal(validateMemberInput({ name: '', role: 'Lead' }).valid, false);

  assert.deepEqual(validateMemberInput({ name: ' Ayesha Khan ', role: '' }), {
    valid: true,
    error: '',
    data: { name: 'Ayesha Khan' },
  });

  assert.deepEqual(validateMemberInput({ name: 'Ali Raza', role: 'Data Analyst' }), {
    valid: true,
    error: '',
    data: { name: 'Ali Raza', role: 'Data Analyst' },
  });
});

test('buildUserProfilePayload creates default Free plan profile from auth user', () => {
  assert.deepEqual(
    buildUserProfilePayload({ email: 'researcher@example.com', displayName: '' }),
    {
      displayName: 'researcher',
      email: 'researcher@example.com',
      plan: 'Free',
    }
  );
});

test('resolveFolderName finds folder name or falls back to Root', () => {
  const folders = [{ id: 'f1', name: 'Interviews' }, { id: 'f2', name: 'Datasets' }];
  assert.equal(resolveFolderName('f2', folders), 'Datasets');
  assert.equal(resolveFolderName('', folders), 'Root');
  assert.equal(resolveFolderName('missing', folders), 'Root');
});

test('formatFirestoreDate handles null, Timestamp-like objects, and seconds', () => {
  assert.equal(formatFirestoreDate(null), 'Just now');
  assert.notEqual(formatFirestoreDate({ seconds: 1700000000 }), 'Just now');
  assert.notEqual(formatFirestoreDate({ toDate: () => new Date('2026-01-15T00:00:00Z') }), 'Just now');
});
