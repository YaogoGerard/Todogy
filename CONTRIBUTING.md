# Contributing to Todogy

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/Todogy.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Follow the [Quick Start](README.md#quick-start) to set up the project locally

## Development Workflow

```bash
# Backend
cd backend
npm run dev     # http://localhost:3000

# Frontend (new terminal)
cd frontend
npm run dev     # http://localhost:5173
```

## What to Work On

Check the [open issues](https://github.com/YaogoGerard/Todogy/issues) for a list of features and bugs. Good first issues are labelled `good first issue`.

## Pull Request Guidelines

- Keep PRs focused on a single concern
- Update or add tests if applicable
- Update docs if you change behaviour
- Make sure both `npm run build` pass in `backend/` and `frontend/`
- Write a clear commit message and PR description

## Code Style

- TypeScript strict mode
- ESLint and Prettier configs are in each package
- Use `import type` for type-only imports
- Prefer async/await over raw promises

## Reporting Bugs

Open an issue with:
- A clear title and description
- Steps to reproduce
- Expected vs actual behaviour
- Screenshots if relevant

## Code of Conduct

Be respectful and constructive. We're all here to learn and build together.
