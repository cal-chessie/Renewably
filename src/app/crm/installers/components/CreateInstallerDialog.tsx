'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { IRELAND_COUNTIES, PLAN_PRICING } from '../types'

interface CreateInstallerDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function CreateInstallerDialog({ open, onOpenChange }: CreateInstallerDialogProps) {
  const queryClient = useQueryClient()
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('starter')
  const [seaiNumber, setSeaiNumber] = useState('')
  const [reciNumber, setReciNumber] = useState('')
  const [selectedCounties, setSelectedCounties] = useState<string[]>([])

  const toggleCounty = (county: string) => {
    setSelectedCounties(prev =>
      prev.includes(county) ? prev.filter(c => c !== county) : [...prev, county]
    )
  }

  const resetForm = useCallback(() => {
    setCompanyName('')
    setContactName('')
    setPhone('')
    setEmail('')
    setPlan('starter')
    setSeaiNumber('')
    setReciNumber('')
    setSelectedCounties([])
  }, [])

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch('/api/crm/installers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to create installer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      resetForm()
      onOpenChange(false)
      toast.success('Installer created successfully')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleSubmit = () => {
    if (!companyName.trim()) { toast.error('Company name is required'); return }
    if (!contactName.trim()) { toast.error('Contact name is required'); return }
    mutation.mutate({
      companyName,
      contactName,
      phone: phone || null,
      email: email || null,
      plan,
      seaiNumber: seaiNumber || null,
      reciNumber: reciNumber || null,
      counties: selectedCounties,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) resetForm(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-white">New Installer</DialogTitle>
          <p className="text-sm text-[#A0A0A0]">Create a new solar installer profile</p>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Company Information</h3>
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. SolarTech Ireland Ltd" />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="John Smith" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.ie" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+353 1 234 5678" />
              </div>
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select value={plan} onValueChange={setPlan}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter — €{PLAN_PRICING.starter}/mo</SelectItem>
                    <SelectItem value="pro">Pro — €{PLAN_PRICING.pro}/mo</SelectItem>
                    <SelectItem value="enterprise">Enterprise — €{PLAN_PRICING.enterprise}/mo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-4">
            <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Certifications</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SEAI Number</Label>
                <Input value={seaiNumber} onChange={e => setSeaiNumber(e.target.value)} placeholder="SEAI registration number" />
              </div>
              <div className="space-y-2">
                <Label>RECI Number</Label>
                <Input value={reciNumber} onChange={e => setReciNumber(e.target.value)} placeholder="RECI registration number" />
              </div>
            </div>
          </div>

          {/* County Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider">Service Territory</h3>
              <Badge variant="secondary" className="text-[11px]">{selectedCounties.length} selected</Badge>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto rounded-lg border p-3">
              {IRELAND_COUNTIES.map(county => (
                <label
                  key={county}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs cursor-pointer transition-colors ${
                    selectedCounties.includes(county)
                      ? 'bg-[#F3D840]/15 text-[#8a7500] font-medium'
                      : 'hover:bg-[#141414]/5 text-[#A0A0A0]'
                  }`}
                >
                  <Checkbox
                    checked={selectedCounties.includes(county)}
                    onCheckedChange={() => toggleCounty(county)}
                    className="h-3.5 w-3.5"
                  />
                  {county}
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="bg-[#F3D840] text-[#0A0A0A] hover:bg-[#E5C832] font-semibold"
          >
            {mutation.isPending ? 'Creating...' : 'Create Installer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
