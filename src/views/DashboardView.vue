<script setup lang="ts">
const metrics = [
  { label: 'Shipment Volume', value: '—', trend: '—' },
  { label: 'On-Time Delivery', value: '—', trend: '—' },
  { label: 'Regions Tracked', value: '—', trend: '—' },
  { label: 'Open Exceptions', value: '—', trend: '—' },
]
</script>

<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <div class="dashboard-titles">
        <p class="text-micro">FastForward Logistics</p>
        <h1 class="h1">Operations Dashboard</h1>
      </div>

      <div class="dashboard-actions row-wrap">
        <div class="tabs" role="tablist">
          <button class="tab is-active" role="tab" aria-selected="true">Overview</button>
          <button class="tab" role="tab" aria-selected="false">Regions</button>
          <button class="tab" role="tab" aria-selected="false">Exceptions</button>
        </div>
        <button class="btn btn-secondary" type="button">Last 30 days</button>
      </div>
    </header>

    <section class="metrics-grid">
      <article class="card metric-card" v-for="metric in metrics" :key="metric.label">
        <div class="card-header">
          <span class="card-icon is-soft" aria-hidden="true"></span>
          <span class="badge badge-accent">{{ metric.trend }}</span>
        </div>
        <p class="text-label">{{ metric.label }}</p>
        <p class="display text-mono metric-value">{{ metric.value }}</p>
      </article>
    </section>

    <section class="dashboard-panels">
      <div class="card card-raised panel-regional">
        <div class="card-header">
          <h2 class="card-title">Regional Performance</h2>
        </div>
        <div class="card-body">Regional breakdown placeholder — mock data coming in Step 2.6.</div>
      </div>

      <div class="card card-raised panel-exceptions">
        <div class="card-header">
          <h2 class="card-title">Open Exceptions</h2>
        </div>
        <div class="card-body">Exceptions list placeholder — mock data coming in Step 2.6.</div>
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

.metric-value {
  font-size: var(--text-h1);
  line-height: var(--text-h1-lh);
}

.dashboard-panels {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-lg);
}

@media (max-width: 860px) {
  .dashboard-panels {
    grid-template-columns: 1fr;
  }
}
</style>
