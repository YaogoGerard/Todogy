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

- **Dual mode** — write tasks without an account (localStorage), log in to persist them server-side
- **OAuth2 authentication** — Google & GitHub login via Arctic
- **JWT with refresh rotation** — 15 min accessToken, 7-day refreshToken in httpOnly cookie, rotated on each refresh
- **Progress tracking** — circular progress dial + confetti at 100%
- **Guest→Auth merge** — local tasks sync to the backend on login
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
│       └── shared/database/  # MongoDB connection
├── frontend/
│   └── src/
│       ├── api/              # Axios instance, auth & todos endpoints
│       ├── stores/           # Pinia (auth, todos)
│       ├── views/            # TodosView, SignInView, SignUpView
│       └── components/       # NavBar
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
