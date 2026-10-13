# Architecture and scope

## Product slice

Pages focuses on a single coherent loop: start a page, write and format it, let it save, then invite a teammate. The editor surface stays intentionally quiet; the document list, save signal, ownership label, and invite flow make the state understandable without trying to reproduce the full Google Docs interface.

## Structure

- `server.mjs` is a small Node HTTP server. It serves the UI and a JSON API from one origin, and uses an `X-User-Id` header for the seeded demo identity.
- `src/store.js` contains access, validation, sharing, and content-sanitizing rules independently of HTTP.
- `public/` contains a dependency-free browser client. The editor uses `contenteditable` and browser formatting commands, then saves its HTML representation.
- `data/store.json` is the local persistence layer. It is initialized with a welcome page and an editor share on first run.
- `test/store.test.js` verifies core store rules; `test/api.test.js` exercises the HTTP routes in an isolated temporary data directory.

## Deliberate tradeoffs

Local JSON avoids requiring paid services or external credentials and makes the app easy to run. Writes are serialized and replace the data file atomically within one process, but there is no cross-process locking, database transaction, backup strategy, or multi-instance consistency. A production next step would move documents and grants to SQLite/Postgres with migrations and use a real authentication provider. The editor supports basic inline formatting and headings but does not implement presence, comments, history, tables, or real-time concurrent editing.

The mock account selector makes the share path testable without sign-up friction. This is not an authentication boundary: a real deployment must replace the client-supplied identity header with verified sessions and add CSRF/rate limiting as appropriate. Shared editors can edit page content; viewers are read-only; only owners can invite. A small HTML allowlist strips attributes and unsupported tags before persistence. The app is intended for demo content and has no malware scanning for uploads.

## Next 2-4 hours

1. Replace mock identities with signed sessions and enforce authorization through server-derived identity.
2. Move persistence to a relational database and add migration/backup handling.
3. Add optimistic concurrency/version checks so simultaneous edits do not overwrite each other silently.
4. Add an owner-only delete flow with confirmation and a clear recovery policy.
5. Add an end-to-end browser test for creation, refresh persistence, and editor/viewer behavior.
