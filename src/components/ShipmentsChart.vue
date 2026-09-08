<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import type { ChartOptions } from 'chart.js'
import { AETHER, axisTicks, tooltipBase } from '../lib/chartTheme'

const props = defineProps<{
  labels: string[]
  values: number[]
}>()

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: 'Shipments',
      data: props.values,
      backgroundColor: AETHER.ink,
      borderRadius: 6,
      maxBarThickness: 28,
    },
  ],
}))

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase,
      callbacks: {
        label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString()} shipments`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: axisTicks,
    },
    y: {
      beginAtZero: true,
      grid: { color: AETHER.hairline },
      ticks: axisTicks,
    },
  },
}
</script>

<template>
  <div class="chart-wrap">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 240px;
}
</style>
