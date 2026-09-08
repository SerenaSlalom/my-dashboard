<script setup lang="ts">
type TrendSentiment = 'positive' | 'negative' | 'neutral'
type IconName = 'package' | 'clock' | 'map-pin' | 'triangle-alert'

withDefaults(
  defineProps<{
    label: string
    value: string | number
    icon: IconName
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
      <span class="card-icon is-soft" aria-hidden="true">
        <svg
          v-if="icon === 'package'"
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"
          />
          <path d="M12 22V12" />
          <polyline points="3.29 7 12 12 20.71 7" />
          <path d="m7.5 4.27 9 5.15" />
        </svg>
        <svg
          v-else-if="icon === 'clock'"
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
        <svg
          v-else-if="icon === 'map-pin'"
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
          />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <svg
          v-else-if="icon === 'triangle-alert'"
          class="icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </span>
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

.card-header .badge {
  white-space: nowrap;
  flex: none;
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
