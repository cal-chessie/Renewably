// ============================================================================
// RENEWABLY CRM — SHARED FORMATTING UTILITIES
// ============================================================================

import { useState, useEffect } from 'react'

/** Format a number as EUR currency (no decimals) */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/** Relative time string (e.g. "3 hours ago", "2 days ago") */
export function timeAgo(date: string | Date): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)

  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  const diffMo = Math.floor(diffDay / 30)
  if (diffMo < 12) return `${diffMo}mo ago`
  const diffYr = Math.floor(diffMo / 12)
  return `${diffYr}y ago`
}

/**
 * Hook that returns a stable relative-time string.
 * Starts with '—' on the server to avoid hydration mismatches,
 * then resolves to the real value after mount.
 */
export function useTimeAgo(date: string | Date | null | undefined): string {
  const [text, setText] = useState('—')
  useEffect(() => {
    setText(date ? timeAgo(date) : '—')
  }, [date])
  return text
}
