# Architecture and scope

## Product slice

Pages focuses on a single coherent loop: start a page, write and format it, let it save, then invite a teammate. The editor surface stays intentionally quiet; the document list, save signal, ownership label, and invite flow make the state understandable without trying to reproduce the full Google Docs interface.

## Structure

- `server.mjs` is a small Node HTTP server. It serves the UI and a JSON API from one origin, and uses an `X-User-Id` header for the seeded demo identity.
- `src/store.js` contains access, validation, sharing, and content-sanitizing rules independently of HTTP.
- `public/` contains a dependency-free browser client. The editor uses `contenteditable` and browser formatting commands, then saves its HTML representation.
- Local development uses `data/store.json`, initialized with a welcome page and editor share. When `DATABASE_URL` is set, the server uses PostgreSQL tables for documents and access grants instead. The production database is initialized at startup and gets the welcome page only when there are no documents.
- `test/store.test.js` verifies core store rules; `test/api.test.js` exercises the HTTP routes in an isolated temporary data directory.

## Deliberate tradeoffs

Local JSON avoids requiring external credentials and keeps setup simple. Production uses Postgres so data survives a Render restart; the free Render web service is a single instance, and the app's in-memory read model is not designed for horizontal scaling. The database schema is created at startup, while backup/restore and schema migration tooling are intentionally out of scope for this demo. The editor supports basic inline formatting and headings but does not implement presence, comments, history, tables, or real-time concurrent editing.

The mock account selector makes the share path testable without sign-up friction. This is not an authentication boundary: a real deployment must replace the client-supplied identity header with verified sessions and add CSRF/rate limiting as appropriate. Shared editors can edit page content; viewers are read-only; only owners can invite. A small HTML allowlist strips attributes and unsupported tags before persistence. The app is intended for demo content and has no malware scanning for uploads.

## Next 2-4 hours

1. Replace mock identities with signed sessions and enforce authorization through server-derived identity.
2. Add schema migration and backup/restore handling for the production database.
3. Add optimistic concurrency/version checks so simultaneous edits do not overwrite each other silently.
4. Add an owner-only delete flow with confirmation and a clear recovery policy.
5. Add an end-to-end browser test for creation, refresh persistence, and editor/viewer behavior.
