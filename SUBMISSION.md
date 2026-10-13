# Submission contents

1. `server.mjs` - Node HTTP server, API, local JSON storage, and optional PostgreSQL persistence.
2. `src/store.js` - document, sharing, validation, and content-sanitization logic.
3. `public/` - browser application, editor, and styles.
4. `test/` - automated store, Markdown import, and HTTP API tests for access control, sanitization, persistence, and response security headers.
5. `README.md` - local setup, demo accounts, features, and deployment notes.
6. `ARCHITECTURE.md` - product scope, architecture, tradeoffs, and next steps.
7. `AI_WORKFLOW.md` - tools, practical AI use, changes, and verification.
8. `VIDEO_LINK.txt` - public walkthrough URL for the Drive submission bundle (kept out of the GitHub source repository).
9. `sample-import.txt` and `sample-import.md` - optional local import demos, kept out of the GitHub source repository.
10. `render.yaml`, `Dockerfile`, `package.json`, and `package-lock.json` - Render Blueprint, container setup, and locked PostgreSQL driver dependency.

## Links and review access

- Google Drive folder: **Pending upload**. Create one folder containing the source package and submission materials, then add its share link to the application.
- Source repository: https://github.com/Ashishkr05/ajaia-pages
- Live product: https://ajaia-pages.onrender.com
- Health check: https://ajaia-pages.onrender.com/api/health. After the latest deployment it should report `{"ok":true,"storage":"postgres"}`.
- Walkthrough: https://www.loom.com/share/db509be2aa1d49868817657db10892e5 (confirm the link opens without requiring reviewer access).
- Demo credentials: no passwords; select Ashish Kumar, Maya Chen, or Jordan Lee in the account switcher. The emails and starting access are listed in `README.md`.
- Local start: run `npm ci` then `npm start`, and open `http://localhost:3000`.

## Completion status

Working: document creation/editing/rename/autosave/reopen, basic rich text, `.txt` and supported Markdown import, seeded-user sharing with viewer/editor access, local JSON persistence, PostgreSQL persistence support, six automated tests, and a deployed Render app. The app was observed loading at the live URL and its health endpoint returned HTTP 200. Verify its `storage` value after the latest health-check commit deploys.

Incomplete: uploading the deliverables to one Drive folder and pasting that folder link into the assessment portal. The demo uses seeded account switching, not real authentication; simultaneous editing and full Markdown support are intentionally out of scope. Next steps are listed in `ARCHITECTURE.md`.
