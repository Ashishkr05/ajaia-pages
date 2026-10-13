import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

async function startIsolatedServer(dataDir) {
  const child = spawn(process.execPath, [join(root, 'server.mjs')], {
    cwd: root,
    env: { ...process.env, PORT: '0', HOST: '127.0.0.1', DATA_DIR: dataDir },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let output = '';
  child.stderr.setEncoding('utf8');
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', chunk => { output += chunk; });
  child.stderr.on('data', chunk => { output += chunk; });
  try {
    const origin = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Server did not start. Output: ${output}`)), 5000);
      const check = () => {
        const match = output.match(/running at http:\/\/(?:localhost|127\.0\.0\.1):(\d+)/);
        if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); }
      };
      child.stdout.on('data', check);
      child.once('error', error => { clearTimeout(timeout); reject(error); });
      child.once('exit', code => { clearTimeout(timeout); reject(new Error(`Server exited (${code}). ${output}`)); });
    });
    return { child, origin };
  } catch (error) {
    if (child.exitCode === null && child.signalCode === null) {
      const stopped = new Promise(resolve => child.once('exit', resolve));
      child.kill();
      await stopped;
    }
    throw error;
  }
}

async function stopServer(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const stopped = new Promise(resolve => child.once('exit', resolve));
  child.kill();
  await stopped;
}

async function request(origin, userId, path, options = {}) {
  const response = await fetch(`${origin}${path}`, {
    ...options,
    headers: { 'X-User-Id': userId, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(options.headers || {}) }
  });
  return { response, data: await response.json() };
}

test('HTTP API enforces sharing, sanitizes content, and persists changes', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ajaia-pages-test-'));
  let child;
  try {
    const server = await startIsolatedServer(dataDir);
    child = server.child;
    const { origin } = server;

    const home = await fetch(origin);
    assert.equal(home.status, 200);
    assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
    assert.match(home.headers.get('content-security-policy'), /frame-ancestors 'none'/);

    const { response: blankCreated, data: blankData } = await request(origin, 'ashish', '/api/documents', {
      method: 'POST', body: JSON.stringify({ title: 'Untitled page', content: '<p>Start writing something worth sharing.</p>' })
    });
    assert.equal(blankCreated.status, 201);
    assert.equal(blankData.document.title, 'Untitled page');
    const { response: blankOpened, data: blankOpenedData } = await request(origin, 'ashish', `/api/documents/${blankData.document.id}`);
    assert.equal(blankOpened.status, 200);
    assert.equal(blankOpenedData.document.content, '<p>Start writing something worth sharing.</p>');

    const { response: created, data } = await request(origin, 'ashish', '/api/documents', {
      method: 'POST', body: JSON.stringify({ title: 'Review plan', content: '<h2 onclick="x()">Plan</h2><svg/onload=alert(1)>safe</svg>' })
    });
    assert.equal(created.status, 201);
    assert.equal(data.document.content, '<h2>Plan</h2>safe');
    const { data: pageList } = await request(origin, 'ashish', '/api/documents');
    assert.equal(Object.hasOwn(pageList.documents[0], 'content'), false);

    const docId = data.document.id;
    const { response: hidden } = await request(origin, 'jordan', `/api/documents/${docId}`);
    assert.equal(hidden.status, 404);
    const { response: invalidIdentity } = await request(origin, 'not-a-demo-user', '/api/documents');
    assert.equal(invalidIdentity.status, 401);

    const { response: invited } = await request(origin, 'ashish', `/api/documents/${docId}/share`, {
      method: 'POST', body: JSON.stringify({ email: 'jordan@ajaia.example', permission: 'viewer' })
    });
    assert.equal(invited.status, 200);

    const { response: read, data: shared } = await request(origin, 'jordan', `/api/documents/${docId}`);
    assert.equal(read.status, 200);
    assert.equal(shared.document.permission, 'viewer');

    const { response: denied } = await request(origin, 'jordan', `/api/documents/${docId}`, {
      method: 'PATCH', body: JSON.stringify({ title: 'Unauthorized edit' })
    });
    assert.equal(denied.status, 403);

    const store = JSON.parse(await readFile(join(dataDir, 'store.json'), 'utf8'));
    assert.equal(store.documents.find(doc => doc.id === docId).title, 'Review plan');
    assert.equal(store.shares.some(share => share.documentId === docId && share.userId === 'jordan' && share.permission === 'viewer'), true);
  } finally {
    if (child) await stopServer(child);
    await rm(dataDir, { recursive: true, force: true });
  }
});

test('server refuses to overwrite an invalid existing document store', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'ajaia-pages-corrupt-store-'));
  const storePath = join(dataDir, 'store.json');
  const original = '{"documents":[]}';
  await writeFile(storePath, original);
  try {
    await assert.rejects(startIsolatedServer(dataDir), /Server exited/);
    assert.equal(await readFile(storePath, 'utf8'), original);
  } finally {
    await rm(dataDir, { recursive: true, force: true });
  }
});
