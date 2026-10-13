# Submission contents

1. `server.mjs` - Node HTTP server and API.
2. `src/store.js` - document, sharing, validation, and content-sanitization logic.
3. `public/` - browser application, editor, and styles.
4. `test/` - automated store, Markdown import, and HTTP API tests for access control, sanitization, persistence, and response security headers.
5. `README.md` - local setup, demo accounts, features, and deployment notes.
6. `ARCHITECTURE.md` - product scope, architecture, tradeoffs, and next steps.
7. `AI_WORKFLOW.md` - tools, practical AI use, changes, and verification.
8. `VIDEO_LINK.txt` - public walkthrough video URL.
9. `sample-import.txt` and `sample-import.md` - small files reviewers can use to try text and Markdown import.

## Links and review access

- Google Drive folder: **Pending creation and upload**; this folder currently contains the source locally.
- Live product: **Pending deployment**; the local `http://localhost:3000` address is not reviewer-accessible.
- Walkthrough: https://www.loom.com/share/db509be2aa1d49868817657db10892e5 (confirm the link opens without requiring reviewer access).
- Demo credentials: no passwords; select Ashish Kumar, Maya Chen, or Jordan Lee in the account switcher. The emails and starting access are listed in `README.md`.
- Local start: `npm start`, then open `http://localhost:3000`.

## Completion status

Working: document creation/editing/rename/autosave/reopen, basic rich text, `.txt` import, safe Markdown subset import (headings, emphasis, lists), seeded-user sharing with viewer/editor access, local persistence, and focused automated tests.

Incomplete: public hosting, Drive upload, and final browser review after the last import fix. Real authentication, a relational database, simultaneous editing, and full Markdown support are intentionally out of scope for this demo. Next steps are listed in `ARCHITECTURE.md`.
