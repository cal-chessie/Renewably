'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Plus,
  Check,
  Clock,
  Trash2,
  ListTodo,
  GripVertical,
  Phone,
  Mail,
  FileText,
  Activity,
  MessageSquare,
  Save,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────────────

interface TaskContact {
  id: string
  firstName: string
  lastName: string
  phone?: string | null
}

interface TaskAssignee {
  id: string
  name: string
  avatar?: string | null
}

interface TaskDeal {
  id: string
  title: string
}

interface Task {
  id: string
  title: string
  description?: string | null
  priority: string
  status: string
  dueDate?: string | null
  completedAt?: string | null
  createdAt: string
  contactId?: string | null
  contact?: TaskContact | null
  dealId?: string | null
  deal?: TaskDeal | null
  assigneeId?: string | null
  assignee?: TaskAssignee | null
}

interface ContactOption {
  id: string
  firstName: string
  lastName: string
  phone?: string | null
}

// ─── Constants ───────────────────────────────────────────────────────────────

const columns = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-400' },
] as const

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function isOverdue(dueDate: string, status: string) {
  return new Date(dueDate) < new Date() && status !== 'completed'
}

function getContactFullName(contact: TaskContact | null | undefined) {
  if (!contact) return null
  return `${contact.firstName} ${contact.lastName}`
}

// ─── Sortable Task Card ──────────────────────────────────────────────────────

function SortableTaskCard({
  task,
  onOpenDetail,
  onComplete,
  onDelete,
}: {
  task: Task
  onOpenDetail: (task: Task) => void
  onComplete: (taskId: string) => void
  onDelete: (taskId: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const col = columns.find((c) => c.key === task.status)
  const isCompleted = task.status === 'completed'

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div
        className="rounded-lg p-3 hover:shadow-sm transition-shadow cursor-pointer" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "12px" }}
        onClick={() => onOpenDetail(task)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onOpenDetail(task)
        }}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Drag handle */}
          <button
            className="mt-0.5 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag task"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </button>

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug line-clamp-2"
              style={{ color: isCompleted ? '#666666' : '#FFFFFF', textDecoration: isCompleted ? 'line-through' : 'none' }}
            >
              {task.title}
            </p>
            {task.description && (
              <p className="text-xs mt-1 line-clamp-1" style={{ color: "#A0A0A0" }}>
                {task.description}
              </p>
            )}
          </div>

          {/* Hover actions */}
          <div className="flex items-center gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {col && col.key !== 'completed' && col.key !== 'cancelled' && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-500 hover:bg-green-50"
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete(task.id)
                }}
                aria-label="Complete task"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-400 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(task.id)
              }}
              aria-label="Delete task"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2.5 pl-0">
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            {task.dueDate && (
              <span
                className="text-xs flex items-center gap-1" style={{ color: isOverdue(task.dueDate, task.status) ? "#EF4444" : "#A0A0A0", fontWeight: isOverdue(task.dueDate, task.status) ? 500 : 400 }}
              >
                <Clock className="h-3 w-3" />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}
          </div>

          {task.assignee && (
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: "#F3D840", color: "#0A0A0A" }}
              title={task.assignee.name}
            >
              {getInitials(task.assignee.name)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Drag Overlay Card ───────────────────────────────────────────────────────

function DragOverlayCard({ task }: { task: Task }) {
  return (
    <div className="rounded-lg p-3 shadow-lg w-72 rotate-2" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: "12px" }}>
      <p className="text-sm font-medium text-gray-900 line-clamp-2">
        {task.title}
      </p>
      <div className="flex items-center gap-2 mt-2">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Column Component ────────────────────────────────────────────────────────

function TaskColumn({
  col,
  tasks,
  onOpenDetail,
  onComplete,
  onDelete,
}: {
  col: (typeof columns)[number]
  tasks: Task[]
  onOpenDetail: (task: Task) => void
  onComplete: (taskId: string) => void
  onDelete: (taskId: string) => void
}) {
  const taskIds = tasks.map((t) => t.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col"
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
          <span className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{col.label}</span>
        </div>
        <span className="h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center" style={{ fontSize: "12px", fontWeight: "bold", color: "#666666", backgroundColor: "#1A1A1A" }}>
          {tasks.length}
        </span>
      </div>

      {/* Droppable zone */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="rounded-xl p-2 min-h-[200px] max-h-[calc(100vh-240px)] overflow-y-auto space-y-2" style={{ backgroundColor: "#141414" }}>
          {tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <SortableTaskCard
                task={task}
                onOpenDetail={onOpenDetail}
                onComplete={onComplete}
                onDelete={onDelete}
              />
            </motion.div>
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: "#666666" }}>
              <ListTodo className="h-8 w-8 mb-2" />
              <p className="text-xs">No tasks</p>
            </div>
          )}
        </div>
      </SortableContext>
    </motion.div>
  )
}

// ─── Task Detail Drawer ──────────────────────────────────────────────────────

function TaskDetailDrawer({
  task,
  open,
  onOpenChange,
  contacts,
}: {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: ContactOption[]
}) {
  const queryClient = useQueryClient()
  const [editForm, setEditForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? '',
    priority: task?.priority ?? '',
    dueDate: task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
    assigneeId: task?.assigneeId ?? '',
  })
  const [noteText, setNoteText] = useState('')
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [activityType, setActivityType] = useState<'call' | 'email'>('call')
  const [activitySubject, setActivitySubject] = useState('')
  const [activityDescription, setActivityDescription] = useState('')

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task?.id, ...data }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task updated')
    },
    onError: () => toast.error('Failed to update task'),
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          taskId: task?.id,
          contactId: task?.contactId || undefined,
          dealId: task?.dealId || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      setNoteText('')
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const logActivityMutation = useMutation({
    mutationFn: async ({
      type,
      subject,
      description,
    }: {
      type: string
      subject: string
      description: string
    }) => {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          subject,
          description: description || undefined,
          contactId: task?.contactId || undefined,
          dealId: task?.dealId || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to log activity')
      return res.json()
    },
    onSuccess: () => {
      setActivityDialogOpen(false)
      setActivitySubject('')
      setActivityDescription('')
      toast.success('Activity logged')
    },
    onError: () => toast.error('Failed to log activity'),
  })

  if (!task) return null

  const contactName = getContactFullName(task.contact)
  const contactPhone = task.contact?.phone

  const handleSave = () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required')
      return
    }
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || null,
      status: editForm.status,
      priority: editForm.priority,
      dueDate: editForm.dueDate || null,
      assigneeId: editForm.assigneeId || null,
    })
  }

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNoteMutation.mutate(noteText.trim())
  }

  const handleLogActivity = () => {
    if (!activitySubject.trim()) {
      toast.error('Subject is required')
      return
    }
    logActivityMutation.mutate({
      type: activityType,
      subject: activitySubject,
      description: activityDescription,
    })
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg p-0 overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-0">
            <SheetTitle className="text-lg">Task Details</SheetTitle>
            <SheetDescription>Edit task details and manage related actions.</SheetDescription>
          </SheetHeader>

          <div className="px-6 py-4 space-y-5">
            {/* Editable fields */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-gray-500">Description</Label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="text-sm min-h-[80px]"
                  placeholder="Add a description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Priority</Label>
                  <Select
                    value={editForm.priority}
                    onValueChange={(v) => setEditForm({ ...editForm, priority: v })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Due Date</Label>
                  <Input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">Assignee</Label>
                  <Select
                    value={editForm.assigneeId}
                    onValueChange={(v) => setEditForm({ ...editForm, assigneeId: v })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Unassigned</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Related info */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500">Related</Label>
              <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: "#141414" }}>
                {contactName ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 shrink-0">Contact</span>
                    <a
                      href={`/crm/contacts/${task.contactId}`}
                      className="text-sm hover:text-[#F3D840] hover:underline font-medium" style={{ color: "#FFFFFF" }}
                    >
                      {contactName}
                    </a>
                  </div>
                ) : null}
                {task.deal ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16 shrink-0">Deal</span>
                    <a
                      href={`/crm/deals/${task.dealId}`}
                      className="text-sm hover:text-[#F3D840] hover:underline font-medium" style={{ color: "#FFFFFF" }}
                    >
                      {task.deal.title}
                    </a>
                  </div>
                ) : null}
                {!contactName && !task.deal && (
                  <p className="text-xs text-gray-400">No related contact or deal</p>
                )}
              </div>
            </div>

            {/* Created date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Created</Label>
              <p className="text-sm" style={{ color: "#A0A0A0" }}>
                {format(new Date(task.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
              </p>
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="w-full" style={{ backgroundColor: "#F3D840", color: "#0A0A0A" }}
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </span>
              )}
            </Button>

            <Separator />

            {/* Quick actions */}
            <div className="space-y-3">
              <Label className="text-xs font-medium text-gray-500">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setActivityDialogOpen(true)}
                >
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  Log Activity
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => {
                    toast.info('Google Calendar integration coming soon')
                  }}
                >
                  <Mail className="h-3.5 w-3.5 mr-1.5" />
                  Send Email
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  asChild={!!contactPhone}
                  disabled={!contactPhone}
                  {...(contactPhone
                    ? { onClick: () => window.open(`tel:${contactPhone}`, '_self') }
                    : {})}
                >
                  <span className="flex items-center">
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    Call Contact
                  </span>
                </Button>
              </div>
            </div>

            <Separator />

            {/* Add Note */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Add Note
              </Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a note about this task..."
                className="text-sm min-h-[72px]"
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs"
                disabled={!noteText.trim() || addNoteMutation.isPending}
                onClick={handleAddNote}
              >
                {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Log Activity dialog */}
      <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={activityType}
                onValueChange={(v) => setActivityType(v as 'call' | 'email')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                value={activitySubject}
                onChange={(e) => setActivitySubject(e.target.value)}
                placeholder="Activity subject"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={activityDescription}
                onChange={(e) => setActivityDescription(e.target.value)}
                placeholder="Optional details..."
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActivityDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                className="flex-1" style={{ backgroundColor: "#F3D840", color: "#0A0A0A" }}
                disabled={logActivityMutation.isPending || !activitySubject.trim()}
                onClick={handleLogActivity}
              >
                {logActivityMutation.isPending ? 'Logging...' : 'Log Activity'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TasksPage() {
  const queryClient = useQueryClient()

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
    contactId: '',
    assigneeId: '',
  })

  // Detail drawer
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // DnD
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  // ─── Queries ─────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', priorityFilter, statusFilter],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '100' })
      if (priorityFilter) params.set('priority', priorityFilter)
      if (statusFilter) params.set('status', statusFilter)
      return fetch(`/api/crm/tasks?${params.toString()}`).then((r) => r.json())
    },
  })

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', 'select'],
    queryFn: () => fetch('/api/crm/contacts?limit=100').then((r) => r.json()),
  })

  const contacts: ContactOption[] = (contactsData?.contacts || []).map(
    (c: Record<string, unknown>) => ({
      id: c.id as string,
      firstName: c.firstName as string,
      lastName: c.lastName as string,
      phone: (c.phone as string) || null,
    })
  )

  // ─── Mutations ───────────────────────────────────────────────────────────

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      ...data
    }: {
      taskId: string
      [key: string]: unknown
    }) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...data }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: () => toast.error('Failed to update task'),
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/crm/tasks/${taskId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete task')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
    },
    onError: () => toast.error('Failed to delete task'),
  })

  const createMutation = useMutation({
    mutationFn: async (task: Record<string, string>) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create task')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setDialogOpen(false)
      setNewTask({
        title: '',
        description: '',
        priority: 'medium',
        status: 'todo',
        dueDate: '',
        contactId: '',
        assigneeId: '',
      })
      toast.success('Task created successfully')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  // ─── Derived Data ───────────────────────────────────────────────────────

  const tasks: Task[] = data?.tasks || []

  const tasksByStatus = useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.key] = tasks
          .filter((t) => t.status === col.key)
          .sort(
            (a, b) =>
              (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
          )
        return acc
      },
      {} as Record<string, Task[]>
    )
  }, [tasks])

  // ─── DnD Handlers ───────────────────────────────────────────────────────

  const findTaskStatus = useCallback(
    (taskId: string): string | undefined => {
      for (const col of columns) {
        const found = tasksByStatus[col.key]?.find((t) => t.id === taskId)
        if (found) return col.key
      }
      return undefined
    },
    [tasksByStatus]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const task = active.data.current?.task as Task | undefined
    if (task) setActiveTask(task)
  }, [])

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // We handle the final state on drag end
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over) return

      const activeTaskData = active.data.current?.task as Task | undefined
      if (!activeTaskData) return

      const currentStatus = activeTaskData.status

      // Check if dropped over a column zone
      const overData = over.data.current
      if (overData?.type === 'column') {
        const newStatus = overData.column as string
        if (newStatus !== currentStatus) {
          updateTaskMutation.mutate({ taskId: activeTaskData.id, status: newStatus })
        }
        return
      }

      // Check if dropped over another task card
      if (overData?.type === 'task') {
        const overTask = overData.task as Task
        const targetStatus = overTask.status
        if (targetStatus !== currentStatus) {
          updateTaskMutation.mutate({
            taskId: activeTaskData.id,
            status: targetStatus,
          })
        }
      }
    },
    [updateTaskMutation]
  )

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleOpenDetail = useCallback((task: Task) => {
    setSelectedTask(task)
    setDrawerOpen(true)
  }, [])

  const handleComplete = useCallback(
    (taskId: string) => {
      updateTaskMutation.mutate({ taskId, status: 'completed' })
    },
    [updateTaskMutation]
  )

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteTaskMutation.mutate(taskId)
    },
    [deleteTaskMutation]
  )

  const handleCreate = useCallback(() => {
    if (!newTask.title.trim()) {
      toast.error('Title is required')
      return
    }
    createMutation.mutate({
      ...newTask,
      dueDate: newTask.dueDate || undefined as string | undefined,
      contactId: newTask.contactId || undefined as string | undefined,
      assigneeId: newTask.assigneeId || undefined as string | undefined,
    })
  }, [newTask, createMutation])

  return (
    <div className="px-4 pt-2 pb-6 sm:p-6 lg:p-8 space-y-5" style={{ backgroundColor: "#0A0A0A", minHeight: "100vh" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>Tasks</h1>
          <p className="text-sm mt-1" style={{ color: "#A0A0A0" }}>
            {tasks.length} total task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority filter */}
          <Select
            value={priorityFilter || '__all__'}
            onValueChange={(v) => setPriorityFilter(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select
            value={statusFilter || '__all__'}
            onValueChange={(v) => setStatusFilter(v === '__all__' ? '' : v)}
          >
            <SelectTrigger className="w-36 h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Statuses</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* New Task button */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="font-medium h-9 text-xs" style={{ backgroundColor: "#F3D840", color: "#0A0A0A" }}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label>Title *</Label>
                  <Input
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) =>
                        setNewTask({ ...newTask, priority: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) =>
                        setNewTask({ ...newTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select
                      value={newTask.assigneeId}
                      onValueChange={(v) =>
                        setNewTask({ ...newTask, assigneeId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact</Label>
                    <Select
                      value={newTask.contactId}
                      onValueChange={(v) =>
                        setNewTask({ ...newTask, contactId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.firstName} {c.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full" style={{ backgroundColor: "#F3D840", color: "#0A0A0A" }}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Task Board with DnD */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="bg-gray-100 rounded-xl animate-pulse h-96" />
            </motion.div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {columns.map((col, colIndex) => (
              <SortableContext
                key={col.key}
                items={tasksByStatus[col.key]?.map((t) => t.id) || []}
                strategy={verticalListSortingStrategy}
              >
                <div data-column={col.key}>
                  <TaskColumn
                    col={col}
                    tasks={tasksByStatus[col.key] || []}
                    onOpenDetail={handleOpenDetail}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                </div>
              </SortableContext>
            ))}
          </div>

          <DragOverlay>
            {activeTask ? <DragOverlayCard task={activeTask} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Task Detail Drawer */}
      <TaskDetailDrawer
        key={selectedTask?.id ?? 'closed'}
        task={selectedTask}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open)
          if (!open) setSelectedTask(null)
        }}
        contacts={contacts}
      />
    </div>
  )
}
