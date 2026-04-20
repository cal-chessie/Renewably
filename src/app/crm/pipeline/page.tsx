'use client'

import dynamic from 'next/dynamic'
import { PipelineBoardSkeleton } from '@/components/crm/PipelineBoard'

const PipelineBoard = dynamic(
  () => import('@/components/crm/PipelineBoard').then(m => ({ default: m.PipelineBoard })),
  { ssr: false, loading: () => <PipelineBoardSkeleton /> }
)

export default function PipelinePage() {
  return <PipelineBoard />
}
