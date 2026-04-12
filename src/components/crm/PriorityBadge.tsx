'use client'

import { Badge } from '@/components/ui/badge'

const priorityConfig: Record<string, { color: string; icon: string }> = {
  low: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: '↓' },
  medium: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '→' },
  high: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: '↑' },
  urgent: { color: 'bg-red-100 text-red-800 border-red-200', icon: '⚠' },
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority.toLowerCase()] || priorityConfig.medium

  return (
    <Badge variant="outline" className={`${config.color} capitalize font-medium`}>
      {config.icon} {priority}
    </Badge>
  )
}
