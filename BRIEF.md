# FastForward Logistics — Ops Dashboard

## Summary

FastForward Logistics is a mid-size freight and supply chain company. Their operations
team currently tracks performance across scattered spreadsheets. This project delivers
a single internal dashboard that the VP of Operations can pull up in leadership meetings
to see, at a glance, how the business is running.

**Audience:** VP of Operations and her leadership team — not drivers or dispatchers.
The dashboard should read as an executive-level operational snapshot: quick to scan,
confident, no raw data-entry or admin tooling.

**Core data & metrics** the dashboard must surface:

- **Shipment volume** — total shipments over a selectable period
- **On-time delivery rate** — percentage on-time, with a sense of trend
- **Regional performance** — a breakdown/comparison across regions
- **Open exceptions** — count and list of unresolved shipment issues needing attention

Data source: a mock dataset (`src/data/metrics.json`) with realistic numbers (see Step 2.6).

**Interactivity requirement:** at least one interactive element that actually changes
what's displayed — a date-range filter or region selector, not a decorative control.

## Design

Design system: **Aether** — a frosted-glass design system inspired by Apple's light
material language. Full token spec: [design/aether/DESIGN.md](design/aether/DESIGN.md).
Source tokens/CSS: [design/aether/css/system.css](design/aether/css/system.css).
Static previews: [design/aether/html/preview.html](design/aether/html/preview.html).

Key visual language to carry into the dashboard:

- Cool pearl page background (`#eef1f6`); translucent glass cards (24px radius,
  `rounded.xl`) for metric tiles and panels
- Charcoal (`#1d1d1f`) as the single anchor color for primary actions, active states,
  and key numerals — no added chroma beyond system blue (`#0a84ff`) for focus/links
- Pill geometry (`rounded.full`) for buttons, tabs, and the region/date filter control
- Inter for all text; JetBrains Mono for numeric/tabular figures — good fit for
  shipment counts and percentages
- Lucide icons only, stroked at 1.75, `currentColor`
- Every glass surface keeps its inset bevel + hairline border + soft shadow — don't
  flatten cards to solid fills

Layout: 1200px content frame, single-column stack on mobile, 12-column grid on desktop.
Cards use 1.5rem interior padding; sections separate by 3–4.5rem of vertical space per
the system's spacing scale.

## What "done" looks like (grading requirements)

This build is graded across three areas (Capstone rubric, P200 tier). The brief and
the build must satisfy all of them:

1. **Does it work** — site live and accessible (password-protect it), core flows work
   end to end, the dashboard reflects this brief (shipment volume, on-time rate,
   regional performance, open exceptions), and at least one interactive element
   genuinely functions.
2. **Is the repo set up right** — this BRIEF.md is present and reads as a plan, not a
   description written after the fact; AI scaffolding (this file, CLAUDE.md, the
   `design/aether` docs) is organized in a logical place, not scattered; folder
   structure makes sense to an outside reviewer; commit history shows real,
   incremental progress with descriptive messages — not one big push at the end.
3. **Does it look right and show your thinking** — the dashboard feels like a real
   internal ops tool built for FastForward Logistics specifically, not a generic
   template; a first-time visitor in that VP's role could orient themselves without
   help; design decisions (hierarchy, spacing, data presentation) are intentional and
   traceable back to this brief.

## Out of scope

No additional nice-to-haves beyond the above — keep the build focused on meeting the
grading requirements cleanly rather than adding extra features.
