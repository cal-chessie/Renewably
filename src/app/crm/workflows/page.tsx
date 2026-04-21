'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  ChevronRight,
  ChevronDown,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  Workflow,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Save,
  X,
  Info,
  CalendarDays,
  Calendar,
  CreditCard,
  Users,
  Target,
  FileText,
  Mail,
  Banknote,
  ClipboardCheck,
  Square,
  LayoutGrid,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkflowAction {
  type: string
  config: Record<string, unknown>
}

interface WorkflowRule {
  id: string
  name: string
  description?: string | null
  isActive: boolean
  triggerType: string
  triggerConfig: string
  actions: string
  executionCount: number
  lastExecutedAt?: string | null
  createdAt: string
  updatedAt: string
  _count?: { executions: number }
}

interface WorkflowExecution {
  id: string
  ruleId: string
  triggerType: string
  entityType: string
  entityId: string
  actionType: string
  actionConfig: string
  status: string
  result?: string | null
  executedAt: string
  rule?: {
    id: string
    name: string
    triggerType: string
  }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TRIGGER_TYPES = [
  { value: 'deal_stage_change', label: 'Deal Stage Change', icon: ArrowRight, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  { value: 'deal_created', label: 'Deal Created', icon: Target, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { value: 'new_contact', label: 'New Contact', icon: Bot, color: 'text-green-500', bgColor: 'bg-green-50' },
  { value: 'contact_inactive', label: 'Contact Inactive', icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
  { value: 'task_overdue', label: 'Task Overdue', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'task_completed', label: 'Task Completed', icon: ClipboardCheck, color: 'text-emerald-500', bgColor: 'bg-emerald-50' },
  { value: 'proposal_status_change', label: 'Proposal Status Change', icon: Workflow, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { value: 'meeting_created', label: 'Meeting Created', icon: CalendarDays, color: 'text-sky-500', bgColor: 'bg-sky-50' },
  { value: 'meeting_completed', label: 'Meeting Completed', icon: Calendar, color: 'text-teal-500', bgColor: 'bg-teal-50' },
  { value: 'meeting_cancelled', label: 'Meeting Cancelled', icon: XCircle, color: 'text-rose-500', bgColor: 'bg-rose-50' },
  { value: 'invoice_created', label: 'Invoice Created', icon: FileText, color: 'text-amber-500', bgColor: 'bg-amber-50' },
  { value: 'invoice_overdue', label: 'Invoice Overdue', icon: CreditCard, color: 'text-red-600', bgColor: 'bg-red-50' },
  { value: 'payment_received', label: 'Payment Received', icon: Banknote, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
] as const

const ACTION_TYPES = [
  { value: 'create_task', label: 'Create Task', icon: Sparkles },
  { value: 'create_meeting', label: 'Create Meeting', icon: CalendarDays },
  { value: 'create_proposal', label: 'Create Proposal', icon: FileText },
  { value: 'create_invoice', label: 'Create Invoice', icon: CreditCard },
  { value: 'send_email', label: 'Send Email', icon: Mail },
  { value: 'update_field', label: 'Update Field', icon: Settings },
  { value: 'add_note', label: 'Add Note', icon: Info },
  { value: 'create_note', label: 'Create Note', icon: Square },
  { value: 'notify', label: 'Send Notification', icon: Zap },
] as const

const PIPELINE_STAGES = [
  'new_lead', 'contacted', 'discovery_call', 'demo_booked',
  'demo_done', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost',
] as const

const STAGE_LABELS: Record<string, string> = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  discovery_call: 'Discovery',
  demo_booked: 'Demo Booked',
  demo_done: 'Demo Done',
  proposal_sent: 'Proposal Sent',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

const PROPOSAL_STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired']
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']

const DEFAULT_ACTION: WorkflowAction = {
  type: 'create_task',
  config: { title: '', priority: 'medium', description: '' },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTriggerLabel(triggerType: string): string {
  return TRIGGER_TYPES.find((t) => t.value === triggerType)?.label || triggerType
}

function getTriggerIcon(triggerType: string) {
  return TRIGGER_TYPES.find((t) => t.value === triggerType)?.icon || Zap
}

function getActionLabel(actionType: string): string {
  return ACTION_TYPES.find((a) => a.value === actionType)?.label || actionType
}

function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback
  try {
    return JSON.parse(str) as T
  } catch {
    return fallback
  }
}

function formatTriggerDescription(triggerType: string, triggerConfig: Record<string, unknown>): string {
  switch (triggerType) {
    case 'deal_stage_change':
      return `When deal moves to "${STAGE_LABELS[String(triggerConfig.stage || '')] || triggerConfig.stage || 'any'}" stage`
    case 'deal_created':
      return 'When a new deal is created'
    case 'new_contact':
      return 'When a new contact is created'
    case 'task_overdue':
      return `When task is overdue by ${triggerConfig.days || 7}+ days`
    case 'task_completed':
      return 'When a task is marked as completed'
    case 'proposal_status_change':
      return `When proposal status changes to "${triggerConfig.status || 'any'}"`
    case 'contact_inactive':
      return `When contact has no activity for ${triggerConfig.days || 30}+ days`
    case 'meeting_created':
      return 'When a new meeting is scheduled'
    case 'meeting_completed':
      return 'When a meeting is marked as completed'
    case 'meeting_cancelled':
      return 'When a meeting is cancelled'
    case 'invoice_created':
      return 'When a new invoice is created'
    case 'invoice_overdue':
      return `When invoice is ${triggerConfig.days || 7}+ days past due date`
    case 'payment_received':
      return 'When a payment is received'
    default:
      return triggerType
  }
}

function formatActionDescription(actionType: string, actionConfig: Record<string, unknown>): string {
  switch (actionType) {
    case 'create_task':
      return `Create task "${actionConfig.title || 'Untitled'}" (priority: ${actionConfig.priority || 'medium'})`
    case 'create_meeting':
      return `Create meeting "${actionConfig.title || 'Untitled'}" (${actionConfig.duration || 30} min, ${actionConfig.meetingType || 'call'})`
    case 'create_proposal':
      return `Create proposal "${actionConfig.title || 'Untitled'}" (template: ${actionConfig.template || 'default'})`
    case 'create_invoice':
      return `Create invoice from deal (auto-generated)`
    case 'send_email':
      return `Send email template "${actionConfig.template || 'default'}" to ${actionConfig.to || 'recipient'}`
    case 'update_field':
      return `Update ${actionConfig.field || 'field'} to "${actionConfig.value || ''}"`
    case 'add_note':
      return `Add note "${String(actionConfig.text || '').substring(0, 40)}"`
    case 'create_note':
      return `Create note "${String(actionConfig.text || '').substring(0, 40)}"`
    case 'notify':
      return `Notify ${actionConfig.user || 'team'}: "${String(actionConfig.message || '').substring(0, 40)}"`
    default:
      return actionType
  }
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  if (status === 'success') {
    return (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 gap-1 text-xs font-medium">
        <CheckCircle2 className="h-3 w-3" />
        Success
      </Badge>
    )
  }
  if (status === 'failed') {
    return (
      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1 text-xs font-medium">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-[#A0A0A0] border-[#2A2A2A] bg-[#1A1A1A] gap-1 text-xs font-medium">
      <Clock className="h-3 w-3" />
      Skipped
    </Badge>
  )
}

// ─── Rule Card ───────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  expanded,
  onToggle,
  onToggleActive,
  onDelete,
  onEdit,
  onTest,
}: {
  rule: WorkflowRule
  expanded: boolean
  onToggle: () => void
  onToggleActive: () => void
  onDelete: () => void
  onEdit: () => void
  onTest: () => void
}) {
  const triggerConfig = parseJSON<Record<string, unknown>>(rule.triggerConfig, {})
  const actions = parseJSON<WorkflowAction[]>(rule.actions, [])
  const triggerInfo = TRIGGER_TYPES.find((t) => t.value === rule.triggerType)
  const TriggerIconComponent = triggerInfo?.icon || Zap

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border transition-all duration-200 ${rule.isActive ? 'border-[#2A2A2A] shadow-sm' : 'border-[#2A2A2A] opacity-70'}`}>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-3 p-4">
            {/* Active indicator */}
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${rule.isActive ? 'bg-green-500' : 'bg-[#444444]'}`} />

            {/* Trigger icon */}
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${triggerInfo?.bgColor || 'bg-[#1A1A1A]'}`}>
              <TriggerIconComponent className={`h-4.5 w-4.5 ${triggerInfo?.color || 'text-[#A0A0A0]'}`} />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white truncate">{rule.name}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {getTriggerLabel(rule.triggerType)}
                </Badge>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-0.5 truncate">
                {formatTriggerDescription(rule.triggerType, triggerConfig)}
              </p>
            </div>

            {/* Stats */}
            <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-gray-400 mr-2">
              <span className="flex items-center gap-1" title="Times executed">
                <Play className="h-3 w-3" />
                {rule.executionCount}
              </span>
              {rule.lastExecutedAt && (
                <span className="flex items-center gap-1" title="Last executed">
                  <Clock className="h-3 w-3" />
                  {format(new Date(rule.lastExecutedAt), 'MMM d')}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Switch
                checked={rule.isActive}
                onCheckedChange={onToggleActive}
                className="data-[state=checked]:bg-[#F3D840]"
              />
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
                <Settings className="h-3.5 w-3.5 text-gray-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onTest}
                disabled={!rule.isActive}
                title="Test trigger"
              >
                <Play className="h-3.5 w-3.5 text-gray-400" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete} title="Delete">
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
                {expanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 border-t border-[#2A2A2A]">
                  {/* Actions list */}
                  <div className="pt-3 space-y-2">
                    <p className="text-xs font-medium text-[#A0A0A0] uppercase tracking-wider">Actions</p>
                    {actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-2">
                        <ArrowRight className="h-3.5 w-3.5 text-[#F3D840] shrink-0" />
                        <span className="text-xs text-[#A0A0A0] font-medium">{getActionLabel(action.type)}</span>
                        <span className="text-xs text-[#A0A0A0] truncate">
                          — {formatActionDescription(action.type, action.config)}
                        </span>
                      </div>
                    ))}
                    {actions.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No actions configured</p>
                    )}
                  </div>

                  {/* Stats (mobile) */}
                  <div className="sm:hidden flex items-center gap-4 mt-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Executed {rule.executionCount} times
                    </span>
                    {rule.lastExecutedAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last: {format(new Date(rule.lastExecutedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>

                  {rule.description && (
                    <p className="text-xs text-[#A0A0A0] mt-3 bg-[#1A1A1A] rounded-lg p-3">{rule.description}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Trigger Builder ─────────────────────────────────────────────────────────

function TriggerBuilder({
  triggerType,
  triggerConfig,
  onTriggerTypeChange,
  onConfigChange,
}: {
  triggerType: string
  triggerConfig: Record<string, unknown>
  onTriggerTypeChange: (type: string) => void
  onConfigChange: (config: Record<string, unknown>) => void
}) {
  const triggerInfo = TRIGGER_TYPES.find((t) => t.value === triggerType)
  const TriggerIcon = triggerInfo?.icon || Zap

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${triggerInfo?.bgColor || 'bg-[#1A1A1A]'}`}>
          <TriggerIcon className={`h-4 w-4 ${triggerInfo?.color || 'text-[#A0A0A0]'}`} />
        </div>
        <Label className="text-sm font-medium text-[#A0A0A0]">When this happens...</Label>
      </div>

      <Select value={triggerType} onValueChange={(v) => {
        onTriggerTypeChange(v)
        // Reset config for new trigger type
        switch (v) {
          case 'deal_stage_change':
            onConfigChange({ stage: 'closed_won' })
            break
          case 'deal_created':
            onConfigChange({})
            break
          case 'new_contact':
            onConfigChange({})
            break
          case 'task_overdue':
            onConfigChange({ days: 2 })
            break
          case 'task_completed':
            onConfigChange({})
            break
          case 'proposal_status_change':
            onConfigChange({ status: 'sent' })
            break
          case 'contact_inactive':
            onConfigChange({ days: 30 })
            break
          case 'meeting_created':
            onConfigChange({})
            break
          case 'meeting_completed':
            onConfigChange({})
            break
          case 'meeting_cancelled':
            onConfigChange({})
            break
          case 'invoice_created':
            onConfigChange({})
            break
          case 'invoice_overdue':
            onConfigChange({ days: 7 })
            break
          case 'payment_received':
            onConfigChange({})
            break
          default:
            onConfigChange({})
        }
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select trigger" />
        </SelectTrigger>
        <SelectContent>
          {TRIGGER_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              <div className="flex items-center gap-2">
                <t.icon className={`h-4 w-4 ${t.color}`} />
                {t.label}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Conditional config */}
      <AnimatePresence mode="wait">
        {triggerType === 'deal_stage_change' && (
          <motion.div
            key="deal_stage"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-2 bg-[#1A1A1A] rounded-lg p-3"
          >
            <Label className="text-xs text-[#A0A0A0]">When deal moves to stage:</Label>
            <Select
              value={(triggerConfig.stage as string) || ''}
              onValueChange={(v) => onConfigChange({ ...triggerConfig, stage: v })}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>{STAGE_LABELS[stage]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {triggerType === 'new_contact' && (
          <motion.div
            key="new_contact"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers automatically when a new contact is created in the CRM.</p>
          </motion.div>
        )}

        {triggerType === 'task_overdue' && (
          <motion.div
            key="task_overdue"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-2 bg-[#1A1A1A] rounded-lg p-3"
          >
            <Label className="text-xs text-[#A0A0A0]">When task is overdue by (days):</Label>
            <Input
              type="number"
              min={1}
              value={(triggerConfig.days as number) || 7}
              onChange={(e) => onConfigChange({ ...triggerConfig, days: parseInt(e.target.value) || 7 })}
              className="w-full text-sm"
            />
          </motion.div>
        )}

        {triggerType === 'proposal_status_change' && (
          <motion.div
            key="proposal_status"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-2 bg-[#1A1A1A] rounded-lg p-3"
          >
            <Label className="text-xs text-[#A0A0A0]">When proposal status is:</Label>
            <Select
              value={(triggerConfig.status as string) || ''}
              onValueChange={(v) => onConfigChange({ ...triggerConfig, status: v })}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PROPOSAL_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}

        {triggerType === 'contact_inactive' && (
          <motion.div
            key="contact_inactive"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-2 bg-[#1A1A1A] rounded-lg p-3"
          >
            <Label className="text-xs text-[#A0A0A0]">When contact has no activity for (days):</Label>
            <Input
              type="number"
              min={1}
              value={(triggerConfig.days as number) || 30}
              onChange={(e) => onConfigChange({ ...triggerConfig, days: parseInt(e.target.value) || 30 })}
              className="w-full text-sm"
            />
          </motion.div>
        )}

        {triggerType === 'deal_created' && (
          <motion.div
            key="deal_created"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers automatically when a new deal is created in the pipeline.</p>
          </motion.div>
        )}

        {triggerType === 'task_completed' && (
          <motion.div
            key="task_completed"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers when a task is marked as completed.</p>
          </motion.div>
        )}

        {triggerType === 'meeting_created' && (
          <motion.div
            key="meeting_created"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers automatically when a new meeting is scheduled.</p>
          </motion.div>
        )}

        {triggerType === 'meeting_completed' && (
          <motion.div
            key="meeting_completed"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers when a meeting is marked as completed.</p>
          </motion.div>
        )}

        {triggerType === 'meeting_cancelled' && (
          <motion.div
            key="meeting_cancelled"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers when a meeting is cancelled.</p>
          </motion.div>
        )}

        {triggerType === 'invoice_created' && (
          <motion.div
            key="invoice_created"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers automatically when a new invoice is created.</p>
          </motion.div>
        )}

        {triggerType === 'invoice_overdue' && (
          <motion.div
            key="invoice_overdue"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-2 bg-[#1A1A1A] rounded-lg p-3"
          >
            <Label className="text-xs text-[#A0A0A0]">Days after due date (unpaid):</Label>
            <Input
              type="number"
              min={1}
              value={(triggerConfig.days as number) || 7}
              onChange={(e) => onConfigChange({ ...triggerConfig, days: parseInt(e.target.value) || 7 })}
              className="w-full text-sm"
            />
          </motion.div>
        )}

        {triggerType === 'payment_received' && (
          <motion.div
            key="payment_received"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="bg-[#1A1A1A] rounded-lg p-3"
          >
            <p className="text-xs text-[#A0A0A0]">Triggers automatically when a payment is received for an invoice.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Action Builder ──────────────────────────────────────────────────────────

function ActionCard({
  action,
  index,
  onUpdate,
  onRemove,
}: {
  action: WorkflowAction
  index: number
  onUpdate: (updated: WorkflowAction) => void
  onRemove: () => void
}) {
  const actionInfo = ACTION_TYPES.find((a) => a.value === action.type)
  const ActionIcon = actionInfo?.icon || Settings

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#F3D840]/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#A0A0A0]">{index + 1}</span>
          </div>
          <ActionIcon className="h-4 w-4 text-[#A0A0A0]" />
          <Select
            value={action.type}
            onValueChange={(v) => {
              let newConfig: Record<string, unknown> = {}
              switch (v) {
                case 'create_task':
                  newConfig = { title: '', priority: 'medium', description: '' }
                  break
                case 'send_email':
                  newConfig = { template: 'follow_up', to: 'contact' }
                  break
                case 'update_field':
                  newConfig = { field: 'stage', value: '' }
                  break
                case 'add_note':
                  newConfig = { text: '' }
                  break
                case 'create_meeting':
                  newConfig = { title: '', meetingType: 'call', duration: 30 }
                  break
                case 'create_proposal':
                  newConfig = { title: '', template: 'default' }
                  break
                case 'create_invoice':
                  newConfig = { autoFromDeal: true }
                  break
                case 'create_note':
                  newConfig = { text: '' }
                  break
                case 'notify':
                  newConfig = { user: 'admin', message: '' }
                  break
              }
              onUpdate({ type: v, config: newConfig })
            }}
          >
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTION_TYPES.map((a) => (
                <SelectItem key={a.value} value={a.value}>
                  <div className="flex items-center gap-2">
                    <a.icon className="h-3.5 w-3.5" />
                    {a.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
        </Button>
      </div>

      {/* Action config fields */}
      {action.type === 'create_task' && (
        <div className="space-y-2 pl-8">
          <Input
            placeholder="Task title"
            value={(action.config.title as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, title: e.target.value } })}
            className="text-sm h-8"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={(action.config.priority as string) || 'medium'}
              onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, priority: v } })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Description (optional)"
              value={(action.config.description as string) || ''}
              onChange={(e) => onUpdate({ ...action, config: { ...action.config, description: e.target.value } })}
              className="text-xs h-8"
            />
          </div>
        </div>
      )}

      {action.type === 'send_email' && (
        <div className="space-y-2 pl-8">
          <Input
            placeholder="Email template name"
            value={(action.config.template as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, template: e.target.value } })}
            className="text-sm h-8"
          />
          <Select
            value={(action.config.to as string) || 'contact'}
            onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, to: v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contact">Contact</SelectItem>
              <SelectItem value="deal_owner">Deal Owner</SelectItem>
              <SelectItem value="company_owner">Company Owner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === 'update_field' && (
        <div className="space-y-2 pl-8">
          <Select
            value={(action.config.field as string) || 'stage'}
            onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, field: v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stage">Deal Stage</SelectItem>
              <SelectItem value="status">Contact Status</SelectItem>
              <SelectItem value="priority">Task Priority</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={(action.config.value as string) || ''}
            onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, value: v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Set value to..." />
            </SelectTrigger>
            <SelectContent>
              {(action.config.field === 'stage' ? PIPELINE_STAGES :
                action.config.field === 'status' ? ['lead', 'prospect', 'customer', 'churned', 'inactive'] :
                action.config.field === 'priority' ? TASK_PRIORITIES : []).map((v) => (
                <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === 'add_note' && (
        <div className="space-y-2 pl-8">
          <Textarea
            placeholder="Note text to add..."
            value={(action.config.text as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, text: e.target.value } })}
            className="text-sm min-h-[60px]"
          />
        </div>
      )}

      {action.type === 'notify' && (
        <div className="space-y-2 pl-8">
          <Select
            value={(action.config.user as string) || 'admin'}
            onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, user: v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="deal_owner">Deal Owner</SelectItem>
              <SelectItem value="all">All Team Members</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Notification message"
            value={(action.config.message as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, message: e.target.value } })}
            className="text-sm h-8"
          />
        </div>
      )}

      {action.type === 'create_meeting' && (
        <div className="space-y-2 pl-8">
          <Input
            placeholder="Meeting title"
            value={(action.config.title as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, title: e.target.value } })}
            className="text-sm h-8"
          />
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={(action.config.meetingType as string) || 'call'}
              onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, meetingType: v } })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="in_person">In-Person</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              placeholder="Duration (min)"
              value={(action.config.duration as number) || 30}
              onChange={(e) => onUpdate({ ...action, config: { ...action.config, duration: parseInt(e.target.value) || 30 } })}
              className="text-xs h-8"
            />
          </div>
        </div>
      )}

      {action.type === 'create_proposal' && (
        <div className="space-y-2 pl-8">
          <Input
            placeholder="Proposal title"
            value={(action.config.title as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, title: e.target.value } })}
            className="text-sm h-8"
          />
          <Select
            value={(action.config.template as string) || 'default'}
            onValueChange={(v) => onUpdate({ ...action, config: { ...action.config, template: v } })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Template</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {action.type === 'create_invoice' && (
        <div className="pl-8">
          <p className="text-xs text-[#A0A0A0] bg-[#222222] rounded-md px-2 py-1.5">
            Automatically creates an invoice from the associated deal's value and line items.
          </p>
        </div>
      )}

      {action.type === 'create_note' && (
        <div className="space-y-2 pl-8">
          <Textarea
            placeholder="Note text to create..."
            value={(action.config.text as string) || ''}
            onChange={(e) => onUpdate({ ...action, config: { ...action.config, text: e.target.value } })}
            className="text-sm min-h-[60px]"
          />
        </div>
      )}
    </motion.div>
  )
}

// ─── Module Coverage Grid ──────────────────────────────────────────────────

function ModuleCoverageGrid({ rules }: { rules: WorkflowRule[] }) {
  const modules = useMemo(() => [
    {
      name: 'Deals',
      icon: Target,
      triggerTypes: ['deal_stage_change', 'deal_created'],
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Contacts',
      icon: Users,
      triggerTypes: ['new_contact', 'contact_inactive'],
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Tasks',
      icon: ClipboardCheck,
      triggerTypes: ['task_overdue', 'task_completed'],
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Proposals',
      icon: FileText,
      triggerTypes: ['proposal_status_change'],
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Meetings',
      icon: CalendarDays,
      triggerTypes: ['meeting_created', 'meeting_completed', 'meeting_cancelled'],
      color: 'text-sky-500',
      bgColor: 'bg-sky-50',
    },
    {
      name: 'Invoices',
      icon: CreditCard,
      triggerTypes: ['invoice_created', 'invoice_overdue'],
      color: 'text-amber-500',
      bgColor: 'bg-amber-50',
    },
    {
      name: 'Payments',
      icon: Banknote,
      triggerTypes: ['payment_received'],
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ], [])

  const coverage = useMemo(() => {
    const activeRules = rules.filter((r) => r.isActive)
    return modules.map((mod) => ({
      ...mod,
      covered: activeRules.some((r) => mod.triggerTypes.includes(r.triggerType)),
    }))
  }, [rules, modules])

  const coveredCount = coverage.filter((m) => m.covered).length

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#A0A0A0]">Coverage Score</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-white">{coveredCount}</span>
          <span className="text-xs text-gray-400">/ {modules.length} modules automated</span>
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
        {coverage.map((mod) => (
          <div
            key={mod.name}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg border transition-colors ${
              mod.covered
                ? 'border-green-200 bg-green-50/50'
                : 'border-[#2A2A2A] bg-[#0A0A0A]'
            }`}
          >
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${mod.covered ? mod.bgColor : 'bg-[#222222]'}`}>
              <mod.icon className={`h-4 w-4 ${mod.covered ? mod.color : 'text-gray-400'}`} />
            </div>
            {mod.covered ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <div className="h-3.5 w-3.5 rounded-full bg-[#444444]" />
            )}
            <span className={`text-[10px] font-medium ${mod.covered ? 'text-[#A0A0A0]' : 'text-gray-400'}`}>
              {mod.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Workflow Rule Dialog ────────────────────────────────────────────────────

function WorkflowRuleDialog({
  open,
  onOpenChange,
  editRule,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editRule?: WorkflowRule | null
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(editRule?.name || '')
  const [description, setDescription] = useState(editRule?.description || '')

  const allTriggerTypes = [
    { value: 'deal_stage_change', label: 'Deal Stage Change', configDesc: 'Which stage triggers this' },
    { value: 'deal_created', label: 'Deal Created', configDesc: 'When a new deal is created' },
    { value: 'new_contact', label: 'New Contact', configDesc: 'When a contact is created' },
    { value: 'contact_inactive', label: 'Contact Inactive', configDesc: 'Days without activity' },
    { value: 'task_overdue', label: 'Task Overdue', configDesc: 'Days overdue before triggering' },
    { value: 'task_completed', label: 'Task Completed', configDesc: 'When a task is completed' },
    { value: 'proposal_status_change', label: 'Proposal Status Change', configDesc: 'Which proposal status' },
    { value: 'meeting_created', label: 'Meeting Created', configDesc: 'When a meeting is scheduled' },
    { value: 'meeting_completed', label: 'Meeting Completed', configDesc: 'When a meeting is completed' },
    { value: 'invoice_created', label: 'Invoice Created', configDesc: 'When an invoice is created' },
    { value: 'invoice_overdue', label: 'Invoice Overdue', configDesc: 'Days after due date' },
    { value: 'payment_received', label: 'Payment Received', configDesc: 'When a payment is recorded' },
  ]

  const allActionTypes = [
    { value: 'create_task', label: 'Create Task' },
    { value: 'send_email', label: 'Send Email' },
    { value: 'create_meeting', label: 'Create Meeting' },
    { value: 'create_proposal', label: 'Create Proposal' },
    { value: 'create_invoice', label: 'Create Invoice' },
    { value: 'add_note', label: 'Add Note' },
    { value: 'update_field', label: 'Update Field' },
    { value: 'notify', label: 'Send Notification' },
  ]

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const url = editRule ? `/api/crm/workflows/${editRule.id}` : '/api/crm/workflows'
      const method = editRule ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save rule')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      onOpenChange(false)
      toast.success(editRule ? 'Rule updated' : 'Rule created')
    },
    onError: () => toast.error('Failed to save rule'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRule ? 'Edit' : 'New'} Workflow Rule</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            <Label>Rule Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Auto-follow up cold deals" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this rule do?" rows={2} />
          </div>
          <div className="space-y-2">
            <Label>Trigger Type</Label>
            <Select value={editRule?.triggerType || 'deal_stage_change'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allTriggerTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-[#1A1A1A] p-3 text-xs text-[#A0A0A0]">
            <p className="font-semibold text-[#A0A0A0] mb-1">Available Trigger Types:</p>
            <ul className="space-y-1 ml-3 list-disc">
              {allTriggerTypes.map((t) => (
                <li key={t.value}><span className="font-medium">{t.label}</span> — {t.configDesc}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select defaultValue="create_task">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allActionTypes.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-[#1A1A1A] p-3 text-xs text-[#A0A0A0]">
            <p className="font-semibold text-[#A0A0A0] mb-1">Available Action Types:</p>
            <ul className="space-y-1 ml-3 list-disc">
              {allActionTypes.map((a) => (
                <li key={a.value}><span className="font-medium">{a.label}</span></li>
              ))}
            </ul>
          </div>
          <Button
            onClick={() => {
              if (!name) { toast.error('Name is required'); return }
              saveMutation.mutate({ name, description, triggerType: 'deal_stage_change', actions: JSON.stringify([]) })
            }}
            disabled={saveMutation.isPending}
            className="w-full bg-[#F3D840] hover:bg-[#E5C832] text-[#1A1A1A] font-bold"
          >
            {saveMutation.isPending ? 'Saving...' : (editRule ? 'Update Rule' : 'Create Rule')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Execution History ───────────────────────────────────────────────────────

function ExecutionHistory({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { data } = useQuery({
    queryKey: ['workflow-executions'],
    queryFn: () => fetch('/api/crm/workflows/executions?limit=50').then((r) => r.json()),
    enabled: open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Execution History</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {data?.executions?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No executions yet</p>
          ) : (
            data?.executions?.map((ex: Record<string, unknown>) => (
              <div key={ex.id as string} className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] text-sm">
                <Badge variant={ex.status === 'success' ? 'default' : 'destructive'} className="text-xs">
                  {ex.status as string}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{ex.actionType as string}</p>
                  <p className="text-xs text-gray-400">{ex.triggerType as string} — {ex.entityType as string}</p>
                </div>
                <span className="text-xs text-gray-400">{format(new Date(ex.executedAt as string), 'MMM d, HH:mm')}</span>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Delete Dialog ───────────────────────────────────────────────────────────

function DeleteDialog({
  rule,
  onDelete,
}: {
  rule: WorkflowRule | null
  onDelete: () => void
}) {
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/crm/workflows/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Rule deleted')
      onDelete()
    },
    onError: () => toast.error('Failed to delete rule'),
  })

  if (!rule) return null

  return (
    <AlertDialog open={!!rule} onOpenChange={() => onDelete()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workflow Rule</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{rule.name}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onDelete}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteMutation.mutate(rule.id)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WorkflowsPage() {
  const queryClient = useQueryClient()

  // View
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set())
  const [historyOpen, setHistoryOpen] = useState(false)

  // Create dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Edit dialog
  const [editRule, setEditRule] = useState<WorkflowRule | null>(null)

  // Delete dialog
  const [deleteRule, setDeleteRule] = useState<WorkflowRule | null>(null)

  // Queries
  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => fetch('/api/crm/workflows?includeInactive=true').then((r) => r.json()),
  })

  const rules: WorkflowRule[] = data?.rules || []

  // Mutations
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/crm/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error('Failed to update rule')
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success(variables.isActive ? 'Rule activated' : 'Rule paused')
    },
    onError: () => toast.error('Failed to update rule'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/crm/workflows/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete rule')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success('Workflow rule deleted')
      setDeleteRule(null)
    },
    onError: () => toast.error('Failed to delete rule'),
  })

  const testMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      const res = await fetch('/api/crm/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to trigger workflow')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] })
      toast.success(`Workflow "${data.ruleName}" triggered successfully`)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  // Handlers
  const toggleExpanded = useCallback((id: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleEdit = useCallback((rule: WorkflowRule) => {
    setEditRule(rule)
  }, [])

  const handleEditDialogClose = useCallback((open: boolean) => {
    if (!open) setEditRule(null)
  }, [])

  // Stats
  const activeRules = rules.filter((r) => r.isActive).length
  const totalExecutions = rules.reduce((sum, r) => sum + r.executionCount, 0)

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }} className="px-4 pt-2 pb-6 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-[#F3D840]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Automations</h1>
              <p className="text-[#A0A0A0] text-sm mt-0.5">
                {activeRules} active rule{activeRules !== 1 ? 's' : ''} &middot; {totalExecutions} total executions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-xs"
            onClick={() => setHistoryOpen(true)}
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            History
          </Button>

          <WorkflowRuleDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            editRule={null}
          />
          <Button
            className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium h-9 text-xs"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Rule
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <Card className="border-[#2A2A2A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{activeRules}</p>
                <p className="text-xs text-[#A0A0A0]">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2A2A2A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#1A1A1A] flex items-center justify-center">
                <Pause className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{rules.length - activeRules}</p>
                <p className="text-xs text-[#A0A0A0]">Inactive Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2A2A2A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#F3D840]" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{totalExecutions}</p>
                <p className="text-xs text-[#A0A0A0]">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#2A2A2A]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{TRIGGER_TYPES.length}</p>
                <p className="text-xs text-[#A0A0A0]">Trigger Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Module Coverage */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
      >
        <Card className="border-[#2A2A2A]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
                  <LayoutGrid className="h-4 w-4 text-[#F3D840]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Module Coverage</h3>
                  <p className="text-xs text-[#A0A0A0]">Automation coverage across CRM modules</p>
                </div>
              </div>
            </div>
            <ModuleCoverageGrid rules={rules} />
          </CardContent>
        </Card>
      </motion.div>

      {/* Rule List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <span className="h-8 w-8 border-2 border-[#2A2A2A] border-t-[#F3D840] rounded-full animate-spin" />
              <p className="text-sm text-[#A0A0A0]">Loading workflows...</p>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-[#222222] flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-[#666666]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No automation rules yet</h3>
            <p className="text-sm text-[#A0A0A0] mb-4 max-w-md mx-auto">
              Create your first workflow automation to save time and keep your CRM running smoothly.
            </p>
            <Button
              className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium text-sm"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Create First Rule
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map((rule) => (
              <RuleCard
                key={rule.id}
                rule={rule}
                expanded={expandedRules.has(rule.id)}
                onToggle={() => toggleExpanded(rule.id)}
                onToggleActive={() => toggleActiveMutation.mutate({ id: rule.id, isActive: !rule.isActive })}
                onDelete={() => setDeleteRule(rule)}
                onEdit={() => handleEdit(rule)}
                onTest={() => testMutation.mutate(rule.id)}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Edit Dialog */}
      {editRule && (
        <WorkflowRuleDialog
          open={!!editRule}
          onOpenChange={handleEditDialogClose}
          editRule={editRule}
        />
      )}

      {/* Execution History */}
      <ExecutionHistory open={historyOpen} onOpenChange={setHistoryOpen} />

      {/* Delete Dialog */}
      <DeleteDialog
        rule={deleteRule}
        onDelete={() => setDeleteRule(null)}
      />
    </div>
  )
}
