export type PeriodKey = 'all' | '7d' | '30d' | '90d'
export type Granularity = 'day' | 'week' | 'month'

export interface RegionDay {
  shipments: number
  onTimeRate: number
}

export interface DayRecord {
  date: string
  shipmentVolume: number
  onTimeRate: number
  regions: Record<string, RegionDay>
}

const PERIOD_DAY_COUNT: Record<Exclude<PeriodKey, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
}

export function sliceDays(days: DayRecord[], period: PeriodKey): DayRecord[] {
  if (period === 'all') return days
  return days.slice(-PERIOD_DAY_COUNT[period])
}

export function previousSliceDays(days: DayRecord[], period: PeriodKey): DayRecord[] {
  if (period === 'all') return []
  const n = PERIOD_DAY_COUNT[period]
  return days.slice(-(n * 2), -n)
}

export function granularityForPeriod(period: PeriodKey): Granularity {
  if (period === '90d') return 'week'
  if (period === 'all') return 'month'
  return 'day'
}

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function shortDayLabel(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${MONTH_LABELS[Number(month) - 1]} ${Number(day)}`
}

export interface Bucket {
  label: string
  volume: number
  onTimeRate: number
}

export function bucketDays(daysSlice: DayRecord[], granularity: Granularity): Bucket[] {
  if (granularity === 'day') {
    return daysSlice.map((d) => ({
      label: shortDayLabel(d.date),
      volume: d.shipmentVolume,
      onTimeRate: d.onTimeRate,
    }))
  }

  const buckets: Bucket[] = []

  if (granularity === 'month') {
    // Group by actual calendar month rather than a fixed day-count stride —
    // a fixed 30-day stride drifts against real month boundaries over a
    // full year, producing duplicate/skipped month labels.
    let chunk: DayRecord[] = []
    let currentMonth = daysSlice[0]?.date.slice(0, 7)

    const flush = () => {
      if (chunk.length === 0) return
      const volume = chunk.reduce((sum, d) => sum + d.shipmentVolume, 0)
      const weightedOnTime = chunk.reduce((sum, d) => sum + d.onTimeRate * d.shipmentVolume, 0)
      buckets.push({
        label: MONTH_LABELS[Number(chunk[0].date.slice(5, 7)) - 1],
        volume,
        onTimeRate: volume > 0 ? weightedOnTime / volume : 0,
      })
    }

    for (const day of daysSlice) {
      const month = day.date.slice(0, 7)
      if (month !== currentMonth) {
        flush()
        chunk = []
        currentMonth = month
      }
      chunk.push(day)
    }
    flush()

    return buckets
  }

  const groupSize = 7
  for (let i = 0; i < daysSlice.length; i += groupSize) {
    const chunk = daysSlice.slice(i, i + groupSize)
    const volume = chunk.reduce((sum, d) => sum + d.shipmentVolume, 0)
    const weightedOnTime = chunk.reduce((sum, d) => sum + d.onTimeRate * d.shipmentVolume, 0)
    const label = shortDayLabel(chunk[0].date)

    buckets.push({
      label,
      volume,
      onTimeRate: volume > 0 ? weightedOnTime / volume : 0,
    })
  }

  return buckets
}

export function aggregateRegions(daysSlice: DayRecord[]): { region: string; shipments: number; onTimeRate: number }[] {
  const totals = new Map<string, { shipments: number; weightedOnTime: number }>()

  for (const day of daysSlice) {
    for (const [region, data] of Object.entries(day.regions)) {
      const entry = totals.get(region) ?? { shipments: 0, weightedOnTime: 0 }
      entry.shipments += data.shipments
      entry.weightedOnTime += data.onTimeRate * data.shipments
      totals.set(region, entry)
    }
  }

  return [...totals.entries()]
    .map(([region, { shipments, weightedOnTime }]) => ({
      region,
      shipments,
      onTimeRate: shipments > 0 ? weightedOnTime / shipments : 0,
    }))
    .sort((a, b) => b.shipments - a.shipments)
}
