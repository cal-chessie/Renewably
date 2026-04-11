'use client'

import { Phone, Mail, Calendar, FileText, UserPlus, DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react'

const activityIcons: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  call: { icon: Phone, color: 'text-green-600', bg: 'bg-green-100' },
  email: { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-100' },
  meeting: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
  note: { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
  task: { icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-100' },
  deal_update: { icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100' },
  system: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
  referral: { icon: UserPlus, color: 'text-pink-600', bg: 'bg-pink-100' },
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
