# Copilot instructions for cs2-case-simulator

Purpose: short, machine-friendly notes to help Copilot-style assistants understand and work in this repository.

---

1) Build, test, and lint commands

- Install dependencies:
  - npm install

- Database / Prisma (use after setting DATABASE_URL in .env):
  - npx prisma generate
  - npx prisma db push
  - node prisma/seed.js  # populate test data

- Start (development):
  - node index.js
  - PORT can be set in the environment before starting (Windows: set PORT=4000 && node index.js)

- Tests: none defined in package.json ("test" script is a placeholder that errors). To run ad-hoc or single-file checks, run node <script>. To add test support, add a test runner (e.g., jest/mocha) and scripts.

- Lint: no linter configured.

---

2) High-level architecture

- Backend:
  - Single Express server implemented in index.js. Routes of primary interest:
    - GET /auth/fake-login  (development-only fake Steam login)
    - GET /auth/logout
    - GET /api/user-profile  (returns session-based user info)
    - GET /api/cases  (returns Case records with items)
    - POST /api/open-case  (protected by rate limiter and session auth; performs purchase + inventory write inside a Prisma transaction)
  - Session management uses express-session (cookie-based session, secret currently hardcoded for local dev).
  - Rate limiting protects the case-opening endpoint (openCaseLimiter in index.js).

- Database / ORM:
  - Prisma v7 with PostgreSQL. The project uses @prisma/adapter-pg and node-postgres Pool:
    - prisma/schema.prisma defines models: User, Case, Item, Inventory.
    - PrismaClient is instantiated with the PrismaPg adapter (Pool -> adapter -> new PrismaClient({ adapter })).
  - Transactions: open-case uses prisma.$transaction to ensure ACID behavior when deducting balance and creating inventory records.

- Frontend:
  - Static single-page UI in public/ served by express.static.
  - public/app.js handles UI state and calls the API endpoints above.

- Dev utilities:
  - prisma/seed.js populates sample cases and items (spring-hype, knife-hype).

---

3) Key conventions and repository-specific patterns

- Case identifiers:
  - Case.id is a string slug (e.g., "spring-hype") and is used directly by frontend routing and API calls. Treat these as canonical keys.

- Item chance semantics:
  - Item.chance is a Float representing a percentage (e.g., 1.5, 85.0). The provably-fair algorithm in index.js treats these as cumulative bounds; code assumes the dataset represents reasonable percentages but the DB does not enforce a strict sum of 100.

- Provably fair algorithm:
  - Implemented in index.js: openCaseProvablyFair(items, serverSeed, clientSeed, nonce).
  - It hashes `${serverSeed}-${clientSeed}-${nonce}` with sha256, uses the first 8 hex characters, converts to an integer, and maps that to a 0..100 range to select an item by cumulative chance.
  - serverSeed is currently hardcoded in index.js for local testing; move to env for production.

- Transactions / ACID:
  - Balance deduction and inventory creation are bundled in prisma.$transaction in POST /api/open-case. Keep money-related logic inside that transaction to avoid race conditions.

- Inventory status values:
  - Inventory.status uses string literals. Observed values: IN_INVENTORY, SOLD, WITHDRAWN.

- Prisma adapter pattern:
  - The code constructs a Pool, wraps it with PrismaPg, then passes adapter to new PrismaClient({ adapter }). Follow this pattern when adding code that needs DB access.

- Dev auth flow:
  - /auth/fake-login creates or reuses a test user with steamId "76561198000000000" and a starting balance (seed creates some users/items). This is intentionally development-only.

- Secrets & env vars:
  - DATABASE_URL is required for DB. Current code also contains local secrets (session secret, server seed) in index.js—migrate them to .env (e.g., SESSION_SECRET, SERVER_SEED) when securing the app.

- File locations of interest:
  - index.js (app entry and business logic)
  - prisma/schema.prisma, prisma/seed.js (DB models + seed)
  - public/ (frontend static files)

---

4) Existing assistant/A.I. configs to reference

- .agents/skills/supabase-postgres-best-practices/SKILL.md — a Supabase/Postgres best-practices skill included in repo. Use it when optimizing SQL or schema design.

---

Notes for maintainers

- There are no unit tests or linter configuration in the repository currently; adding test tools (Jest/Mocha) and linters (ESLint) is recommended if automated checks are needed.
- The "open case" flow relies on a hardcoded server seed and session secret; move secrets into .env and rotate them when making production changes.

---

If you want this file expanded (add quick links, more file-level hints, or checklist items) or want Copilot-specific templates for common PR/workflow tasks, say so and it will be added.
