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
      <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }} className="p-6 lg:p-8">
        <div className="space-y-4">
          <div className="h-8 w-48 rounded animate-pulse" style={{ backgroundColor: '#222222' }} />
          <div className="h-64 rounded-xl animate-pulse" style={{ backgroundColor: '#222222' }} />
        </div>
      </div>
    )
  }

  const contact = data.contact
  const tags = (contact.tags || []).map((t: Record<string, unknown>) => t.tag)

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }} className="p-6 lg:p-8 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/crm/contacts')}
        className="hover:text-white"
        style={{ color: '#A0A0A0' }}
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
            <span className="text-[#374151] text-xl font-bold">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </span>
          </div>
          <div>
            <h1 style={{ color: '#FFFFFF' }} className="text-2xl font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            {contact.jobTitle && (
              <p style={{ color: '#A0A0A0' }} className="text-sm">{contact.jobTitle}</p>
            )}
            {contact.company && (
              <div className="flex items-center gap-1 mt-1">
                <Building2 className="h-3.5 w-3.5" style={{ color: '#666666' }} />
                <span style={{ color: '#A0A0A0' }} className="text-sm">{contact.company.name}</span>
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
          <TabsList className="bg-[#1A1A1A] p-1" style={{ border: '1px solid #2A2A2A' }}>
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
              <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm lg:col-span-1">
                <CardHeader>
                  <CardTitle style={{ color: '#FFFFFF' }} className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4" style={{ color: '#666666' }} />
                      <div>
                        <p style={{ color: '#666666' }} className="text-xs">Email</p>
                        <p style={{ color: '#FFFFFF' }} className="text-sm">{contact.email}</p>
                      </div>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4" style={{ color: '#666666' }} />
                      <div>
                        <p style={{ color: '#666666' }} className="text-xs">Phone</p>
                        <p style={{ color: '#FFFFFF' }} className="text-sm">{contact.phone}</p>
                      </div>
                    </div>
                  )}
                  {contact.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" style={{ color: '#666666' }} />
                      <div>
                        <p style={{ color: '#666666' }} className="text-xs">Address</p>
                        <p style={{ color: '#FFFFFF' }} className="text-sm">
                          {contact.address}
                          {contact.city && `, ${contact.city}`}
                          {contact.country && `, ${contact.country}`}
                        </p>
                      </div>
                    </div>
                  )}
                  {contact.linkedin && (
                    <div className="flex items-center gap-3">
                      <Linkedin className="h-4 w-4" style={{ color: '#666666' }} />
                      <div>
                        <p style={{ color: '#666666' }} className="text-xs">LinkedIn</p>
                        <p style={{ color: '#FFFFFF' }} className="text-sm">Profile</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4" style={{ color: '#666666' }} />
                    <div>
                      <p style={{ color: '#666666' }} className="text-xs">Source</p>
                      <p style={{ color: '#FFFFFF' }} className="text-sm capitalize">{contact.source}</p>
                    </div>
                  </div>
                  <div>
                    <p style={{ color: '#666666' }} className="text-xs">Last Contact</p>
                    <p style={{ color: '#FFFFFF' }} className="text-sm">
                      {contact.lastContactAt
                        ? format(new Date(contact.lastContactAt), 'MMM d, yyyy')
                        : 'Never'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle style={{ color: '#FFFFFF' }} className="text-base">Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p style={{ color: '#A0A0A0' }} className="text-sm">
                    {contact.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deals Tab */}
          <TabsContent value="deals">
            <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm">
              <CardContent className="p-0">
                {contact.deals?.length === 0 ? (
                  <p style={{ color: '#666666' }} className="text-sm text-center py-12">No deals associated</p>
                ) : (
                  <div>
                    {contact.deals.map((deal: Record<string, unknown>, i: number) => (
                      <div key={deal.id as string} className="flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors" style={i < contact.deals.length - 1 ? { borderBottom: '1px solid #2A2A2A' } : {}}>
                        <div className="flex items-center gap-4">
                          <div
                            className="h-10 w-1 rounded-full"
                            style={{ backgroundColor: (deal.stage as Record<string, string>)?.color || '#ccc' }}
                          />
                          <div>
                            <p style={{ color: '#FFFFFF' }} className="text-sm font-medium">{deal.title as string}</p>
                            <p style={{ color: '#666666' }} className="text-xs">
                              {(deal.stage as Record<string, string>)?.name} · {(deal.probability as number)}% probability
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p style={{ color: '#FFFFFF' }} className="text-sm font-semibold">
                            {formatCurrency(deal.value as number)}
                          </p>
                          {Boolean(deal.closeDate) && (
                            <p style={{ color: '#666666' }} className="text-xs">
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
                    <Button className="bg-[#374151] hover:bg-[#1F2937] text-white">
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
                        className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
                      >
                        Log Activity
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm">
                <CardContent className="p-0">
                  {contact.activities?.length === 0 ? (
                    <p style={{ color: '#666666' }} className="text-sm text-center py-12">No activities yet</p>
                  ) : (
                    <div>
                      {contact.activities.map((activity: Record<string, unknown>, i: number) => (
                        <div key={activity.id as string} className="flex items-start gap-3 px-6 py-4" style={i < contact.activities.length - 1 ? { borderBottom: '1px solid #2A2A2A' } : {}}>
                          <ActivityIcon type={activity.type as string} />
                          <div className="flex-1 min-w-0">
                            <p style={{ color: '#FFFFFF' }} className="text-sm font-medium">
                              {activity.subject as string}
                            </p>
                            {activity.description ? (
                              <p style={{ color: '#A0A0A0' }} className="text-sm mt-0.5">
                                {String(activity.description)}
                              </p>
                            ) : null}
                            <p style={{ color: '#666666' }} className="text-xs mt-1">
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
            <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm">
              <CardContent className="p-0">
                {contact.tasks?.length === 0 ? (
                  <p style={{ color: '#666666' }} className="text-sm text-center py-12">No tasks</p>
                ) : (
                  <div>
                    {contact.tasks.map((task: Record<string, unknown>, i: number) => (
                      <div key={task.id as string} className="flex items-center justify-between px-6 py-4" style={i < contact.tasks.length - 1 ? { borderBottom: '1px solid #2A2A2A' } : {}}>
                        <div>
                          <p className={`text-sm font-medium ${task.status === 'completed' ? 'line-through' : ''}`} style={{ color: task.status === 'completed' ? '#666666' : '#FFFFFF' }}>
                            {task.title as string}
                          </p>
                          {task.description != null && (
                            <p style={{ color: '#666666' }} className="text-xs mt-0.5">{String(task.description)}</p>
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
            <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm">
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
                    className="bg-[#374151] hover:bg-[#1F2937] text-white self-end shrink-0"
                  >
                    Add
                  </Button>
                </div>

                {contact.notes?.length === 0 ? (
                  <p style={{ color: '#666666' }} className="text-sm text-center py-8">No notes yet</p>
                ) : (
                  <div className="space-y-3 mt-4">
                    {contact.notes.map((note: Record<string, unknown>) => (
                      <div
                        key={note.id as string}
                        className="rounded-lg p-4"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                      >
                        <p style={{ color: '#A0A0A0' }} className="text-sm">{note.content as string}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span style={{ color: '#666666' }} className="text-xs">
                            {(note.user as Record<string, string>)?.name || 'Unknown'}
                          </span>
                          <span style={{ color: '#444444' }} className="text-xs">·</span>
                          <span style={{ color: '#666666' }} className="text-xs">
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
