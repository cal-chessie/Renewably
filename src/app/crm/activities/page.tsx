'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Plus,
  Phone,
  Mail,
  Calendar,
  FileText,
  Filter,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { toast } from 'sonner'

function timeAgo(date: string | Date) {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return format(d, 'MMM d, yyyy')
}

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'call', label: 'Calls' },
  { value: 'email', label: 'Emails' },
  { value: 'meeting', label: 'Meetings' },
  { value: 'note', label: 'Notes' },
  { value: 'system', label: 'System' },
]

export default function ActivitiesPage() {
  const queryClient = useQueryClient()

  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newActivity, setNewActivity] = useState({
    type: 'call',
    subject: '',
    description: '',
    status: 'completed',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['activities', typeFilter, statusFilter, page],
    queryFn: () =>
      fetch(
        `/api/crm/activities?type=${typeFilter}&status=${statusFilter}&page=${page}&limit=20`
      ).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: async (activity: Record<string, string>) => {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      })
      if (!res.ok) throw new Error('Failed to log activity')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      setDialogOpen(false)
      setNewActivity({ type: 'call', subject: '', description: '', status: 'completed' })
      toast.success('Activity logged successfully')
    },
    onError: () => toast.error('Failed to log activity'),
  })

  return (
    <div className="p-6 lg:p-8 space-y-6" style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#FFFFFF' }}>Activities</h1>
          <p className="text-sm mt-1" style={{ color: '#A0A0A0' }}>
            {data?.pagination?.total || 0} total activities
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-medium" style={{ backgroundColor: '#F3D840', color: '#0A0A0A' }}>
              <Plus className="h-4 w-4 mr-2" />
              Log Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Log Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newActivity.type}
                  onValueChange={(v) => setNewActivity({ ...newActivity, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="note">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input
                  value={newActivity.subject}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, subject: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newActivity.description}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, description: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newActivity.status}
                  onValueChange={(v) => setNewActivity({ ...newActivity, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => {
                  if (!newActivity.subject) {
                    toast.error('Subject is required')
                    return
                  }
                  createMutation.mutate(newActivity)
                }}
                disabled={createMutation.isPending}
                className="w-full"
                style={{ backgroundColor: '#F3D840', color: '#0A0A0A' }}
              >
                {createMutation.isPending ? 'Saving...' : 'Log Activity'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Select value={typeFilter || '__all__'} onValueChange={(v) => { setTypeFilter(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((opt) => (
              <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || '__all__'} onValueChange={(v) => { setStatusFilter(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl animate-pulse" style={{ backgroundColor: '#1A1A1A' }} />
            ))}
          </div>
        ) : data?.activities?.length === 0 ? (
          <Card className="border-0 shadow-sm p-12 text-center" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}>
            <p style={{ color: '#666666' }}>No activities found</p>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5" style={{ backgroundColor: '#2A2A2A' }} />

            <div className="space-y-1">
              {data?.activities?.map((activity: Record<string, unknown>, i: number) => (
                <motion.div
                  key={activity.id as string}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="relative flex items-start gap-4 pl-2"
                >
                  <div className="relative z-10 mt-1">
                    <ActivityIcon type={activity.type as string} size="sm" />
                  </div>
                  <Card className="flex-1 border-0 shadow-sm mb-3" style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: '#FFFFFF' }}>
                            {activity.subject as string}
                          </p>
                          {activity.description && (
                            <p className="text-sm mt-1 line-clamp-2" style={{ color: '#A0A0A0' }}>
                              {activity.description as string}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs" style={{ color: '#666666' }}>
                            {timeAgo(activity.createdAt as string)}
                          </p>
                          {activity.status && activity.status !== 'completed' && (
                            <Badge variant="secondary" className="text-xs mt-1 capitalize">
                              {activity.status as string}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2 pt-2" style={{ borderTop: '1px solid #2A2A2A' }}>
                        <span className="text-xs font-medium uppercase" style={{ color: '#666666' }}>
                          {activity.type as string}
                        </span>
                        {activity.contact && (
                          <span className="text-xs" style={{ color: '#A0A0A0' }}>
                            with {(activity.contact as Record<string, string>).firstName} {(activity.contact as Record<string, string>).lastName}
                          </span>
                        )}
                        {activity.deal && (
                          <span className="text-xs" style={{ color: '#F3D840' }}>
                            📋 {(activity.deal as Record<string, string>).title}
                          </span>
                        )}
                        {activity.duration && (
                          <span className="text-xs" style={{ color: '#666666' }}>
                            ⏱ {activity.duration}min
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm" style={{ color: '#A0A0A0' }}>
              Page {page} of {data.pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
