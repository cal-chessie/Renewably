'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Linkedin,
  Edit3,
  Plus,
  MessageSquare,
  DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { StatusBadge } from '@/components/crm/StatusBadge'
import { PriorityBadge } from '@/components/crm/PriorityBadge'
import { ActivityIcon } from '@/components/crm/ActivityIcon'
import { toast } from 'sonner'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

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

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const contactId = params.id as string

  const { data, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => fetch(`/api/crm/contacts/${contactId}`).then((r) => r.json()),
    enabled: !!contactId,
  })

  const [noteContent, setNoteContent] = useState('')
  const [activityDialogOpen, setActivityDialogOpen] = useState(false)
  const [newActivity, setNewActivity] = useState({
    type: 'call',
    subject: '',
    description: '',
    status: 'completed',
  })

  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/crm/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, contactId }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      setNoteContent('')
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const addActivityMutation = useMutation({
    mutationFn: async (activity: Record<string, string>) => {
      const res = await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...activity, contactId }),
      })
      if (!res.ok) throw new Error('Failed to log activity')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] })
      setActivityDialogOpen(false)
      setNewActivity({ type: 'call', subject: '', description: '', status: 'completed' })
      toast.success('Activity logged')
    },
    onError: () => toast.error('Failed to log activity'),
  })

  if (isLoading || !data) {
    return (
      <div className="p-6 lg:p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  const contact = data.contact
  const tags = (contact.tags || []).map((t: Record<string, unknown>) => t.tag)

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/crm/contacts')}
        className="text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Contacts
      </Button>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-2xl bg-[#F3D840]/20 flex items-center justify-center shrink-0">
            <span className="text-[#895A18] text-xl font-bold">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.jobTitle && (
              <p className="text-gray-500 text-sm">{contact.jobTitle}</p>
            )}
            {contact.company && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-500">{contact.company.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={contact.status} />
              {tags.map((tag: Record<string, string>) => (
                <Badge
                  key={tag.id}
                  style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }}
                  variant="outline"
                  className="text-xs"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-gray-100 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="deals">
              Deals ({contact.deals?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="activities">
              Activities ({contact.activities?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks ({contact.tasks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notes ({contact.notes?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Email</p>
                        <p className="text-sm text-gray-900">{contact.email}</p>
                      </div>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Phone</p>
                        <p className="text-sm text-gray-900">{contact.phone}</p>
                      </div>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Address</p>
                        <p className="text-sm text-gray-900">
                          {contact.address}
                          {contact.city && `, ${contact.city}`}
                          {contact.country && `, ${contact.country}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {contact.linkedin && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">LinkedIn</p>
                        <p className="text-sm text-[#895A18]">Profile</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Source</p>
                      <p className="text-sm text-gray-900 capitalize">{contact.source}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last Contact</p>
                    <p className="text-sm text-gray-900">
                      {contact.lastContactAt
                        ? format(new Date(contact.lastContactAt), 'MMM d, yyyy')
                        : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    {contact.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {contact.deals?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">No deals associated</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {contact.deals.map((deal: Record<string, unknown>) => (
                      <div key={deal.id as string} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div
                            className="h-10 w-1 rounded-full"
                            style={{ backgroundColor: (deal.stage as Record<string, string>)?.color || '#ccc' }}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{deal.title as string}</p>
                            <p className="text-xs text-gray-400">
                              {(deal.stage as Record<string, string>)?.name} · {(deal.probability as number)}% probability
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(deal.value as number)}
                          </p>
                          {deal.closeDate && (
                            <p className="text-xs text-gray-400">
                              Close: {format(new Date(deal.closeDate as string), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={activityDialogOpen} onOpenChange={setActivityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#895A18] hover:bg-[#6B4510] text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Log Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
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
                      <Button
                        onClick={() => {
                          if (!newActivity.subject) {
                            toast.error('Subject is required')
                            return
                          }
                          addActivityMutation.mutate(newActivity)
                        }}
                        disabled={addActivityMutation.isPending}
                        className="w-full bg-[#895A18] hover:bg-[#6B4510] text-white"
                      >
                        Log Activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  {contact.activities?.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-12">No activities yet</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {contact.activities.map((activity: Record<string, unknown>) => (
                        <div key={activity.id as string} className="flex items-start gap-3 px-6 py-4">
                          <ActivityIcon type={activity.type as string} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.subject as string}
                            </p>
                            {activity.description && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {activity.description as string}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {timeAgo(activity.createdAt as string)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                {contact.tasks?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-12">No tasks</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {contact.tasks.map((task: Record<string, unknown>) => (
                      <div key={task.id as string} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {task.title as string}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-0.5">{task.description as string}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={task.priority as string} />
                          <StatusBadge status={task.status as string} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <div className="flex gap-3">
                  <Textarea
                    placeholder="Add a note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button
                    onClick={() => {
                      if (!noteContent.trim()) {
                        toast.error('Note content is required')
                        return
                      }
                      addNoteMutation.mutate(noteContent)
                    }}
                    disabled={addNoteMutation.isPending || !noteContent.trim()}
                    className="bg-[#895A18] hover:bg-[#6B4510] text-white self-end shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {contact.notes?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No notes yet</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {contact.notes.map((note: Record<string, unknown>) => (
                      <div
                        key={note.id as string}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <p className="text-sm text-gray-700">{note.content as string}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-400">
                            {(note.user as Record<string, string>)?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">
                            {timeAgo(note.createdAt as string)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
