'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Building2,
  Globe,
  MapPin,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function CompaniesPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [newCompany, setNewCompany] = useState({
    name: '',
    website: '',
    industry: '',
    city: '',
    country: '',
    phone: '',
    description: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search, industryFilter, page],
    queryFn: () =>
      fetch(
        `/api/crm/companies?search=${encodeURIComponent(search)}&industry=${industryFilter}&page=${page}&limit=15`
      ).then((r) => r.json()),
  })

  const createMutation = useMutation({
    mutationFn: async (company: Record<string, string>) => {
      const res = await fetch('/api/crm/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(company),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create company')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] })
      setDialogOpen(false)
      setNewCompany({ name: '', website: '', industry: '', city: '', country: '', phone: '', description: '' })
      toast.success('Company created successfully')
    },
    onError: (error: Error) => toast.error(error.message),
  })

  const industries = data?.companies
    ? [...new Set(data.companies.map((c: Record<string, unknown>) => c.industry).filter(Boolean))]
    : []

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh' }} className="px-4 pt-2 pb-6 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 style={{ color: '#FFFFFF' }} className="text-2xl font-bold">Companies</h1>
          <p style={{ color: '#A0A0A0' }} className="text-sm mt-1">
            {data?.pagination?.total || 0} total companies
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#374151] hover:bg-[#1F2937] text-white font-medium">
              <Plus className="h-4 w-4 mr-2" />
              New Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Company</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input
                  value={newCompany.website}
                  onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  value={newCompany.industry}
                  onChange={(e) => setNewCompany({ ...newCompany, industry: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={newCompany.city}
                    onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={newCompany.country}
                    onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                />
              </div>
              <Button
                onClick={() => {
                  if (!newCompany.name) {
                    toast.error('Company name is required')
                    return
                  }
                  createMutation.mutate(newCompany)
                }}
                disabled={createMutation.isPending}
                className="w-full bg-[#374151] hover:bg-[#1F2937] text-white"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Company'}
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
            placeholder="Search companies..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>
        {industries.length > 0 && (
          <Select value={industryFilter} onValueChange={(v) => { setIndustryFilter(v === '__all__' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Industries</SelectItem>
              {industries.map((ind: string) => (
                <SelectItem key={ind} value={ind}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }} className="shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
                  <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-3 sm:px-6 py-3">
                    Company
                  </th>
                  <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-3 sm:px-6 py-3 hidden md:table-cell">
                    Industry
                  </th>
                  <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-3 sm:px-6 py-3 hidden lg:table-cell">
                    Employees
                  </th>
                  <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-3 sm:px-6 py-3 hidden lg:table-cell">
                    Location
                  </th>
                  <th style={{ color: '#A0A0A0', backgroundColor: '#141414' }} className="text-left text-xs font-semibold uppercase tracking-wider px-3 sm:px-6 py-3">
                    Contacts
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #222222' }}>
                      <td className="px-3 sm:px-6 py-4">
                        <div className="h-4 w-40 rounded animate-pulse" style={{ backgroundColor: '#222222' }} />
                      </td>
                      <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                        <div className="h-4 w-24 rounded animate-pulse" style={{ backgroundColor: '#222222' }} />
                      </td>
                    </tr>
                  ))
                ) : data?.companies?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center" style={{ color: '#666666' }}>
                      No companies found
                    </td>
                  </tr>
                ) : (
                  data?.companies?.map((company: Record<string, unknown>) => (
                    <tr
                      key={company.id as string}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-3 sm:px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-[#374151]/10 flex items-center justify-center shrink-0">
                            <Building2 className="h-5 w-5 text-[#374151]" />
                          </div>
                          <div>
                            <p style={{ color: '#FFFFFF' }} className="text-sm font-medium">
                              {company.name as string}
                            </p>
                            {company.website && (
                              <p style={{ color: '#666666' }} className="text-xs">{company.website as string}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 hidden md:table-cell">
                        <span style={{ color: '#A0A0A0' }} className="text-sm">
                          {company.industry as string || '—'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                        <span style={{ color: '#A0A0A0' }} className="text-sm">
                          {company.employees ? `${company.employees}` : '—'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                        <span style={{ color: '#A0A0A0' }} className="text-sm">
                          {[company.city, company.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4">
                        <span className="inline-flex items-center justify-center h-6 min-w-6 px-2 rounded-full bg-[#F3D840]/20 text-[#374151] text-xs font-bold">
                          {(company._count as Record<string, number>)?.contacts || 0}
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
            <div className="flex items-center justify-between px-6 py-3" style={{ borderTop: '1px solid #2A2A2A' }}>
              <p style={{ color: '#A0A0A0' }} className="text-sm">
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
                <span style={{ color: '#A0A0A0' }} className="text-sm">
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
