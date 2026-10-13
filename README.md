# Ajaia Pages

A small, calm shared writing space built for the Ajaia full stack product engineering exercise. The goal is a reliable slice through the everyday workflow: create a page, shape it with basic formatting, import a text file, and bring in a teammate with explicit access.

## Run locally

Requirements: Node.js 20 or newer.

```sh
npm ci
npm start
```

Open [http://localhost:3000](http://localhost:3000). For automatic server restarts while developing, use `npm run dev`. Without `DATABASE_URL`, local data is stored in `data/store.json` and created on first run. That file is ignored by Git.

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

The app serves the browser UI and API from one Node web service. Set `DATABASE_URL` to a PostgreSQL connection string to store documents and sharing records in Postgres; without it, the app uses local JSON for development. On first database start it creates the two required tables and adds the demo Welcome page if the database is empty. Keep `DATABASE_URL` private and configure it as a Render secret, not in source control.

For a free demo deployment, use Supabase Free Postgres for durable document data and a Render Free Web Service for the app. In Supabase, create a project and copy its **Session pooler** connection string from **Connect**. In Render, create a Blueprint from this GitHub repository using `render.yaml`, set `DATABASE_URL` to that connection string when prompted, and deploy the `main` branch. The `/api/health` endpoint is configured as the Render health check. You can also create a regular Render Web Service with build command `npm ci`, start command `npm start`, `NODE_ENV=production`, and `DATABASE_URL` set in Environment.

Free hosting has tradeoffs: Render services sleep after 15 minutes without traffic and can take around a minute to wake up. Render Free does not provide persistent disks, so do not use the local JSON mode for a deployed app. Supabase Free projects can pause after a week with very low activity; resume them from the Supabase dashboard if that happens. Review the current [Render free instance limits](https://render.com/docs/free) and [Supabase free-project pausing policy](https://supabase.com/docs/guides/platform/free-project-pausing).

Live product: [https://ajaia-pages.onrender.com](https://ajaia-pages.onrender.com). The health endpoint is [https://ajaia-pages.onrender.com/api/health](https://ajaia-pages.onrender.com/api/health); after deployment it should report `{"ok":true,"storage":"postgres"}`. The service URL loaded successfully in a browser, and the health endpoint returned HTTP 200 before the storage-mode check was added; confirm the Postgres value after Render redeploys this commit.

Locally, `PORT`, `HOST`, and `DATA_DIR` can override the port, bind address, and local data directory.

## Product and engineering notes

See [ARCHITECTURE.md](ARCHITECTURE.md) for scope and design choices, [AI_WORKFLOW.md](AI_WORKFLOW.md) for AI use, and [SUBMISSION.md](SUBMISSION.md) for the deliverable checklist. The walkthrough video is linked in the submission notes.
