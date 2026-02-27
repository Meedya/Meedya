# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, API routes (`app/api/*`), and global styling in `app/globals.css`.
- `lib/`: shared server/client utilities (validation, helpers, integrations).
- `prisma/`: schema and migrations for the database layer.
- `public/`: static assets, including mirrored Framer assets under `public/framer-mirror/`.
- `scripts/`: utility scripts for local maintenance or migration tasks.
- `data/compare/` and `data/framer/`: reference artifacts used for Framer parity checks.

## Build, Test, and Development Commands
- `npm run dev`: start local development server.
- `npm run build`: production build check (required before PR/merge).
- `npm run start`: run production build locally.
- `npm run prisma:generate`: regenerate Prisma client.
- `npm run prisma:migrate`: apply migrations in deploy environments.
- `npm run prisma:push`: push schema changes without creating migrations (use carefully).
- `npm run prisma:studio`: inspect/edit database in Prisma Studio.

## Coding Style & Naming Conventions
- Language: TypeScript (`.ts/.tsx`), 2-space indentation, semicolons enabled.
- React components: `PascalCase`; variables/functions: `camelCase`; CSS classes: `kebab-case`.
- Prefer colocated logic in `app/` route segments; move reusable logic to `lib/`.
- Keep UI changes factual and measurable when matching Framer (sizes, spacing, colors from source).

## Testing Guidelines
- No dedicated test framework is configured yet.
- Minimum quality gate: `npm run build` must pass.
- For UI work, include manual verification on desktop and mobile; validate against Framer reference when applicable.
- If adding tests later, place unit tests next to source files as `*.test.ts`/`*.test.tsx`.

## Commit & Pull Request Guidelines
- Use short, imperative commit messages (examples from history: `Match ...`, `Tune ...`, `Fix ...`).
- Keep commits scoped to one concern (e.g., header spacing, hero typography, menu behavior).
- PRs should include:
  - clear summary of what changed and why,
  - affected routes/components,
  - screenshots (desktop + mobile) for UI changes,
  - note on Framer parity status if relevant.

## Security & Configuration Tips
- Do not commit secrets; use `.env` locally and keep `.env.example` updated.
- Ensure `Node >= 20` (see `package.json` engines).
- Review Prisma schema/migration impact before running deploy migrations.
- For GitHub operations, always use the repository SSH key explicitly:
  `GIT_SSH_COMMAND='ssh -i /root/.ssh/id_ed25519_github -o IdentitiesOnly=yes' git push origin main`
