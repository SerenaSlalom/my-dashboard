export type TrendSentiment = 'positive' | 'negative' | 'neutral'
export type TrendKind = 'percent' | 'points' | 'count'

export interface Trend {
  text: string
  sentiment: TrendSentiment
}

export function formatTrend(
  current: number,
  previous: number,
  kind: TrendKind,
  goodDirection: 'up' | 'down' = 'up',
): Trend {
  if (kind === 'percent') {
    if (previous === 0) return { text: 'No prior data', sentiment: 'neutral' }
    const pctChange = ((current - previous) / previous) * 100
    return buildTrend(pctChange, `${pctChange.toFixed(1)}%`, goodDirection)
  }

  if (kind === 'points') {
    const delta = current - previous
    return buildTrend(delta, `${delta.toFixed(1)} pts`, goodDirection)
  }

  const delta = Math.round(current - previous)
  return buildTrend(delta, `${delta}`, goodDirection)
}

function buildTrend(delta: number, magnitudeText: string, goodDirection: 'up' | 'down'): Trend {
  if (Math.abs(delta) < 0.05) return { text: 'No change', sentiment: 'neutral' }

  const sign = delta > 0 ? '+' : ''
  const direction = delta > 0 ? 'up' : 'down'
  const sentiment: TrendSentiment = direction === goodDirection ? 'positive' : 'negative'

  return { text: `${sign}${magnitudeText}`, sentiment }
}
