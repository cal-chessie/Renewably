'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpDown, ArrowUp, ArrowDown, MapPin, CheckCircle2, AlertTriangle,
  MoreHorizontal, Eye, Pencil, Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { formatCurrency } from '@/lib/format'
import { PLAN_COLORS, SUBSCRIPTION_COLORS } from '../types'
import type { InstallerRow } from '../types'

function PlanBadge({ plan }: { plan: string }) {
  const colors = PLAN_COLORS[plan.toLowerCase()] || PLAN_COLORS.starter
  return <Badge variant="outline" className="font-semibold text-[10px]" style={colors}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Badge>
}

function SubscriptionBadge({ status }: { status: string }) {
  const colors = SUBSCRIPTION_COLORS[status.toLowerCase()] || SUBSCRIPTION_COLORS.active
  return <Badge variant="outline" className="text-[10px] font-medium" style={colors}>{status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge>
}

interface InstallerTableViewProps {
  installers: InstallerRow[]
  onView: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  selectedIds: string[]
  onToggleSelect: (id: string) => void
  onSelectAll: () => void
}

const TABLE_SORT_OPTIONS = [
  { key: 'name_asc', label: 'Name A→Z' },
  { key: 'name_desc', label: 'Name Z→A' },
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'mrr_high', label: 'Highest MRR' },
  { key: 'mrr_low', label: 'Lowest MRR' },
  { key: 'team_large', label: 'Largest Team' },
  { key: 'team_small', label: 'Smallest Team' },
  { key: 'onboarding', label: 'Onboarding Progress' },
]

export function InstallerTableView({
  installers, onView, onEdit, onDelete, selectedIds, onToggleSelect, onSelectAll,
}: InstallerTableViewProps) {
  const [sortKey, setSortKey] = useState('newest')

  const sortedInstallers = [...installers].sort((a, b) => {
    switch (sortKey) {
      case 'name_asc': return a.companyName.localeCompare(b.companyName)
      case 'name_desc': return b.companyName.localeCompare(a.companyName)
      case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'mrr_high': return (b.mrr || 0) - (a.mrr || 0)
      case 'mrr_low': return (a.mrr || 0) - (b.mrr || 0)
      case 'team_large': return (b.teamSize || 0) - (a.teamSize || 0)
      case 'team_small': return (a.teamSize || 0) - (b.teamSize || 0)
      case 'onboarding': return b.onboardingStep - a.onboardingStep
      default: return 0
    }
  })

  const allSelected = sortedInstallers.length > 0 && sortedInstallers.every(i => selectedIds.includes(i.id))

  const headerStyle = { fontSize: 11, fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: 0.5, padding: '12px 16px', borderBottom: '1px solid #2A2A2A', backgroundColor: '#111111', position: 'sticky' as const, top: 0, zIndex: 5 }
  const cellStyle = { padding: '14px 16px', borderBottom: '1px solid #1E1E1E', fontSize: 13, color: '#D1D5DB', verticalAlign: 'middle' as const }

  return (
    <div style={{ border: '1px solid #2A2A2A', borderRadius: 16, overflow: 'hidden' }}>
      {/* Sort bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#111111', borderBottom: '1px solid #2A2A2A' }}>
        <span style={{ fontSize: 12, color: '#6B7280' }}>{sortedInstallers.length} installers</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowUpDown style={{ width: 13, height: 13, color: '#6B7280' }} />
          <select
            value={sortKey}
            onChange={e => setSortKey(e.target.value)}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #2A2A2A',
              backgroundColor: '#1A1A1A',
              color: '#D1D5DB',
              fontSize: 12,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {TABLE_SORT_OPTIONS.map(opt => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, width: 40, textAlign: 'center' as const }}>
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                  className="h-3.5 w-3.5"
                />
              </th>
              <th style={{ ...headerStyle, textAlign: 'left' as const }}>Company</th>
              <th style={{ ...headerStyle, textAlign: 'left' as const }}>Contact</th>
              <th style={{ ...headerStyle, textAlign: 'center' as const }}>Plan</th>
              <th style={{ ...headerStyle, textAlign: 'center' as const }}>Status</th>
              <th style={{ ...headerStyle, textAlign: 'center' as const }}>Onboarding</th>
              <th style={{ ...headerStyle, textAlign: 'right' as const }}>MRR</th>
              <th style={{ ...headerStyle, textAlign: 'left' as const }}>Counties</th>
              <th style={{ ...headerStyle, width: 48 }}></th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedInstallers.map((installer, i) => {
                const isSelected = selectedIds.includes(installer.id)
                const progressPercent = Math.round((installer.onboardingStep / 10) * 100)
                return (
                  <motion.tr
                    key={installer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => onView(installer.id)}
                    style={{ cursor: 'pointer', backgroundColor: isSelected ? 'rgba(243,216,64,0.05)' : 'transparent', transition: 'background-color 0.15s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(243,216,64,0.08)' : '#1A1A1A' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSelected ? 'rgba(243,216,64,0.05)' : 'transparent' }}
                  >
                    <td style={{ ...cellStyle, textAlign: 'center' }} onClick={e => { e.stopPropagation(); onToggleSelect(installer.id) }}>
                      <Checkbox checked={isSelected} className="h-3.5 w-3.5" />
                    </td>
                    <td style={{ ...cellStyle, fontWeight: 600, color: '#FFFFFF' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {installer.seaiRegistered && <CheckCircle2 style={{ width: 12, height: 12, color: '#4ADE80', flexShrink: 0 }} />}
                          {installer.reciRegistered && <CheckCircle2 style={{ width: 12, height: 12, color: '#34D399', flexShrink: 0 }} />}
                        </div>
                        {installer.companyName}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ color: '#D1D5DB' }}>{installer.contactName}</span>
                        <span style={{ fontSize: 11, color: '#6B7280' }}>{installer.contactEmail || installer.contactPhone || ''}</span>
                      </div>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}><PlanBadge plan={installer.plan} /></td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}><SubscriptionBadge status={installer.subscriptionStatus} /></td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                        <div style={{ width: 48, height: 4, backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progressPercent}%`, borderRadius: 100, backgroundColor: installer.onboardingComplete ? '#10B981' : '#F3D840' }} />
                        </div>
                        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{progressPercent}%</span>
                      </div>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 500, color: '#FFFFFF' }}>
                      {installer.mrr ? formatCurrency(installer.mrr) : '—'}
                    </td>
                    <td style={cellStyle}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {installer.counties.slice(0, 2).map(c => (
                          <span key={c} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, color: '#9CA3AF', backgroundColor: '#222222', border: '1px solid #2A2A2A' }}>
                            {c}
                          </span>
                        ))}
                        {installer.counties.length > 2 && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, color: '#6B7280' }}>+{installer.counties.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onView(installer.id)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #2A2A2A', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#6B7280' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#F3D840'; e.currentTarget.style.borderColor = 'rgba(243,216,64,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#2A2A2A' }}
                        >
                          <Eye style={{ width: 13, height: 13 }} />
                        </button>
                        <button
                          onClick={() => onEdit(installer.id)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #2A2A2A', backgroundColor: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', color: '#6B7280' }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#60A5FA'; e.currentTarget.style.borderColor = 'rgba(96,165,250,0.3)' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#2A2A2A' }}
                        >
                          <Pencil style={{ width: 13, height: 13 }} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  )
}
