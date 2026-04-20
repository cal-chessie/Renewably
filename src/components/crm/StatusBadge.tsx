'use client'

import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, string> = {
  lead: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  prospect: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  customer: 'bg-green-500/15 text-green-400 border-green-500/25',
  churned: 'bg-red-500/15 text-red-400 border-red-500/25',
  inactive: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  active: 'bg-green-500/15 text-green-400 border-green-500/25',
  won: 'bg-green-500/15 text-green-400 border-green-500/25',
  lost: 'bg-red-500/15 text-red-400 border-red-500/25',
  completed: 'bg-green-500/15 text-green-400 border-green-500/25',
  scheduled: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  in_progress: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  todo: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  const colorClass = statusColors[normalizedStatus] || statusColors[normalizedStatus.replace(/-/g, '_')] || 'bg-gray-500/15 text-gray-400 border-gray-500/25'

  return (
    <Badge variant="outline" className={`${colorClass} capitalize font-medium text-xs`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
