// Chart color/font constants mirroring design/aether/css/system.css tokens.
// Chart.js draws to canvas, so these need real values rather than CSS vars.
export const AETHER = {
  ink: '#1d1d1f',
  inkSecondary: '#54545a',
  inkTertiary: '#86868b',
  accent: '#0a84ff',
  hairline: 'rgba(15, 23, 42, 0.08)',
} as const

export const CHART_FONT = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

export const axisTicks = {
  color: AETHER.inkTertiary,
  font: { family: CHART_FONT, size: 11 },
} as const

export const tooltipBase = {
  backgroundColor: AETHER.ink,
  titleFont: { family: CHART_FONT, weight: 600 as const },
  bodyFont: { family: CHART_FONT },
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
} as const
