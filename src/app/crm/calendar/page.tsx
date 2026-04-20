'use client'

import dynamic from 'next/dynamic'
import { CalendarSkeleton, CalendarView } from '@/components/crm/CalendarView'

const DynamicCalendar = dynamic(
  () => import('@/components/crm/CalendarView').then((m) => ({ default: m.CalendarView })),
  { ssr: false, loading: () => <CalendarSkeleton /> },
)

export default function CalendarPage() {
  return <DynamicCalendar />
}
