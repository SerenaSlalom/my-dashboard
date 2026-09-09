<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '../components/MetricCard.vue'
import ShipmentsChart from '../components/ShipmentsChart.vue'
import OnTimeChart from '../components/OnTimeChart.vue'
import fastForwardLogo from '../assets/fastforward-logo.svg'
import metricsData from '../data/metrics.json'
import {
  sliceDays,
  previousSliceDays,
  granularityForPeriod,
  bucketDays,
  aggregateRegions,
  type PeriodKey,
  type DayRecord,
} from '../lib/dateRanges'
import { formatTrend } from '../lib/trend'

interface ExceptionRecord {
  id: string
  shipmentId: string
  region: string
  issue: string
  status: 'Open' | 'Investigating' | 'Resolved'
  reportedAt: string
}

const days = metricsData.days as DayRecord[]
const exceptions = metricsData.exceptions as ExceptionRecord[]

const periodOptions: { key: PeriodKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

const MONTH_OPTIONS = [
  { key: '2025-01', label: 'January' },
  { key: '2025-02', label: 'February' },
  { key: '2025-03', label: 'March' },
  { key: '2025-04', label: 'April' },
  { key: '2025-05', label: 'May' },
  { key: '2025-06', label: 'June' },
  { key: '2025-07', label: 'July' },
  { key: '2025-08', label: 'August' },
  { key: '2025-09', label: 'September' },
  { key: '2025-10', label: 'October' },
  { key: '2025-11', label: 'November' },
  { key: '2025-12', label: 'December' },
]

const selectedPeriod = ref<PeriodKey>('all')
// A specific month takes precedence over the 7/30/90/All tabs when set —
// they're two ways of picking a range, not two ranges to intersect.
const selectedMonth = ref<string | null>(null)

const monthSelectModel = computed({
  get: () => selectedMonth.value ?? '',
  set: (value: string) => {
    selectedMonth.value = value === '' ? null : value
  },
})

function selectPeriod(period: PeriodKey) {
  selectedPeriod.value = period
  selectedMonth.value = null
}

// Resolves whichever filter is active (month dropdown wins if set) into the
// days to show, the prior equal-length window for trend comparison, a
// display label, and the chart bucketing granularity to use.
const activeRange = computed(() => {
  if (selectedMonth.value) {
    const monthIndex = MONTH_OPTIONS.findIndex((m) => m.key === selectedMonth.value)
    const monthDays = days.filter((d) => d.date.slice(0, 7) === selectedMonth.value)
    const previousMonthKey = monthIndex > 0 ? MONTH_OPTIONS[monthIndex - 1].key : null
    const previousMonthDays = previousMonthKey
      ? days.filter((d) => d.date.slice(0, 7) === previousMonthKey)
      : []

    return {
      current: monthDays,
      previous: previousMonthDays,
      label: `${MONTH_OPTIONS[monthIndex].label} 2025`,
      granularity: 'day' as const,
      hasTrend: previousMonthKey !== null,
    }
  }

  return {
    current: sliceDays(days, selectedPeriod.value),
    previous: previousSliceDays(days, selectedPeriod.value),
    label:
      selectedPeriod.value === 'all'
        ? 'All of 2025'
        : `Last ${sliceDays(days, selectedPeriod.value).length} days`,
    granularity: granularityForPeriod(selectedPeriod.value),
    hasTrend: selectedPeriod.value !== 'all',
  }
})

const currentDays = computed(() => activeRange.value.current)
const previousDays = computed(() => activeRange.value.previous)
const periodLabel = computed(() => activeRange.value.label)

const chartBuckets = computed(() => bucketDays(currentDays.value, activeRange.value.granularity))
const chartLabels = computed(() => chartBuckets.value.map((b) => b.label))
const volumeSeries = computed(() => chartBuckets.value.map((b) => b.volume))
const onTimeSeries = computed(() => chartBuckets.value.map((b) => Math.round(b.onTimeRate * 10) / 10))

function sumBy(list: DayRecord[], pick: (d: DayRecord) => number) {
  return list.reduce((total, d) => total + pick(d), 0)
}

function weightedAvgOnTime(list: DayRecord[]) {
  const totalVolume = sumBy(list, (d) => d.shipmentVolume)
  if (totalVolume === 0) return 0
  return sumBy(list, (d) => d.onTimeRate * d.shipmentVolume) / totalVolume
}

function exceptionsReportedIn(list: DayRecord[], statusFilter?: (status: ExceptionRecord['status']) => boolean) {
  if (list.length === 0) return 0
  const start = list[0].date
  const end = list[list.length - 1].date
  return exceptions.filter(
    (e) => e.reportedAt >= start && e.reportedAt <= end && (!statusFilter || statusFilter(e.status)),
  ).length
}

const currentVolume = computed(() => sumBy(currentDays.value, (d) => d.shipmentVolume))
const currentOnTime = computed(() => weightedAvgOnTime(currentDays.value))
const previousVolume = computed(() => sumBy(previousDays.value, (d) => d.shipmentVolume))
const previousOnTime = computed(() => weightedAvgOnTime(previousDays.value))

const openExceptionsCount = computed(() =>
  exceptionsReportedIn(currentDays.value, (status) => status !== 'Resolved'),
)
const openedInCurrentWindow = computed(() => exceptionsReportedIn(currentDays.value))
const openedInPreviousWindow = computed(() => exceptionsReportedIn(previousDays.value))

const metrics = computed(() => {
  const hasTrend = activeRange.value.hasTrend

  const volumeTrend = hasTrend
    ? formatTrend(currentVolume.value, previousVolume.value, 'percent', 'up')
    : undefined
  const onTimeTrend = hasTrend
    ? formatTrend(currentOnTime.value, previousOnTime.value, 'points', 'up')
    : undefined
  const exceptionsTrend = hasTrend
    ? formatTrend(openedInCurrentWindow.value, openedInPreviousWindow.value, 'count', 'down')
    : undefined

  return [
    {
      key: 'shipmentVolume',
      label: 'Shipment Volume',
      value: Math.round(currentVolume.value).toLocaleString(),
      icon: 'package' as const,
      trend: volumeTrend?.text,
      sentiment: volumeTrend?.sentiment ?? 'neutral',
    },
    {
      key: 'onTimeRate',
      label: 'On-Time Delivery',
      value: `${currentOnTime.value.toFixed(1)}%`,
      icon: 'clock' as const,
      trend: onTimeTrend?.text,
      sentiment: onTimeTrend?.sentiment ?? 'neutral',
    },
    {
      key: 'regionsTracked',
      label: 'Regions Tracked',
      value: '6',
      icon: 'map-pin' as const,
      trend: 'No change',
      sentiment: 'neutral' as const,
    },
    {
      key: 'openExceptions',
      label: 'Open Exceptions',
      value: `${openExceptionsCount.value}`,
      icon: 'triangle-alert' as const,
      trend: exceptionsTrend?.text,
      sentiment: exceptionsTrend?.sentiment ?? 'neutral',
    },
  ]
})

const regionalPerformance = computed(() => aggregateRegions(currentDays.value))

const EXCEPTIONS_DISPLAY_LIMIT = 8
const visibleExceptions = computed(() => {
  const start = currentDays.value[0]?.date
  const end = currentDays.value[currentDays.value.length - 1]?.date
  const inRange = exceptions
    .filter((e) => !start || !end || (e.reportedAt >= start && e.reportedAt <= end))
    .sort((a, b) => (a.reportedAt < b.reportedAt ? 1 : -1))

  return {
    items: inRange.slice(0, EXCEPTIONS_DISPLAY_LIMIT),
    total: inRange.length,
  }
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="dashboard-titles">
        <img :src="fastForwardLogo" alt="FastForward Logistics" class="brand-logo" />
      </div>

      <div class="dashboard-actions row-wrap">
        <div class="tabs" role="tablist" aria-label="Select time period">
          <button
            v-for="option in periodOptions"
            :key="option.key"
            class="tab"
            :class="{ 'is-active': selectedMonth === null && selectedPeriod === option.key }"
            role="tab"
            :aria-selected="selectedMonth === null && selectedPeriod === option.key"
            type="button"
            @click="selectPeriod(option.key)"
          >
            {{ option.label }}
          </button>
        </div>

        <div class="btn btn-secondary month-filter">
          <select v-model="monthSelectModel" class="month-filter-select" aria-label="Filter by month">
            <option value="">All months</option>
            <option v-for="month in MONTH_OPTIONS" :key="month.key" :value="month.key">
              {{ month.label }}
            </option>
          </select>
          <svg
            class="month-filter-chevron"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </div>
    </header>

    <section class="metrics-grid">
      <MetricCard
        v-for="metric in metrics"
        :key="metric.key"
        :label="metric.label"
        :value="metric.value"
        :icon="metric.icon"
        :trend="metric.trend"
        :trend-sentiment="metric.sentiment"
      />
    </section>

    <section class="charts-grid">
      <div class="card card-raised chart-card">
        <div class="card-header">
          <h2 class="card-title">Shipment Volume</h2>
          <span class="text-label">{{ periodLabel }}</span>
        </div>
        <ShipmentsChart :labels="chartLabels" :values="volumeSeries" />
      </div>

      <div class="card card-raised chart-card">
        <div class="card-header">
          <h2 class="card-title">On-Time Delivery</h2>
          <span class="text-label">{{ periodLabel }}</span>
        </div>
        <OnTimeChart :labels="chartLabels" :values="onTimeSeries" />
      </div>
    </section>

    <section class="dashboard-panels">
      <div class="card card-raised panel-regional">
        <div class="card-header">
          <h2 class="card-title">Regional Performance</h2>
          <span class="text-label">{{ periodLabel }}</span>
        </div>
        <table v-if="regionalPerformance.length" class="regional-table">
          <thead>
            <tr>
              <th class="text-label">Region</th>
              <th class="text-label">Shipments</th>
              <th class="text-label">On-Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="region in regionalPerformance" :key="region.region">
              <td>{{ region.region }}</td>
              <td class="text-mono">{{ region.shipments.toLocaleString() }}</td>
              <td class="text-mono">{{ region.onTimeRate.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-body empty-state">No regional data for this period.</p>
      </div>

      <div class="card card-raised panel-exceptions">
        <div class="card-header">
          <h2 class="card-title">Open Exceptions</h2>
          <span v-if="visibleExceptions.total > visibleExceptions.items.length" class="text-label">
            Showing {{ visibleExceptions.items.length }} of {{ visibleExceptions.total }}
          </span>
        </div>
        <ul v-if="visibleExceptions.items.length" class="exceptions-list">
          <li v-for="exception in visibleExceptions.items" :key="exception.id" class="exception-item">
            <div class="exception-row">
              <span class="text-mono text-label">{{ exception.id }}</span>
              <span class="badge" :class="exception.status === 'Resolved' ? 'is-positive' : 'is-neutral'">
                {{ exception.status }}
              </span>
            </div>
            <p class="text-body exception-issue">{{ exception.issue }}</p>
            <p class="text-micro">{{ exception.region }} · {{ exception.shipmentId }} · {{ exception.reportedAt }}</p>
          </li>
        </ul>
        <p v-else class="text-body empty-state">No open exceptions for this period — clean run.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-2xl) var(--space-lg) var(--space-3xl);
  display: flex;
  flex-direction: column;
  gap: var(--space-2xl);
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.brand-logo {
  /* Matches the rendered width of the period toggle (.tabs) for balance. */
  width: 299px;
  height: auto;
  display: block;
}

.dashboard-actions {
  gap: var(--space-md);
}

.month-filter {
  position: relative;
  padding: 0 var(--space-xl) 0 var(--space-md);
}

.month-filter-select {
  appearance: none;
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  height: 100%;
  font-family: inherit;
  font-size: var(--text-body);
  color: var(--color-ink);
  cursor: pointer;
}

.month-filter-chevron {
  position: absolute;
  right: var(--space-sm);
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--color-ink-tertiary);
  pointer-events: none;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-lg);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
}

.chart-card {
  min-width: 0;
}

.dashboard-panels {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

@media (max-width: 860px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}

.regional-table {
  width: 100%;
  border-collapse: collapse;
}

.regional-table th {
  text-align: left;
  padding: var(--space-2xs) var(--space-xs);
  border-bottom: 1px solid var(--color-hairline);
}

.regional-table td {
  padding: var(--space-xs);
  border-bottom: 1px solid var(--color-hairline);
  color: var(--color-ink);
}

.regional-table tr:last-child td {
  border-bottom: none;
}

.exceptions-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.exception-item {
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--color-hairline);
}

.exception-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.exception-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
}

.exception-issue {
  margin: var(--space-2xs) 0;
}

.badge.is-positive {
  color: var(--color-success);
  border-color: rgba(52, 199, 89, 0.28);
  background: rgba(52, 199, 89, 0.12);
}

.badge.is-neutral {
  color: var(--color-ink-secondary);
}

.empty-state {
  color: var(--color-ink-tertiary);
  margin: 0;
}
</style>
