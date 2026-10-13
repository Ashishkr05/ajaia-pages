import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccess, createDocument, grantAccess, sanitizeContent, updateDocument } from '../src/store.js';

const users = [
  { id: 'owner', name: 'Owner', email: 'owner@example.com' },
  { id: 'editor', name: 'Editor', email: 'editor@example.com' },
  { id: 'viewer', name: 'Viewer', email: 'viewer@example.com' }
];
function fixture() { return { documents: [], shares: [] }; }

test('owner can share with an editor and viewer; edit rights follow the grant', () => {
  const state = fixture();
  const doc = createDocument(state, 'owner', 'Plan', '<p>Draft</p>');
  grantAccess(state, doc.id, 'editor@example.com', 'editor', users);
  grantAccess(state, doc.id, 'viewer@example.com', 'viewer', users);
  assert.equal(canAccess(state, doc.id, 'editor'), true);
  assert.equal(updateDocument(doc, 'editor', { title: 'Updated', permission: 'editor' }).title, 'Updated');
  assert.throws(() => updateDocument(doc, 'viewer', { title: 'Nope', permission: 'viewer' }), /read-only/);
  assert.equal(canAccess(state, doc.id, 'stranger'), false);
});

test('content sanitization keeps editor formatting and removes unsafe tags and attributes', () => {
  assert.equal(sanitizeContent('<h2 onclick="evil()">Title</h2><script>alert(1)</script><p>Safe</p>'), '<h2>Title</h2>alert(1)<p>Safe</p>');
  assert.equal(sanitizeContent('<svg/onload=alert(1)>X</svg><p style="background:url(javascript:alert(2))">Safe</p>'), 'X<p>Safe</p>');
  assert.equal(createDocument(fixture(), 'owner', 'Safe', '<img src=x onerror=alert(1)>Text').content, 'Text');
});
