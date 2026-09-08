<script setup lang="ts">
type TrendSentiment = 'positive' | 'negative' | 'neutral'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    trend?: string
    trendSentiment?: TrendSentiment
  }>(),
  {
    trend: undefined,
    trendSentiment: 'neutral',
  },
)
</script>

<template>
  <article class="card metric-card">
    <div class="card-header">
      <span class="card-icon is-soft" aria-hidden="true"></span>
      <span v-if="trend" class="badge" :class="`is-${trendSentiment}`">{{ trend }}</span>
    </div>
    <p class="text-label">{{ label }}</p>
    <p class="display text-mono metric-value">{{ value }}</p>
  </article>
</template>

<style scoped>
.metric-value {
  font-size: var(--text-h1);
  line-height: var(--text-h1-lh);
}

.badge.is-positive {
  color: var(--color-success);
  border-color: rgba(52, 199, 89, 0.28);
  background: rgba(52, 199, 89, 0.12);
}

.badge.is-negative {
  color: var(--color-danger);
  border-color: rgba(255, 69, 58, 0.28);
  background: rgba(255, 69, 58, 0.12);
}

.badge.is-neutral {
  color: var(--color-ink-secondary);
}
</style>
