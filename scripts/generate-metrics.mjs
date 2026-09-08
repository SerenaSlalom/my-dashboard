// Generates src/data/metrics.json — a full year of deterministic mock data
// for the FastForward Logistics dashboard. Re-run with `node scripts/generate-metrics.mjs`
// after changing the parameters below; the seeded PRNG keeps output stable otherwise.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = join(__dirname, '../src/data/metrics.json')

// Seeded PRNG (mulberry32) so the generated dataset is reproducible.
function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const randRange = (min, max) => min + rand() * (max - min)
const randInt = (min, max) => Math.floor(randRange(min, max + 1))

const YEAR = 2025
const START = new Date(Date.UTC(YEAR, 0, 1))
const END = new Date(Date.UTC(YEAR, 11, 31))
const DAY_MS = 24 * 60 * 60 * 1000

const HOLIDAYS = new Set([
  '2025-01-01', // New Year's Day
  '2025-05-26', // Memorial Day
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-11-28', // Day after Thanksgiving
  '2025-12-24', // Christmas Eve
  '2025-12-25', // Christmas Day
  '2025-12-31', // New Year's Eve
])

const REGIONS = [
  { name: 'Northeast', share: 0.24, onTimeOffset: 1.0 },
  { name: 'Southeast', share: 0.22, onTimeOffset: -1.0 },
  { name: 'Midwest', share: 0.2, onTimeOffset: -1.8 },
  { name: 'Southwest', share: 0.16, onTimeOffset: 0.6 },
  { name: 'West', share: 0.12, onTimeOffset: -0.5 },
  { name: 'Pacific Northwest', share: 0.06, onTimeOffset: 2.2 },
]

// Monthly on-time penalty (points subtracted from base rate) — low mid-year,
// ramps up through Q4 peak season congestion.
const MONTHLY_ONTIME_PENALTY = [1, 1, 0.5, 0, 0, 0.5, 1, 1, 1.5, 2, 4, 5]

const toISODate = (d) => d.toISOString().slice(0, 10)

function dailyTrendVolume(dayIndex, totalDays) {
  // Linear seasonal growth from ~170/day in January to ~250/day in December.
  const base = 170 + (250 - 170) * (dayIndex / totalDays)
  return base
}

const days = []
const totalDays = Math.round((END - START) / DAY_MS) + 1

for (let i = 0; i < totalDays; i++) {
  const date = new Date(START.getTime() + i * DAY_MS)
  const iso = toISODate(date)
  const month = date.getUTCMonth()
  const weekday = date.getUTCDay() // 0 = Sunday, 6 = Saturday

  let weekdayFactor = 1
  if (weekday === 0) weekdayFactor = 0.42
  else if (weekday === 6) weekdayFactor = 0.58

  const holidayFactor = HOLIDAYS.has(iso) ? 0.35 : 1

  const baseNational = dailyTrendVolume(i, totalDays - 1)
  const onTimeBaseNational = 96 - MONTHLY_ONTIME_PENALTY[month] + (weekday === 0 || weekday === 6 ? 1 : 0)

  const regionEntries = {}
  let nationalVolume = 0
  let weightedOnTimeSum = 0

  for (const region of REGIONS) {
    const regionNoise = randRange(-0.1, 0.1)
    const regionVolume = Math.max(
      0,
      Math.round(baseNational * region.share * weekdayFactor * holidayFactor * (1 + regionNoise)),
    )
    const regionOnTimeNoise = randRange(-1.5, 1.5)
    const regionOnTime = Math.min(99, Math.max(80, onTimeBaseNational + region.onTimeOffset + regionOnTimeNoise))

    regionEntries[region.name] = {
      shipments: regionVolume,
      onTimeRate: Math.round(regionOnTime * 10) / 10,
    }

    nationalVolume += regionVolume
    weightedOnTimeSum += regionOnTime * regionVolume
  }

  const nationalOnTime = nationalVolume > 0 ? weightedOnTimeSum / nationalVolume : onTimeBaseNational

  days.push({
    date: iso,
    shipmentVolume: nationalVolume,
    onTimeRate: Math.round(nationalOnTime * 10) / 10,
    regions: regionEntries,
  })
}

// ----- Exceptions -------------------------------------------------------

const ISSUES = [
  'Delayed at customs',
  'Carrier delay — weather',
  'Damaged freight reported',
  'Missed dock appointment',
  'Incorrect manifest',
  'Route rerouted — closure',
  'Port congestion delay',
  'Temperature excursion',
  'Address correction needed',
  'Duplicate BOL filed',
]

// Weighted sampling by daily shipment volume (busier days generate more
// exceptions, per the brief) with a recency bias layered on top — without
// it, exceptions land uniformly across the year and almost all read as
// "Resolved" by December, leaving the Open Exceptions panel empty for most
// periods. Real incident backlogs skew recent; this keeps a healthy mix of
// Open/Investigating within the trailing 7/30/90-day windows.
const dayWeights = days.map((d, i) => {
  const recencyBoost = 0.3 + 0.7 * (i / (days.length - 1))
  return d.shipmentVolume * recencyBoost
})
const totalWeight = dayWeights.reduce((a, b) => a + b, 0)
function pickDayIndexWeighted() {
  let target = rand() * totalWeight
  for (let i = 0; i < dayWeights.length; i++) {
    target -= dayWeights[i]
    if (target <= 0) return i
  }
  return dayWeights.length - 1
}

function pickRegionWeighted() {
  let target = rand()
  for (const region of REGIONS) {
    target -= region.share
    if (target <= 0) return region.name
  }
  return REGIONS[REGIONS.length - 1].name
}

function statusForDaysAgo(daysAgo) {
  const roll = rand()
  if (daysAgo > 21) return roll < 0.92 ? 'Resolved' : roll < 0.97 ? 'Investigating' : 'Open'
  if (daysAgo > 7) return roll < 0.6 ? 'Resolved' : roll < 0.85 ? 'Investigating' : 'Open'
  return roll < 0.2 ? 'Resolved' : roll < 0.55 ? 'Investigating' : 'Open'
}

const endDate = END
const exceptions = []
let nextId = 1001

function addException(daysAgo) {
  const reportedDate = new Date(endDate.getTime() - daysAgo * DAY_MS)
  exceptions.push({
    id: `EXC-${nextId++}`,
    shipmentId: `SHP-${70000 + randInt(0, 19999)}`,
    region: pickRegionWeighted(),
    issue: ISSUES[randInt(0, ISSUES.length - 1)],
    status: statusForDaysAgo(daysAgo),
    reportedAt: toISODate(reportedDate),
  })
}

// Explicit windows guarantee every period tab (7/30/90/All) has a
// realistic, non-empty set of exceptions instead of leaving it to chance —
// pure volume-weighted sampling across a full year left the near-term
// windows empty far too often.
for (let i = 0; i < 5; i++) addException(randInt(0, 6)) // last 7 days
for (let i = 0; i < 9; i++) addException(randInt(7, 29)) // 8–30 days ago
for (let i = 0; i < 14; i++) addException(randInt(30, 89)) // 31–90 days ago

// Remainder spread across the full year, weighted by shipment volume, for
// historical texture beyond the 90-day window.
const REMAINING_COUNT = 42
for (let i = 0; i < REMAINING_COUNT; i++) {
  const dayIndex = pickDayIndexWeighted()
  const daysAgo = Math.round((endDate - (START.getTime() + dayIndex * DAY_MS)) / DAY_MS)
  addException(daysAgo)
}

exceptions.sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1))

const output = { days, exceptions }
writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n')
console.log(`Wrote ${days.length} days and ${exceptions.length} exceptions to ${OUT_PATH}`)
