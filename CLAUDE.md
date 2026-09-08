# FastForward Logistics — Ops Dashboard

See [BRIEF.md](BRIEF.md) for the project brief, target audience, and grading
requirements. This file is working context for AI tools — build commands and
conventions, not the design spec.

## Commands

```bash
npm install       # install dependencies
npm run dev       # start Vite dev server
npm run build     # type-check (vue-tsc) then production build to dist/
npm run preview   # preview the production build locally
```

There is no lint, format, or test setup in this project (intentionally —
excluded during scaffolding). `npm run build` running `vue-tsc -b` cleanly is
the only correctness gate.

## Stack

- Vue 3 (`<script setup>`, Composition API) + TypeScript
- Vite
- Vue Router (single route today: `/` → `DashboardView`)
- No Pinia — state so far is local `ref`/`computed` in `DashboardView.vue`;
  reach for it only if state needs to be shared across more than one view.

## Structure

```
src/
├── router/index.ts        # single "/" route to DashboardView
├── views/DashboardView.vue
├── components/MetricCard.vue
└── data/metrics.json      # mock dataset, keyed by period (7d/30d/90d)
design/aether/              # Aether design system: tokens, CSS, docs
```

## Design system

Visual design follows **Aether**, a frosted-glass component system — see
[design/aether/DESIGN.md](design/aether/DESIGN.md) for the full spec and
[design/aether/css/system.css](design/aether/css/system.css) for the tokens
and component classes (`.card`, `.btn`, `.tabs`, `.badge`, etc.), imported
globally via `src/style.css`. Build new UI out of those existing classes
rather than one-off styles — see the Do's/Don'ts section of DESIGN.md.

## Data

`src/data/metrics.json` is mock data, not a live API. It's keyed by period
(`7d` / `30d` / `90d`), each with `summary` (the four headline metrics),
`regionalPerformance`, and `exceptions`. `DashboardView.vue` switches between
periods via the tab filter — that's the project's one required interactive
element per the brief.

`MetricCard`'s `trendSentiment` prop (`positive` / `negative` / `neutral`)
reflects whether a trend is *good or bad*, not its literal sign — e.g. fewer
open exceptions is `positive` even though the delta is negative. Keep badge
text short; the base `.badge` class has a fixed height and doesn't wrap
gracefully (see commit `f85f46a` for why this matters).
