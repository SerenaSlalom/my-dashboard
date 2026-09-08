<script setup lang="ts">
import { computed, ref } from 'vue'
import MetricCard from '../components/MetricCard.vue'
import metricsData from '../data/metrics.json'

type PeriodKey = keyof typeof metricsData.periods

const periodOptions: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
]

const selectedPeriod = ref<PeriodKey>('30d')

const currentPeriod = computed(() => metricsData.periods[selectedPeriod.value])

const metrics = computed(() => {
  const summary = currentPeriod.value.summary
  return [
    { key: 'shipmentVolume', label: 'Shipment Volume', ...summary.shipmentVolume },
    { key: 'onTimeRate', label: 'On-Time Delivery', ...summary.onTimeRate },
    { key: 'regionsTracked', label: 'Regions Tracked', ...summary.regionsTracked },
    { key: 'openExceptions', label: 'Open Exceptions', ...summary.openExceptions },
  ]
})
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="dashboard-titles">
        <p class="text-micro">FastForward Logistics</p>
        <h1 class="h1">Operations Dashboard</h1>
      </div>

      <div class="dashboard-actions row-wrap">
        <div class="tabs" role="tablist" aria-label="Select time period">
          <button
            v-for="option in periodOptions"
            :key="option.key"
            class="tab"
            :class="{ 'is-active': selectedPeriod === option.key }"
            role="tab"
            :aria-selected="selectedPeriod === option.key"
            type="button"
            @click="selectedPeriod = option.key"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </header>

    <section class="metrics-grid">
      <MetricCard
        v-for="metric in metrics"
        :key="metric.key"
        :label="metric.label"
        :value="metric.value"
        :trend="metric.trend"
        :trend-sentiment="metric.sentiment as 'positive' | 'negative' | 'neutral'"
      />
    </section>

    <section class="dashboard-panels">
      <div class="card card-raised panel-regional">
        <div class="card-header">
          <h2 class="card-title">Regional Performance</h2>
          <span class="text-label">{{ currentPeriod.label }}</span>
        </div>
        <table v-if="currentPeriod.regionalPerformance.length" class="regional-table">
          <thead>
            <tr>
              <th class="text-label">Region</th>
              <th class="text-label">Shipments</th>
              <th class="text-label">On-Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="region in currentPeriod.regionalPerformance" :key="region.region">
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
        </div>
        <ul v-if="currentPeriod.exceptions.length" class="exceptions-list">
          <li v-for="exception in currentPeriod.exceptions" :key="exception.id" class="exception-item">
            <div class="exception-row">
              <span class="text-mono text-label">{{ exception.id }}</span>
              <span class="badge" :class="exception.status === 'Resolved' ? 'is-positive' : 'is-neutral'">
                {{ exception.status }}
              </span>
            </div>
            <p class="text-body exception-issue">{{ exception.issue }}</p>
            <p class="text-micro">{{ exception.region }} · {{ exception.shipmentId }}</p>
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

.dashboard-titles .h1 {
  margin-top: var(--space-2xs);
}

.dashboard-actions {
  gap: var(--space-md);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-lg);
}

.dashboard-panels {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

@media (max-width: 860px) {
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
