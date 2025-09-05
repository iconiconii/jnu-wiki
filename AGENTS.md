# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router (pages, layouts, `api/*`).
- `components/`: Reusable React components (PascalCase, e.g., `ServiceCard.tsx`).
- `lib/`: Client/server utilities (Supabase, email, data helpers).
- `data/`: Static/service data (`services.ts`).
- `hooks/`: Reusable hooks (`useDebounce.ts`).
- `types/`: TypeScript types and interfaces.
- `config/`: App config (`auth-config.json`).
- `supabase/`: SQL schemas, migrations, edge functions.
- `scripts/`: Maintenance scripts (e.g., DB migration runner).
- `public/`: Static assets.

## Build, Test, and Development Commands

- `npm run dev` / `npm run dev:turbo`: Start local dev server on `:3000` (Turbopack optional).
- `npm run build`: Production build (`.next/`).
- `npm run start`: Run the built app.
- `npm run lint`: ESLint for Next.js + TS rules.
- `npm run format` / `format:check`: Apply or verify Prettier formatting.
- `npm run type-check`: Strict TypeScript checks.
- Example: run Supabase migration with env set
  - `NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/run-migration.js`

## Coding Style & Naming Conventions

- TypeScript, strict mode; 2-space indent, no semicolons, single quotes, width 100.
- Components: PascalCase files and exported components.
- Hooks: camelCase starting with `use*` in `hooks/`.
- Utilities: lowerCamel or kebab file names in `lib/`.
- Run `npm run format` and `npm run lint` before pushing.

## Testing Guidelines

- No unit test runner is configured yet.
- Use `npm run type-check` and `npm run lint` in CI and locally.
- For manual QA: run `npm run dev`, verify critical flows (search, categories, admin, feedback).
- If adding tests, prefer `*.test.ts(x)` colocated with source or under `__tests__/`.

## Commit & Pull Request Guidelines

- Commit style: Conventional Commits used in history (e.g., `feat:`, `fix:`, `docs:`, `security:`).
- Keep commits focused; reference issues in the message body (`Closes #123`).
- PRs must include: clear summary, scope/impact, screenshots for UI changes, steps to validate, and updated docs when needed.
- Ensure CI passes (lint + type-check) before requesting review.

## Security & Configuration Tips

- Copy `.env.example` to `.env.local`; never commit secrets.
- Required keys: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (for scripts only).
- Do not expose service-role keys in client code; keep them to scripts/server.
