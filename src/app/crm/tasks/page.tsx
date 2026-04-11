'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Plus,
  Check,
  Clock,
  AlertCircle,
  Trash2,
  Filter,
  ListTodo,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { toast } from 'sonner'

const columns = [
  { key: 'todo', label: 'To Do', color: 'bg-gray-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-400' },
]

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export default function TasksPage() {
  const queryClient = useQueryClient()

  const [priorityFilter, setPriorityFilter] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    dueDate: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', priorityFilter],
    queryFn: () =>
      fetch(
        `/api/crm/tasks?limit=100${priorityFilter ? `&priority=${priorityFilter}` : ''}`
      ).then((r) => r.json()),
  })

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, ...data }: { taskId: string; [key: string]: unknown }) => {
      const res = await fetch('/api/crm/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
      const res = await fetch(`/api/crm/tasks/${taskId}`, {
        method: 'DELETE',
      })
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
      setNewTask({ title: '', description: '', priority: 'medium', status: 'todo', dueDate: '' })
      toast.success('Task created successfully')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const tasks = data?.tasks || []

  const tasksByStatus = columns.reduce(
    (acc, col) => {
      acc[col.key] = tasks
        .filter((t: Record<string, string>) => t.status === col.key)
        .sort(
          (a: Record<string, string>, b: Record<string, string>) =>
            (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
        )
      return acc
    },
    {} as Record<string, Record<string, unknown>[]>
  )

  const handleMoveTask = (taskId: string, newStatus: string) => {
    updateTaskMutation.mutate({ taskId, status: newStatus })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} total tasks</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={priorityFilter || '__all__'} onValueChange={(v) => setPriorityFilter(v === '__all__' ? '' : v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium">
                <Plus className="h-4 w-4 mr-2" />
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
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={newTask.priority}
                      onValueChange={(v) => setNewTask({ ...newTask, priority: v })}
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
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    if (!newTask.title) {
                      toast.error('Title is required')
                      return
                    }
                    createMutation.mutate({
                      ...newTask,
                      dueDate: newTask.dueDate || undefined,
                    })
                  }}
                  disabled={createMutation.isPending}
                  className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Task Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl animate-pulse h-96" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col, colIndex) => (
            <motion.div
              key={col.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIndex * 0.05 }}
            >
              <Card className="border-0 shadow-sm h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                      <CardTitle className="text-sm font-semibold text-gray-700">
                        {col.label}
                      </CardTitle>
                    </div>
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {tasksByStatus[col.key]?.length || 0}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {tasksByStatus[col.key]?.map((task: Record<string, unknown>, i: number) => (
                    <motion.div
                      key={task.id as string}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${
                            col.key === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'
                          }`}>
                            {task.title as string}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                              {task.description as string}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {col.key !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-500 hover:bg-green-50"
                              onClick={() => handleMoveTask(task.id as string, 'completed')}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-400 hover:bg-red-50"
                            onClick={() => deleteTaskMutation.mutate(task.id as string)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <PriorityBadge priority={task.priority as string} />
                        {(task.dueDate as string) && (
                          <span className={`text-xs flex items-center gap-1 ${
                            new Date(task.dueDate as string) < new Date() && col.key !== 'completed'
                              ? 'text-red-500'
                              : 'text-gray-400'
                          }`}>
                            <Clock className="h-3 w-3" />
                            {format(new Date(task.dueDate as string), 'MMM d')}
                          </span>
                        )}
                      </div>
                      {task.assignee && (
                        <div className="text-xs text-gray-400 mt-1">
                          {(task.assignee as Record<string, string>).name}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {(!tasksByStatus[col.key] || tasksByStatus[col.key].length === 0) && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                      <ListTodo className="h-8 w-8 mb-2" />
                      <p className="text-xs">No tasks</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
