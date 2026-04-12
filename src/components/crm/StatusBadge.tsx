'use client'

import { Badge } from '@/components/ui/badge'

const statusColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-800 border-blue-200',
  prospect: 'bg-purple-100 text-purple-800 border-purple-200',
  customer: 'bg-green-100 text-green-800 border-green-200',
  churned: 'bg-red-100 text-red-800 border-red-200',
  inactive: 'bg-gray-100 text-gray-600 border-gray-200',
  active: 'bg-green-100 text-green-800 border-green-200',
  won: 'bg-green-100 text-green-800 border-green-200',
  lost: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  todo: 'bg-gray-100 text-gray-600 border-gray-200',
}

export function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_')
  const colorClass = statusColors[normalizedStatus] || statusColors[normalizedStatus.replace(/-/g, '_')] || 'bg-gray-100 text-gray-600 border-gray-200'

  return (
    <Badge variant="outline" className={`${colorClass} capitalize font-medium`}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
