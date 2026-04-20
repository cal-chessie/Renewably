// Shared design system constants for the CRM
// Used across: dashboard, companies, pipeline, settings, shell

export const CRM_THEME = {
  // Backgrounds
  BG_PAGE: '#080808',
  BG_CENTER: '#0C0C0C',
  BG_CARD: '#141414',
  BG_ELEVATED: '#1A1A1A',
  BG_INPUT: '#0E0E0E',

  // Borders
  BORDER: 'rgba(255,255,255,0.05)',
  BORDER_HOVER: 'rgba(255,255,255,0.10)',

  // Brand
  YELLOW: '#F3D840',

  // Semantic
  GREEN: '#10B981',
  RED: '#F87171',
  BLUE: '#60A5FA',
  PURPLE: '#A78BFA',
  PINK: '#F472B6',
  ORANGE: '#FB923C',

  // Text
  TEXT: '#FFFFFF',
  TEXT2: 'rgba(255,255,255,0.50)',
  TEXT3: 'rgba(255,255,255,0.30)',

  // Sidebar
  SIDEBAR_EXPANDED: 256,
  SIDEBAR_COLLAPSED: 72,

} as const

// Euro formatter for Ireland
export function formatEUR(value: number, compact = false): string {
  if (compact) {
    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`
  }
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}
