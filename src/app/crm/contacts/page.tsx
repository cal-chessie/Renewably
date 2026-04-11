'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Mail,
  Phone,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { StatusBadge } from '@/components/crm/StatusBadge'
import { toast } from 'sonner'
import { format } from 'date-fns'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'customer', label: 'Customer' },
  { value: 'churned', label: 'Churned' },
  { value: 'inactive', label: 'Inactive' },
]

const sourceOptions = [
  { value: '', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'cold', label: 'Cold Outreach' },
  { value: 'event', label: 'Event' },
]

export default function ContactsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  // New contact form state
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    company: '',
    source: 'website',
    status: 'lead',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', search, statusFilter, sourceFilter, page],
    queryFn: () =>
      fetch(
        `/api/crm/contacts?search=${encodeURIComponent(search)}&status=${statusFilter}&source=${sourceFilter}&page=${page}&limit=15`
      ).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: async (contact: Record<string, string>) => {
      const res = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create contact')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      setDialogOpen(false)
      setNewContact({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        jobTitle: '',
        company: '',
        source: 'website',
        status: 'lead',
      })
      toast.success('Contact created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleCreate = () => {
    if (!newContact.firstName || !newContact.lastName) {
      toast.error('First name and last name are required')
      return
    }
    createMutation.mutate({
      ...newContact,
      source: newContact.source,
      status: newContact.status,
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-500 text-sm mt-1">
            {data?.pagination?.total || 0} total contacts
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Contact</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input
                    value={newContact.firstName}
                    onChange={(e) =>
                      setNewContact({ ...newContact, firstName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input
                    value={newContact.lastName}
                    onChange={(e) =>
                      setNewContact({ ...newContact, lastName: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) =>
                    setNewContact({ ...newContact, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input
                  value={newContact.jobTitle}
                  onChange={(e) =>
                    setNewContact({ ...newContact, jobTitle: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={newContact.source}
                    onValueChange={(v) => setNewContact({ ...newContact, source: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="cold">Cold Outreach</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={newContact.status}
                    onValueChange={(v) => setNewContact({ ...newContact, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Contact'}
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
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v === '__all__' ? '' : v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            {sourceOptions.map((opt) => (
              <SelectItem key={opt.value || '__all__'} value={opt.value || '__all__'}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Name
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden md:table-cell">
                    Email
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                    Company
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden lg:table-cell">
                    Source
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3 hidden xl:table-cell">
                    Last Contact
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 w-16 bg-gray-100 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : data?.contacts?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  data?.contacts?.map((contact: Record<string, unknown>, i: number) => (
                    <tr
                      key={contact.id as string}
                      className="border-b border-gray-50 hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/crm/contacts/${contact.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-[#F3D840]/20 flex items-center justify-center shrink-0">
                            <span className="text-[#374151] text-xs font-bold">
                              {(contact.firstName as string)[0]}
                              {(contact.lastName as string)[0]}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.jobTitle && (
                              <p className="text-xs text-gray-400">{contact.jobTitle as string}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-600">{contact.email as string || '—'}</span>
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-600">
                          {(contact.company as Record<string, string>)?.name || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={contact.status as string} />
                      </td>
                      <td className="px-6 py-4 hidden lg:table-cell">
                        <Badge variant="secondary" className="capitalize text-xs">
                          {contact.source as string}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 hidden xl:table-cell">
                        <span className="text-sm text-gray-400">
                          {contact.lastContactAt
                            ? format(new Date(contact.lastContactAt as string), 'MMM d, yyyy')
                            : 'Never'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 15 + 1} to{' '}
                {Math.min(page * 15, data.pagination.total)} of {data.pagination.total}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
