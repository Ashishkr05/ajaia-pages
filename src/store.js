import { randomUUID } from 'node:crypto';

export function canAccess(state, documentId, userId) {
  const doc = state.documents.find(d => d.id === documentId);
  return !!doc && (doc.ownerId === userId || state.shares.some(s => s.documentId === documentId && s.userId === userId));
}
export function listDocuments(state, userId, users) {
  return state.documents.filter(d => canAccess(state, d.id, userId)).map(d => ({ id: d.id, title: d.title, ownerId: d.ownerId, createdAt: d.createdAt, updatedAt: d.updatedAt, access: d.ownerId === userId ? 'owner' : 'shared', owner: users.find(u => u.id === d.ownerId)?.name || 'Unknown' })).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function createDocument(state, userId, title = 'Untitled page', content = '<p>Start writing…</p>') {
  if (typeof title !== 'string' || title.trim().length > 120) throw new Error('Page names must be 120 characters or fewer.');
  content = sanitizeContent(content);
  const now = new Date().toISOString();
  const doc = { id: randomUUID(), title: title.trim() || 'Untitled page', content, ownerId: userId, createdAt: now, updatedAt: now };
  state.documents.push(doc); return doc;
}
export function updateDocument(doc, userId, input) {
  const isEditor = doc.ownerId === userId || input.permission === 'editor';
  if (!isEditor) throw Object.assign(new Error('This page is read-only for your account.'), { status: 403 });
  if (input.title !== undefined) {
    if (typeof input.title !== 'string' || !input.title.trim() || input.title.trim().length > 120) throw new Error('Page names must be 1–120 characters.');
    doc.title = input.title.trim();
  }
  if (input.content !== undefined) {
    if (typeof input.content !== 'string' || input.content.length > 500_000) throw new Error('Page content is too large.');
    doc.content = input.content;
  }
  doc.updatedAt = new Date().toISOString(); return doc;
}
export function sanitizeContent(html) {
  if (typeof html !== 'string' || html.length > 500_000) throw new Error('Page content is too large.');
  const allowed = new Set(['p','br','strong','b','em','i','u','h1','h2','h3','ul','ol','li','blockquote']);
  return html.replace(/<[^>]*>/g, token => {
    const match = token.match(/^<\s*(\/?)\s*([a-z][a-z0-9]*)(?:\s+[^<>]*)?\s*(\/?)\s*>$/i);
    if (!match) return '';
    const [, closing, rawName] = match;
    const name = rawName.toLowerCase();
    if (!allowed.has(name)) return '';
    if (closing) return `</${name}>`;
    return `<${name}>`;
  });
}
export function grantAccess(state, documentId, email, permission, users) {
  const user = users.find(u => u.email.toLowerCase() === String(email || '').trim().toLowerCase());
  if (!user) throw new Error('No demo account found for that email.');
  const doc = state.documents.find(d => d.id === documentId);
  if (!doc || doc.ownerId === user.id) throw new Error('Choose another account to share with.');
  if (!['editor', 'viewer'].includes(permission)) throw new Error('Choose viewer or editor access.');
  const existing = state.shares.find(s => s.documentId === documentId && s.userId === user.id);
  if (existing) existing.permission = permission;
  else state.shares.push({ documentId, userId: user.id, permission });
  return user;
}
