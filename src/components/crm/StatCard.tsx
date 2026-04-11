'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: number
    positive: boolean
  }
  delay?: number
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -2, boxShadow: '0 8px 25px -5px rgba(0,0,0,0.1)' }}
    >
      <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-400">{subtitle}</p>
              )}
              {trend && (
                <p className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
                  <span className="text-gray-400 ml-1">vs last month</span>
                </p>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Icon className="h-6 w-6 text-[#374151]" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
