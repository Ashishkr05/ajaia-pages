# AI workflow note

I used OpenAI Codex as a coding assistant to turn the assignment into a small product slice, draft the initial server/client structure, and help identify the core access-control and input-sanitization cases. The time saved was most useful in getting a working full-stack path in place quickly, so I could spend attention on the user flow, boundaries, and delivery notes.

I reviewed and changed the generated implementation rather than accepting it wholesale. In particular, I added a server-side formatting allowlist, separated editor and viewer behavior, documented that demo identity is not real authentication, and implemented a safe Markdown subset importer rather than claiming full Markdown support. I also constrained the sharing model to seeded accounts so the reviewer has a reproducible flow.

Correctness is checked with automated store and isolated HTTP integration tests for access, sanitization, persistence, and security response headers. I also ran Node syntax checks. A browser session was unavailable in this environment, so the visual UX review is based on the implemented responsive states and still needs a human browser pass. The implementation is intentionally single-process and should not be read as production-ready multi-user infrastructure. No claim of live deployment or walkthrough recording is made until those actions are completed.
