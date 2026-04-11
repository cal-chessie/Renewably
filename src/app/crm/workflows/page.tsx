'use client'

import { useState, useCallback } from 'react'
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
  { value: 'new_contact', label: 'New Contact', icon: Bot, color: 'text-green-500', bgColor: 'bg-green-50' },
  { value: 'task_overdue', label: 'Task Overdue', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-50' },
  { value: 'proposal_status_change', label: 'Proposal Status Change', icon: Workflow, color: 'text-purple-500', bgColor: 'bg-purple-50' },
  { value: 'contact_inactive', label: 'Contact Inactive', icon: Clock, color: 'text-orange-500', bgColor: 'bg-orange-50' },
] as const

const ACTION_TYPES = [
  { value: 'create_task', label: 'Create Task', icon: Sparkles },
  { value: 'send_email', label: 'Send Email', icon: Workflow },
  { value: 'update_field', label: 'Update Field', icon: Settings },
  { value: 'add_note', label: 'Add Note', icon: Info },
  { value: 'notify', label: 'Send Notification', icon: Zap },
] as const

const PIPELINE_STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
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
      return `When deal moves to "${triggerConfig.stage || 'any'}" stage`
    case 'new_contact':
      return 'When a new contact is created'
    case 'task_overdue':
      return `When task is overdue by ${triggerConfig.days || 7}+ days`
    case 'proposal_status_change':
      return `When proposal status changes to "${triggerConfig.status || 'any'}"`
    case 'contact_inactive':
      return `When contact has no activity for ${triggerConfig.days || 30}+ days`
    default:
      return triggerType
  }
}

function formatActionDescription(actionType: string, actionConfig: Record<string, unknown>): string {
  switch (actionType) {
    case 'create_task':
      return `Create task "${actionConfig.title || 'Untitled'}" (priority: ${actionConfig.priority || 'medium'})`
    case 'send_email':
      return `Send email template "${actionConfig.template || 'default'}" to ${actionConfig.to || 'recipient'}`
    case 'update_field':
      return `Update ${actionConfig.field || 'field'} to "${actionConfig.value || ''}"`
    case 'add_note':
      return `Add note "${(actionConfig.text || '').substring(0, 40)}"`
    case 'notify':
      return `Notify ${actionConfig.user || 'team'}: "${(actionConfig.message || '').substring(0, 40)}"`
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
    <Badge variant="outline" className="text-gray-500 border-gray-200 bg-gray-50 gap-1 text-xs font-medium">
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
      <Card className={`border transition-all duration-200 ${rule.isActive ? 'border-gray-200 shadow-sm' : 'border-gray-100 opacity-70'}`}>
        <CardContent className="p-0">
          {/* Header row */}
          <div className="flex items-center gap-3 p-4">
            {/* Active indicator */}
            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${rule.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />

            {/* Trigger icon */}
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${triggerInfo?.bgColor || 'bg-gray-50'}`}>
              <TriggerIconComponent className={`h-4.5 w-4.5 ${triggerInfo?.color || 'text-gray-500'}`} />
            </div>

            {/* Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{rule.name}</h3>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  {getTriggerLabel(rule.triggerType)}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
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
                <div className="px-4 pb-4 border-t border-gray-100">
                  {/* Actions list */}
                  <div className="pt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</p>
                    {actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <ArrowRight className="h-3.5 w-3.5 text-[#F3D840] shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">{getActionLabel(action.type)}</span>
                        <span className="text-xs text-gray-500 truncate">
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
                    <p className="text-xs text-gray-500 mt-3 bg-gray-50 rounded-lg p-3">{rule.description}</p>
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
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${triggerInfo?.bgColor || 'bg-gray-50'}`}>
          <TriggerIcon className={`h-4 w-4 ${triggerInfo?.color || 'text-gray-500'}`} />
        </div>
        <Label className="text-sm font-medium text-gray-700">When this happens...</Label>
      </div>

      <Select value={triggerType} onValueChange={(v) => {
        onTriggerTypeChange(v)
        // Reset config for new trigger type
        switch (v) {
          case 'deal_stage_change':
            onConfigChange({ stage: 'Qualified' })
            break
          case 'new_contact':
            onConfigChange({})
            break
          case 'task_overdue':
            onConfigChange({ days: 7 })
            break
          case 'proposal_status_change':
            onConfigChange({ status: 'sent' })
            break
          case 'contact_inactive':
            onConfigChange({ days: 30 })
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
            className="space-y-2 bg-gray-50 rounded-lg p-3"
          >
            <Label className="text-xs text-gray-500">When deal moves to stage:</Label>
            <Select
              value={(triggerConfig.stage as string) || ''}
              onValueChange={(v) => onConfigChange({ ...triggerConfig, stage: v })}
            >
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {PIPELINE_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>{stage}</SelectItem>
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
            className="bg-gray-50 rounded-lg p-3"
          >
            <p className="text-xs text-gray-500">Triggers automatically when a new contact is created in the CRM.</p>
          </motion.div>
        )}

        {triggerType === 'task_overdue' && (
          <motion.div
            key="task_overdue"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="space-y-2 bg-gray-50 rounded-lg p-3"
          >
            <Label className="text-xs text-gray-500">When task is overdue by (days):</Label>
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
            className="space-y-2 bg-gray-50 rounded-lg p-3"
          >
            <Label className="text-xs text-gray-500">When proposal status is:</Label>
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
            className="space-y-2 bg-gray-50 rounded-lg p-3"
          >
            <Label className="text-xs text-gray-500">When contact has no activity for (days):</Label>
            <Input
              type="number"
              min={1}
              value={(triggerConfig.days as number) || 30}
              onChange={(e) => onConfigChange({ ...triggerConfig, days: parseInt(e.target.value) || 30 })}
              className="w-full text-sm"
            />
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
      className="bg-gray-50 border border-gray-100 rounded-lg p-3 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#F3D840]/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-700">{index + 1}</span>
          </div>
          <ActionIcon className="h-4 w-4 text-gray-500" />
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
    </motion.div>
  )
}

// ─── Create/Edit Dialog ──────────────────────────────────────────────────────

function WorkflowRuleDialog({
  open,
  onOpenChange,
  editRule,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editRule: WorkflowRule | null
}) {
  const queryClient = useQueryClient()

  const [name, setName] = useState(editRule?.name || '')
  const [description, setDescription] = useState(editRule?.description || '')
  const [triggerType, setTriggerType] = useState(editRule?.triggerType || 'deal_stage_change')
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>(
    parseJSON<Record<string, unknown>>(editRule?.triggerConfig, { stage: 'Qualified' })
  )
  const [actions, setActions] = useState<WorkflowAction[]>(
    parseJSON<WorkflowAction[]>(editRule?.actions, [{ ...DEFAULT_ACTION }])
  )

  const isEditing = !!editRule

  // Reset form when dialog opens
  const handleOpenChange = useCallback((open: boolean) => {
    if (open && editRule) {
      setName(editRule.name)
      setDescription(editRule.description || '')
      setTriggerType(editRule.triggerType)
      setTriggerConfig(parseJSON<Record<string, unknown>>(editRule.triggerConfig, {}))
      setActions(parseJSON<WorkflowAction[]>(editRule.actions, [{ ...DEFAULT_ACTION }]))
    } else if (open && !editRule) {
      setName('')
      setDescription('')
      setTriggerType('deal_stage_change')
      setTriggerConfig({ stage: 'Qualified' })
      setActions([{ ...DEFAULT_ACTION }])
    }
    onOpenChange(open)
  }, [editRule, onOpenChange])

  const addAction = useCallback(() => {
    setActions([...actions, { ...DEFAULT_ACTION }])
  }, [actions])

  const updateAction = useCallback((index: number, updated: WorkflowAction) => {
    const newActions = [...actions]
    newActions[index] = updated
    setActions(newActions)
  }, [actions])

  const removeAction = useCallback((index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }, [actions])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = isEditing ? `/api/crm/workflows/${editRule.id}` : '/api/crm/workflows'
      const method = isEditing ? 'PUT' : 'POST'
      const body = {
        name,
        description,
        triggerType,
        triggerConfig,
        actions,
        isActive: true,
      }
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save workflow rule')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] })
      toast.success(isEditing ? 'Workflow rule updated' : 'Workflow rule created')
      handleOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast.error('Rule name is required')
      return
    }
    if (actions.length === 0) {
      toast.error('At least one action is required')
      return
    }
    saveMutation.mutate()
  }, [name, actions, saveMutation])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
              <Zap className="h-4 w-4 text-[#F3D840]" />
            </div>
            {isEditing ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify your automation rule settings.'
              : 'Set up a trigger and define actions to automate your workflow.'}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* Name & Description */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Rule Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Auto-follow up cold deals"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this automation do?"
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>

          <Separator />

          {/* Trigger Builder */}
          <TriggerBuilder
            triggerType={triggerType}
            triggerConfig={triggerConfig}
            onTriggerTypeChange={setTriggerType}
            onConfigChange={setTriggerConfig}
          />

          <Separator />

          {/* Action Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-[#F3D840]" />
                </div>
                <Label className="text-sm font-medium text-gray-700">Then do this...</Label>
              </div>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {actions.map((action, index) => (
                  <ActionCard
                    key={index}
                    action={action}
                    index={index}
                    onUpdate={(updated) => updateAction(index, updated)}
                    onRemove={() => removeAction(index)}
                  />
                ))}
              </AnimatePresence>
            </div>

            <Button variant="outline" size="sm" className="w-full text-xs" onClick={addAction}>
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Another Action
            </Button>
          </div>

          <Separator />

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</p>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">{getTriggerLabel(triggerType)}</Badge>
              <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-xs text-gray-600">
                {actions.map((a) => getActionLabel(a.type)).join(', ')}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            <X className="h-4 w-4 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-[#374151] hover:bg-[#1F2937] text-white"
          >
            {saveMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {isEditing ? 'Update Rule' : 'Create Rule'}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Execution History Panel ─────────────────────────────────────────────────

function ExecutionHistory({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [statusFilter, setStatusFilter] = useState('')
  const [ruleFilter, setRuleFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-executions', statusFilter, ruleFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' })
      if (statusFilter) params.set('status', statusFilter)
      if (ruleFilter) params.set('ruleId', ruleFilter)
      return fetch(`/api/crm/workflows/executions?${params.toString()}`).then((r) => r.json())
    },
    enabled: open,
  })

  const { data: rulesData } = useQuery({
    queryKey: ['workflows', 'all'],
    queryFn: () => fetch('/api/crm/workflows?includeInactive=true').then((r) => r.json()),
    enabled: open,
  })

  const rules = (rulesData?.rules || []) as WorkflowRule[]
  const executions = (data?.executions || []) as WorkflowExecution[]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl p-0 overflow-y-auto">
        <SheetHeader className="px-6 pt-6 pb-0">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
              <RotateCcw className="h-4 w-4 text-[#F3D840]" />
            </div>
            Execution History
          </SheetTitle>
          <SheetDescription>
            Review recent workflow executions and their results.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter || '__all__'} onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={ruleFilter || '__all__'} onValueChange={(v) => setRuleFilter(v === '__all__' ? '' : v)}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="All Rules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Rules</SelectItem>
                {rules.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-gray-200 border-t-[#F3D840] rounded-full animate-spin" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No executions found</p>
              <p className="text-xs text-gray-400 mt-1">Executions will appear here when workflows are triggered.</p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Rule</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Action</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 hidden md:table-cell">Entity</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-3 py-2 hidden lg:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((exec, index) => (
                    <tr
                      key={exec.id}
                      className={`border-b border-gray-100 last:border-0 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      } hover:bg-gray-50 transition-colors`}
                    >
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-medium text-gray-900 truncate max-w-[160px]">
                          {exec.rule?.name || 'Unknown'}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs text-gray-600 truncate max-w-[140px]">
                          {getActionLabel(exec.actionType)}
                        </p>
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusBadge status={exec.status} />
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <p className="text-xs text-gray-500">
                          {exec.entityType}/{exec.entityId.substring(0, 6)}...
                        </p>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell">
                        <p className="text-xs text-gray-400">
                          {format(new Date(exec.executedAt), 'MMM d, h:mm a')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {executions.length > 0 && data?.pagination && (
            <p className="text-xs text-gray-400 text-center">
              Showing {executions.length} of {data.pagination.total} executions
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ─── Delete Confirmation Dialog ──────────────────────────────────────────────

function DeleteDialog({
  open,
  onOpenChange,
  ruleName,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ruleName: string
  onConfirm: () => void
  loading: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
              <Trash2 className="h-4 w-4 text-red-500" />
            </div>
            Delete Workflow Rule
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>&quot;{ruleName}&quot;</strong>? This will also remove all execution history for this rule. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </span>
            ) : (
              'Delete Rule'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <div className="p-4 lg:p-6 space-y-5">
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
              <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
              <p className="text-gray-500 text-sm mt-0.5">
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
        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{activeRules}</p>
                <p className="text-xs text-gray-500">Active Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <Pause className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{rules.length - activeRules}</p>
                <p className="text-xs text-gray-500">Inactive Rules</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#F3D840]/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#F3D840]" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{totalExecutions}</p>
                <p className="text-xs text-gray-500">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Bot className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{TRIGGER_TYPES.length}</p>
                <p className="text-xs text-gray-500">Trigger Types</p>
              </div>
            </div>
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
              <span className="h-8 w-8 border-2 border-gray-200 border-t-[#F3D840] rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading workflows...</p>
            </div>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No automation rules yet</h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
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
        open={!!deleteRule}
        onOpenChange={(open) => !open && setDeleteRule(null)}
        ruleName={deleteRule?.name || ''}
        onConfirm={() => deleteRule && deleteMutation.mutate(deleteRule.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
