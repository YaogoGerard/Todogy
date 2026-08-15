<p align="center">
  <img src="frontend/src/assets/logo.png" width="80" alt="Todogy logo" />
</p>

<h1 align="center">Todogy</h1>

<p align="center">
  <strong>Fullstack todo app — guest mode + OAuth2 persistence</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?logo=vuedotjs&logoColor=fff" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Hono-E36002?logo=hono&logoColor=fff" alt="Hono" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=fff" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?logo=tailwindcss&logoColor=fff" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/JWT-000?logo=jsonwebtokens&logoColor=fff" alt="JWT" />
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome" />
</p>

---

## Features

- **Dual mode** — write tasks without an account (in-memory), log in to persist them server-side
- **OAuth2 authentication** — Google & GitHub login via Arctic
- **JWT with refresh rotation** — 15 min accessToken, 7-day refreshToken in httpOnly cookie, rotated on each refresh
- **Security hardening** — CORS allowlist, rate-limited auth endpoints, zod request validation, proper 4xx error codes
- **Progress tracking** — circular progress dial + confetti at 100%
- **Guest→Auth merge** — in-memory tasks sync to the backend on login
- **Responsive** — glassmorphism Orbit design, mobile-first

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vue 3, TypeScript, Vite, Pinia, Vue Router, Tailwind CSS v4 |
| Backend | Hono, TypeScript, Mongoose, Arctic, bcryptjs |
| Database | MongoDB Atlas |
| CI/CD | Docker multi-stage, GitHub Actions, Render |

## Quick Start

```bash
git clone https://github.com/YaogoGerard/Todogy.git
cd Todogy

# Backend
cd backend
cp .env.example .env      # fill in your MongoDB & OAuth credentials
npm install
npm run dev                # → http://localhost:3000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                # → http://localhost:5173
```

## Testing

- **Backend unit tests** ([Vitest](https://vitest.dev)): `backend/tests/` — services and routes with mocked models.
- **Backend end-to-end tests**: `backend/tests/e2e/` — the **real** Hono app + **real MongoDB** (`mongodb-memory-server`) + real bcrypt/JWT/cookies/rate-limiting: register/login, todo CRUD + per-user scoping, refresh-token rotation, logout revocation, rate limits, OAuth callback redirects.
- **Frontend unit tests**: `frontend/tests/` — stores, components, views and utils.
- **Frontend end-to-end tests** ([Playwright](https://playwright.dev), real Chromium): `frontend/e2e/` — the guest/unauthenticated experience and sign-in transitions. The API is stubbed, so no backend is required.

```bash
cd backend && npm test                          # 43 unit + 18 real-DB E2E
cd frontend && npm test                         # stores, components and views tests
cd frontend && npx playwright install chromium  # once, to download the browser
cd frontend && npm run test:e2e                 # 18 browser end-to-end tests
```

Tests and builds run as part of the [deploy pipeline](.github/workflows/deploy.yml) on every push to the `deploy` branch: the `test` job (including the Playwright suite) must pass before the backend (Render) and frontend (Firebase Hosting) deploy.

## Documentation

| Doc | What it covers |
|---|---|
| [01 — PRD](docs/01_prd.md) | Problem, users, use cases, out of scope |
| [02 — SRS](docs/02_srs.md) | Verifiable requirements (MUST / SHOULD / MAY) |
| [03 — System Contract](docs/03_system_contract.md) | Invariants, guarantees, forbidden actions |
| [04 — Req → Arch](docs/04_requirements_to_arch.md) | Responsibility map, component dependencies |
| [05 — Modeling](docs/05_modeling.md) | C4 diagrams, UML sequences |

## Project Structure

```
todogy/
├── backend/
│   └── src/
│       ├── config/           # env, constants
│       ├── modules/
│       │   ├── auth/         # register, login, OAuth, refresh, middleware
│       │   ├── todos/        # CRUD with ownership filter
│       │   └── users/        # Mongoose model
│       └── shared/           # database, zod validation, rate limiting, HttpError
├── frontend/
│   └── src/
│       ├── api/              # Axios instance, auth & todos endpoints
│       ├── stores/           # Pinia (auth, todos)
│       ├── views/            # TodosView, SignInView, SignUpView
│       ├── components/       # NavBar, OAuthButtons
│       └── utils/            # OAuth / error message helpers
└── docs/                     # Engineering documentation
```

## Architecture

```
Vue 3 SPA ◄──HTTP/JSON──► Hono API ◄──Mongoose──► MongoDB Atlas
                              │
                    ┌─────────┴─────────┐
                Google OAuth        GitHub OAuth
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to get started. PRs are welcome!

## License

[MIT](LICENSE)
