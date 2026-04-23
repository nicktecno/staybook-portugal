# LLM usage (Cursor / Composer)

## What the model was used for

- **Scaffolding**: Next.js 16 app with TypeScript, Tailwind v4, App Router; `shadcn` CLI init and component adds.
- **Product & API design**: In-memory stay catalog (Portugal-focused), availability rules, pricing, moderation rules, REST shape aligned with the brief.
- **Implementation**: Route Handlers, client views (search, detail, checkout, confirmation), accessibility-minded labels and keyboard-friendly controls where practical, Vitest tests, GitHub Actions CI, documentation.

## Prompts / approach

- Single high-level prompt: build a Booking.com-style mid-scope product with required flows, Next + Tailwind + shadcn, API in Next, tests, CI, README tradeoffs.
- Iterative fixes after `next build` / `eslint` failures (Base UI `Button` without `asChild`, `Select` `onValueChange` typing, `PopoverTrigger` composition, `react-hooks/set-state-in-effect` deferral).

## Guardrails

- **Scope**: Mock persistence only (in-memory store); no real payments or PII persistence.
- **Moderation**: Small denylist + length checks — not production-grade safety.
- **External images**: Unsplash URLs with `next/image` remote patterns; no API keys in repo.
- **Human review**: Verify UX, dates, and copy before recording a demo or submitting.
