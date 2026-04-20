'use client'

import { Phone, Mail, Calendar, FileText, UserPlus, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react'

const activityIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-green-400', bg: 'bg-green-500/15' },
  email: { icon: Mail, color: 'text-blue-400', bg: 'bg-blue-500/15' },
  meeting: { icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  note: { icon: FileText, color: 'text-gray-400', bg: 'bg-gray-500/15' },
  task: { icon: CheckCircle2, color: 'text-teal-400', bg: 'bg-teal-500/15' },
  deal_update: { icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  system: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/15' },
  referral: { icon: UserPlus, color: 'text-pink-400', bg: 'bg-pink-500/15' },
}

export function ActivityIcon({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const config = activityIcons[type.toLowerCase()] || activityIcons.system
  const Icon = config.icon

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  }

  return (
    <div className={`${sizeClasses[size]} ${config.bg} rounded-full flex items-center justify-center shrink-0`}>
      <Icon className={`${iconSizes[size]} ${config.color}`} />
    </div>
  )
}
