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
node scripts/generate-metrics.mjs   # regenerate src/data/metrics.json
```

There is no lint, format, or test setup in this project (intentionally —
excluded during scaffolding). `npm run build` running `vue-tsc -b` cleanly is
the only correctness gate.

## Stack

- Vue 3 (`<script setup>`, Composition API) + TypeScript
- Vite
- Vue Router (single route today: `/` → `DashboardView`)
- Chart.js via `vue-chartjs` for the two trend charts
- No Pinia — state so far is local `ref`/`computed` in `DashboardView.vue`;
  reach for it only if state needs to be shared across more than one view.

## Structure

```
src/
├── router/index.ts             # single "/" route to DashboardView
├── views/DashboardView.vue     # owns selectedPeriod state and all derived data
├── components/
│   ├── MetricCard.vue
│   ├── ShipmentsChart.vue      # bar chart, wraps vue-chartjs <Bar>
│   └── OnTimeChart.vue         # line/area chart, wraps vue-chartjs <Line>
├── lib/
│   ├── chartSetup.ts           # Chart.js component registration (import once, in main.ts)
│   ├── chartTheme.ts           # Aether-matched colors/fonts for chart options
│   ├── dateRanges.ts           # period slicing, bucketing, regional aggregation
│   └── trend.ts                # formatTrend() — delta → {text, sentiment}
└── data/metrics.json           # generated mock dataset — see scripts/generate-metrics.mjs
design/aether/                   # Aether design system: tokens, CSS, docs
scripts/generate-metrics.mjs     # deterministic (seeded) generator for metrics.json
```

## Design system

Visual design follows **Aether**, a frosted-glass component system — see
[design/aether/DESIGN.md](design/aether/DESIGN.md) for the full spec and
[design/aether/css/system.css](design/aether/css/system.css) for the tokens
and component classes (`.card`, `.btn`, `.tabs`, `.badge`, etc.), imported
globally via `src/style.css`. Build new UI out of those existing classes
rather than one-off styles — see the Do's/Don'ts section of DESIGN.md.

Chart.js draws to `<canvas>`, so it can't read Aether's CSS custom
properties directly — `src/lib/chartTheme.ts` hardcodes the same hex values
as tokens in `system.css`. If a token value changes there, update it here
too.

## Data

`src/data/metrics.json` is **generated**, not hand-written — run
`node scripts/generate-metrics.mjs` after changing its parameters. The
generator uses a seeded PRNG, so output is stable unless you touch the
script.

Shape:

```ts
{
  days: Array<{
    date: string        // "YYYY-MM-DD", full year 2025
    shipmentVolume: number
    onTimeRate: number  // national, volume-weighted across regions
    regions: Record<RegionName, { shipments: number; onTimeRate: number }>
  }>,
  exceptions: Array<{
    id: string; shipmentId: string; region: string; issue: string
    status: 'Open' | 'Investigating' | 'Resolved'
    reportedAt: string  // "YYYY-MM-DD"
  }>
}
```

`DashboardView.vue` derives everything else from this at render time —
period slicing, chart bucketing (`day`/`week`/`month` granularity depending
on the selected range, see `granularityForPeriod`), regional roll-ups, and
trend deltas vs. the prior equal-length window. The period tabs (`All` /
`7 days` / `30 days` / `90 days`) are the project's one required interactive
element per the brief; `All` shows plain totals with no trend badge, since
there's no "prior year" to compare against.

`MetricCard`'s `trendSentiment` prop (`positive` / `negative` / `neutral`)
reflects whether a trend is *good or bad*, not its literal sign — e.g. fewer
open exceptions is `positive` even though the delta is negative. See
`formatTrend()`'s `goodDirection` param. Keep badge text short; the base
`.badge` class has a fixed height and doesn't wrap gracefully (see commit
`f85f46a` for why this matters).

The exceptions generator explicitly guarantees a minimum count in the
7/30/90-day windows (see the comment above `addException` calls in
`generate-metrics.mjs`) — pure volume-weighted random sampling across a
full year left the near-term windows empty far too often, since most
incidents "age into" Resolved status by December.
