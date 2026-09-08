<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
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
      label: 'On-Time Rate',
      data: props.values,
      borderColor: AETHER.accent,
      backgroundColor: 'rgba(10, 132, 255, 0.12)',
      fill: true,
      tension: 0.35,
      pointRadius: 0,
      pointHoverRadius: 4,
      borderWidth: 2,
    },
  ],
}))

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      ...tooltipBase,
      callbacks: {
        label: (ctx) => `${(ctx.parsed.y ?? 0).toFixed(1)}% on time`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: axisTicks,
    },
    y: {
      min: 80,
      max: 100,
      grid: { color: AETHER.hairline },
      ticks: { ...axisTicks, callback: (value) => `${value}%` },
    },
  },
}
</script>

<template>
  <div class="chart-wrap">
    <Line :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 240px;
}
</style>
