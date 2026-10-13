import http from 'node:http';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { canAccess, createDocument, updateDocument, grantAccess, listDocuments, sanitizeContent } from './src/store.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const dataDir = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(root, 'data');
const dbPath = join(dataDir, 'store.json');
const users = [
  { id: 'ashish', name: 'Ashish Kumar', email: 'ashishbgs9783@gmail.com', initials: 'AK' },
  { id: 'maya', name: 'Maya Chen', email: 'maya@ajaia.example', initials: 'MC' },
  { id: 'jordan', name: 'Jordan Lee', email: 'jordan@ajaia.example', initials: 'JL' }
];
let state;
let persistQueue = Promise.resolve();
await mkdir(dataDir, { recursive: true });
try {
  state = JSON.parse(await readFile(dbPath, 'utf8'));
  if (!state || !Array.isArray(state.documents) || !Array.isArray(state.shares)) throw new Error('The document store has an invalid shape.');
} catch (error) {
  if (error.code !== 'ENOENT') throw new Error(`Could not load document store at ${dbPath}; refusing to replace existing data.`, { cause: error });
  state = { documents: [
    { id: 'welcome', title: 'Welcome to Pages', content: '<h1>Make room for good work.</h1><p>A calm place for your team to think, write, and move forward together.</p><h2>Start with the essentials</h2><ul><li>Create a page for an idea or project</li><li>Invite a teammate when you are ready</li><li>Your changes save automatically</li></ul><p>Try the demo account switcher in the top right to preview a shared workspace.</p>', ownerId: 'ashish', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  ], shares: [{ documentId: 'welcome', userId: 'maya', permission: 'editor' }] };
  await persist();
}
function persist() {
  const snapshot = JSON.stringify(state, null, 2);
  const operation = persistQueue.catch(() => {}).then(async () => {
    const temporaryPath = `${dbPath}.tmp`;
    try { await writeFile(temporaryPath, snapshot); await rename(temporaryPath, dbPath); }
    catch (error) { error.status = 500; throw error; }
  });
  persistQueue = operation;
  return operation;
}
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'no-referrer',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
};
const json = (res, status, body) => { res.writeHead(status, { ...securityHeaders, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
async function body(req) {
  let raw = ''; for await (const chunk of req) { raw += chunk; if (raw.length > 1_000_000) throw new Error('Request is too large.'); }
  try { return JSON.parse(raw || '{}'); } catch { throw new Error('Request body must be valid JSON.'); }
}
function userFor(req) { return users.find(u => u.id === (req.headers['x-user-id'] || 'ashish')); }
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'GET' && url.pathname === '/api/session') return json(res, 200, { users, currentUser: userFor(req) });
  if (url.pathname.startsWith('/api/')) {
    const user = userFor(req); if (!user) return json(res, 401, { error: 'Choose a valid demo account.' });
    if (req.method === 'GET' && url.pathname === '/api/documents') return json(res, 200, { documents: listDocuments(state, user.id, users) });
    if (req.method === 'POST' && url.pathname === '/api/documents') {
      try { const input = await body(req); const doc = createDocument(state, user.id, input.title, input.content); await persist(); return json(res, 201, { document: doc }); }
      catch (e) { return json(res, e.status || 400, { error: e.status ? 'The document could not be saved.' : e.message }); }
    }
    const match = url.pathname.match(/^\/api\/documents\/([\w-]+)(?:\/(share))?$/);
    if (match) {
      const [, id, action] = match; const doc = state.documents.find(d => d.id === id);
      if (!doc || !canAccess(state, id, user.id)) return json(res, 404, { error: 'This page is not available to this account.' });
      if (action === 'share' && req.method === 'POST') {
        if (doc.ownerId !== user.id) return json(res, 403, { error: 'Only the owner can manage access.' });
        try { const input = await body(req); grantAccess(state, id, input.email, input.permission || 'editor', users); await persist(); return json(res, 200, { ok: true }); }
        catch (e) { return json(res, e.status || 400, { error: e.status ? 'Access could not be saved.' : e.message }); }
      }
      if (req.method === 'GET' && !action) { const share = state.shares.find(s => s.documentId === id && s.userId === user.id); return json(res, 200, { document: { ...doc, access: doc.ownerId === user.id ? 'owner' : 'shared', permission: share?.permission || 'owner', collaborators: state.shares.filter(s => s.documentId === id).map(s => ({ ...users.find(u => u.id === s.userId), permission: s.permission })) } }); }
      if (req.method === 'PATCH' && !action) {
        try { const input = await body(req); const share = state.shares.find(s => s.documentId === id && s.userId === user.id); updateDocument(doc, user.id, { ...input, content: input.content === undefined ? undefined : sanitizeContent(input.content), permission: share?.permission }); await persist(); return json(res, 200, { document: doc }); }
        catch (e) { return json(res, e.status || 400, { error: e.status ? 'The document could not be saved.' : e.message }); }
      }
    }
    return json(res, 404, { error: 'API route not found.' });
  }
  const relative = normalize(decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)).replace(/^([/\\]|\.\.(?:[/\\]|$))+/, '');
  const path = join(root, 'public', relative);
  try { const content = await readFile(path); const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' }; res.writeHead(200, { ...securityHeaders, 'Cache-Control': 'no-cache', 'Content-Type': types[extname(path)] || 'application/octet-stream' }); res.end(content); }
  catch { res.writeHead(404); res.end('Not found'); }
});
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
server.listen(port, host, () => console.log(`Ajaia Pages running at http://localhost:${server.address().port}`));
