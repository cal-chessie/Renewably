'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2, ArrowUpDown, X, Loader2, ChevronDown,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { PLAN_COLORS, SUBSCRIPTION_COLORS } from '../types'
import type { InstallerRow } from '../types'

function PlanBadge({ plan }: { plan: string }) {
  const colors = PLAN_COLORS[plan.toLowerCase()] || PLAN_COLORS.starter
  return <Badge variant="outline" className="font-semibold text-[11px]" style={colors}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>
}

function SubscriptionBadge({ status }: { status: string }) {
  const colors = SUBSCRIPTION_COLORS[status.toLowerCase()] || SUBSCRIPTION_COLORS.active
  return <Badge variant="outline" className="text-[11px] font-medium" style={colors}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
}

interface BulkActionBarProps {
  selectedIds: string[]
  onClear: () => void
  queryParams: string
}

export function BulkActionBar({ selectedIds, onClear, queryParams }: BulkActionBarProps) {
  const queryClient = useQueryClient()
  const [showPlanChange, setShowPlanChange] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const bulkUpdateMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/installers/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Bulk update failed')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      toast.success(data.message || 'Updated successfully')
      onClear()
      setShowPlanChange(false)
    },
    onError: () => toast.error('Bulk update failed'),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/crm/installers/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (!res.ok) throw new Error('Bulk delete failed')
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      toast.success(data.message || 'Deleted successfully')
      onClear()
      setConfirmDelete(false)
    },
    onError: () => toast.error('Bulk delete failed'),
  })

  const handleChangePlan = () => {
    if (!newPlan) return
    bulkUpdateMutation.mutate({ ids: selectedIds, action: { type: 'change_plan', value: newPlan } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: '#1A1A1A',
        border: '1px solid rgba(243,216,64,0.3)',
        borderRadius: 16,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: '0 20px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(243,216,64,0.1)',
        zIndex: 50,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: '#F3D840' }}>{selectedIds.length} selected</span>

      {!showPlanChange ? (
        <>
          <button
            onClick={() => setShowPlanChange(true)}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2A2A2A', backgroundColor: '#222222', color: '#D1D5DB', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(243,216,64,0.3)'; e.currentTarget.style.color = '#F3D840' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#D1D5DB' }}
          >
            Change Plan
          </button>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#F87171', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
            >
              <Trash2 style={{ width: 13, height: 13 }} />
              Delete Selected
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#F87171' }}>Confirm?</span>
              <button
                onClick={() => bulkDeleteMutation.mutate()}
                disabled={bulkDeleteMutation.isPending}
                style={{ padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: '#EF4444', color: '#FFFFFF', fontSize: 12, fontWeight: 600, cursor: bulkDeleteMutation.isPending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {bulkDeleteMutation.isPending && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
                Yes, Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2A2A2A', backgroundColor: '#222222', color: '#A0A0A0', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
            </div>
          )}

          <button
            onClick={onClear}
            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2A2A2A', backgroundColor: '#222222', color: '#9CA3AF', fontSize: 12, cursor: 'pointer' }}
          >
            Clear
          </button>
        </>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Select value={newPlan} onValueChange={setNewPlan}>
            <SelectTrigger style={{ width: 140, height: 34, fontSize: 12 }}><SelectValue placeholder="Select plan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleChangePlan}
            disabled={!newPlan || bulkUpdateMutation.isPending}
            style={{ padding: '7px 14px', borderRadius: 8, border: 'none', backgroundColor: '#F3D840', color: '#0A0A0A', fontSize: 12, fontWeight: 600, cursor: (!newPlan || bulkUpdateMutation.isPending) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            {bulkUpdateMutation.isPending && <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} />}
            Apply
          </button>
          <button onClick={() => { setShowPlanChange(false); setNewPlan('') }} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2A2A2A', backgroundColor: '#222222', color: '#A0A0A0', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
        </div>
      )}
    </motion.div>
  )
}
