# Phase plan — Node 24 + dependency audit (REQ-0228 / REQ-0229)

**Status:** DONE — Gate 1 APPROVED (`GATE-0003`); synthesis complete 2026-09-09  
**Resume token:** `gate1-node24-deps-20260909` (resolved)

## Wave 0 — Preconditions (human / env)

1. Install/use **Node.js 24.x** locally (current machine: `v22.22.3`) before claiming build evidence.
2. Do **not** include dirty UI WIP files in the deps commit.
3. Optional: `npm i -g vercel@latest` then confirm project Node / update-required (human dashboard).

## Wave 1 — REQ-0228 (engines)

1. Add `"engines": { "node": "24.x" }` to `package.json`.
2. Bump `@types/node` → `^24`.
3. Update README Node requirement to 24.x; optional `.nvmrc` = `24`.
4. Confirm `vercel.json` unchanged for Node (engines override dashboard).

## Wave 2 — REQ-0229 (compatible bumps)

1. Same-major / security: `next` + `eslint-config-next` → latest 16.x; `axios`, `js-cookie`, `postcss`, `@sentry/nextjs`, TanStack 5.x, Radix minors, `next-auth` latest beta.32+, `vitest` 4.x, React 19.2.x, etc.
2. Extend `overrides` for transitive CVEs (`uuid`, `deepmerge-ts`, brace-expansion/nanoid/form-data as needed) — **never** `audit fix --force` exceljs downgrade.
3. Fix install-scripts / allowScripts for Prisma, sharp, esbuild, `@sentry/cli` if blocked.
4. `rm -rf node_modules && npm install` → `npm audit` must be **0**.

## Wave 3 — Prove / Verify (Red Team, separate)

```bash
npm run lint && npm run test && npm run test:invalidate && npm run build
```

Smoke: login/OAuth path, CSV/Excel export, product image path.

## Explicit non-goals

Prisma 7+, Tailwind 4, Zod 4, react-table 9, lucide 1, Stripe 22, Zod/resolvers majors, Guardrails re-implementation (already largely present).
