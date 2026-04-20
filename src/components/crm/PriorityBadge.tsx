'use client'

import { Badge } from '@/components/ui/badge'

const priorityConfig: Record<string, { color: string; icon: string }> = {
  low: { color: 'bg-gray-500/15 text-gray-400 border-gray-500/25', icon: '↓' },
  medium: { color: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', icon: '→' },
  high: { color: 'bg-orange-500/15 text-orange-400 border-orange-500/25', icon: '↑' },
  urgent: { color: 'bg-red-500/15 text-red-400 border-red-500/25', icon: '⚠' },
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority.toLowerCase()] || priorityConfig.medium

  return (
    <Badge variant="outline" className={`${config.color} capitalize font-medium text-xs`}>
      {config.icon} {priority}
    </Badge>
  )
}
