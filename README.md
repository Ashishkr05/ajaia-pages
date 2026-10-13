# Ajaia Pages

A small, calm shared writing space built for the Ajaia full stack product engineering exercise. The goal is a reliable slice through the everyday workflow: create a page, shape it with basic formatting, import a text file, and bring in a teammate with explicit access.

## Run locally

Requirements: Node.js 20 or newer. No package install is needed; the app uses Node's built-in modules.

```sh
npm start
```

Open [http://localhost:3000](http://localhost:3000). For automatic server restarts while developing, use `npm run dev`. Data is stored in `data/store.json` and created on first run. That file is ignored by Git.

## Demo accounts

There is no password-based authentication in this time-boxed demo. Use the account selector at the upper right to switch identities.

| Name | Email | Initial access |
| --- | --- | --- |
| Ashish Kumar | ashishbgs9783@gmail.com | Owner of the seeded Welcome to Pages document |
| Maya Chen | maya@ajaia.example | Editor on Welcome to Pages |
| Jordan Lee | jordan@ajaia.example | No pages until invited |

Ashish can invite either other account as an editor or viewer. Switch accounts to check the access boundary. Editors can change page title and content. Viewers can read, but cannot edit. Only the owner can manage invitations. This is a demo identity model, not production authentication.

## What works

- Create, rename, edit, save, and reopen pages. Edits autosave after a short pause and are persisted by the server.
- Rich text: bold, italic, underline, three heading levels, and ordered/unordered lists.
- Import `.txt` and `.md` files as new pages (maximum 60 KB). Text stays plain paragraphs; Markdown headings (levels 1–3), emphasis, and ordered/unordered lists are converted to editor formatting. Raw HTML in imports is escaped.
- Invite seeded users as editor or viewer; owned and shared pages are distinguished in the sidebar.
- Content is sanitized to a small formatting allowlist before server-side persistence.
- The HTTP API adds a restrictive Content Security Policy and standard content-sniffing, framing, and referrer headers.
- Responsive layout, empty state, save status, word count, and basic error feedback.

## Tests

```sh
npm test
```

The tests exercise store rules, Markdown conversion, and HTTP behavior: content creation, sanitization, sharing, viewer edit denial, persistence, and response security headers. A manual review should also switch among the seeded accounts in the browser.

## Deployment

Locally, the app binds to `127.0.0.1`. In production (`NODE_ENV=production`) it binds to `0.0.0.0`; `PORT`, `HOST`, and `DATA_DIR` can override the port, bind address, and data directory. It can run on a Node host that supports a persistent writable volume. For a single-instance deployment, mount durable storage at `/app/data` in the supplied Docker image so documents survive redeploys. JSON storage is intentionally simple and is not suitable for concurrent multi-instance production traffic.

**Live product:** pending deployment. The project is ready to deploy, but this workspace has no connected hosting account or authorized deployment target. Do not treat a local URL as a public deployment.

## Product and engineering notes

See [ARCHITECTURE.md](ARCHITECTURE.md) for scope and design choices, [AI_WORKFLOW.md](AI_WORKFLOW.md) for AI use, and [SUBMISSION.md](SUBMISSION.md) for the deliverable checklist. The walkthrough video link is in [VIDEO_LINK.txt](VIDEO_LINK.txt).
