'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { IRELAND_COUNTIES, PLAN_PRICING, DOCUMENT_TYPES, SPECIALIZATION_LABELS } from '../types'
import type { InstallerDetail } from '../types'

interface EditInstallerDialogProps {
  installer: InstallerDetail
  onClose: () => void
}

export function EditInstallerDialog({ installer, onClose }: EditInstallerDialogProps) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    companyName: installer.companyName,
    contactName: installer.contactName,
    phone: installer.contactPhone || '',
    email: installer.contactEmail || '',
    planId: installer.plan,
    seaiNumber: installer.seaiNumber || '',
    reciNumber: installer.reciNumber || '',
    seaiRegistered: installer.seaiRegistered,
    reciRegistered: installer.reciRegistered,
    website: installer.website || '',
    address: installer.address || '',
    city: installer.city || '',
    eircode: installer.eircode || '',
    yearsInBusiness: installer.yearsInBusiness?.toString() || '',
    teamSize: installer.teamSize?.toString() || '',
    qualifiedElectricians: installer.electricians?.toString() || '',
    vanFleetSize: installer.vans?.toString() || '',
    avgProjectValue: installer.avgProjectValue?.toString() || '',
    description: installer.description || '',
    serviceCounties: installer.counties || [],
    onboardingStep: installer.onboardingStep.toString(),
    specializations: installer.specializations || [],
    maxLeadsMonth: '',
    minLeadValue: '',
    responseTimeHours: '',
    maxTravelKm: '',
    billingCycle: installer.subscription?.billingCycle || 'monthly',
  })

  const updateField = (key: string, value: string | boolean | string[]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const toggleSpecialization = (key: string) => {
    setForm(prev => ({
      ...prev,
      specializations: prev.specializations.includes(key)
        ? prev.specializations.filter(s => s !== key)
        : [...prev.specializations, key],
    }))
  }

  const toggleCounty = (county: string) => {
    setForm(prev => ({
      ...prev,
      serviceCounties: prev.serviceCounties.includes(county)
        ? prev.serviceCounties.filter(c => c !== county)
        : [...prev.serviceCounties, county],
    }))
  }

  const mutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch(`/api/crm/installers/${installer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed to update installer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installer-detail', installer.id] })
      queryClient.invalidateQueries({ queryKey: ['installers'] })
      queryClient.invalidateQueries({ queryKey: ['installer-stats'] })
      toast.success('Installer updated successfully')
      onClose()
    },
    onError: () => toast.error('Failed to update installer'),
  })

  const handleSave = () => {
    if (!form.companyName.trim()) { toast.error('Company name is required'); return }
    if (!form.contactName.trim()) { toast.error('Contact name is required'); return }

    mutation.mutate({
      companyName: form.companyName,
      contactName: form.contactName,
      phone: form.phone || null,
      planId: form.planId,
      seaiNumber: form.seaiNumber || null,
      reciNumber: form.reciNumber || null,
      seaiRegistered: form.seaiRegistered,
      reciRegistered: form.reciRegistered,
      website: form.website || null,
      address: form.address || null,
      city: form.city || null,
      billingEircode: form.eircode || null,
      yearsInBusiness: form.yearsInBusiness ? parseInt(form.yearsInBusiness) : null,
      teamSize: form.teamSize ? parseInt(form.teamSize) : null,
      qualifiedElectricians: form.qualifiedElectricians ? parseInt(form.qualifiedElectricians) : null,
      vanFleetSize: form.vanFleetSize ? parseInt(form.vanFleetSize) : null,
      avgProjectValue: form.avgProjectValue ? parseFloat(form.avgProjectValue) : null,
      description: form.description || null,
      counties: form.serviceCounties,
      onboardingStep: parseInt(form.onboardingStep) || 0,
      onboardingComplete: parseInt(form.onboardingStep) === 10,
      ruralSpecialist: form.specializations.includes('ruralSpecialist'),
      commercialSpecialist: form.specializations.includes('commercialSpecialist'),
      heritageExperience: form.specializations.includes('heritageExperience'),
      offersEvCharger: form.specializations.includes('offersEvCharger'),
      offersHeatPump: form.specializations.includes('offersHeatPump'),
      maxLeadsMonth: form.maxLeadsMonth ? parseInt(form.maxLeadsMonth) : null,
      minLeadValue: form.minLeadValue ? parseFloat(form.minLeadValue) : null,
      responseTimeHours: form.responseTimeHours ? parseInt(form.responseTimeHours) : null,
      maxTravelKm: form.maxTravelKm ? parseInt(form.maxTravelKm) : null,
      billingCycle: form.billingCycle,
    })
  }

  const sectionTitle = { fontSize: 13, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 16 }
  const fieldGroup = { marginBottom: 16 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Company Info */}
      <div>
        <h3 style={sectionTitle}>Company Information</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Company Name *</Label>
            <Input value={form.companyName} onChange={e => updateField('companyName', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={fieldGroup}>
              <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Website</Label>
              <Input value={form.website} onChange={e => updateField('website', e.target.value)} placeholder="https://..." />
            </div>
            <div style={fieldGroup}>
              <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Address</Label>
              <Input value={form.address} onChange={e => updateField('address', e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={fieldGroup}>
              <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>City</Label>
              <Input value={form.city} onChange={e => updateField('city', e.target.value)} />
            </div>
            <div style={fieldGroup}>
              <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Eircode</Label>
              <Input value={form.eircode} onChange={e => updateField('eircode', e.target.value)} />
            </div>
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Description</Label>
            <textarea
              value={form.description}
              onChange={e => updateField('description', e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #2A2A2A',
                backgroundColor: '#1A1A1A',
                color: '#FFFFFF',
                fontSize: 13,
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div>
        <h3 style={sectionTitle}>Contact Details</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Full Name *</Label>
            <Input value={form.contactName} onChange={e => updateField('contactName', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Email</Label>
            <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Phone</Label>
            <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Plan & Subscription */}
      <div>
        <h3 style={sectionTitle}>Subscription</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Plan</Label>
            <Select value={form.planId} onValueChange={v => updateField('planId', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">Starter — €{PLAN_PRICING.starter}/mo</SelectItem>
                <SelectItem value="pro">Pro — €{PLAN_PRICING.pro}/mo</SelectItem>
                <SelectItem value="enterprise">Enterprise — €{PLAN_PRICING.enterprise}/mo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Billing Cycle</Label>
            <Select value={form.billingCycle} onValueChange={v => updateField('billingCycle', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div>
        <h3 style={sectionTitle}>Certifications</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...fieldGroup }}>
            <Checkbox checked={form.seaiRegistered} onCheckedChange={v => updateField('seaiRegistered', !!v)} />
            <Label style={{ fontSize: 12 }}>SEAI Registered</Label>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, ...fieldGroup }}>
            <Checkbox checked={form.reciRegistered} onCheckedChange={v => updateField('reciRegistered', !!v)} />
            <Label style={{ fontSize: 12 }}>RECI Registered</Label>
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>SEAI Number</Label>
            <Input value={form.seaiNumber} onChange={e => updateField('seaiNumber', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>RECI Number</Label>
            <Input value={form.reciNumber} onChange={e => updateField('reciNumber', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Service Territory */}
      <div>
        <h3 style={sectionTitle}>Service Territory ({form.serviceCounties.length} selected)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 16, borderRadius: 12, border: '1px solid #2A2A2A', backgroundColor: '#111111' }}>
          {IRELAND_COUNTIES.map(county => (
            <label key={county} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
              borderRadius: 6, fontSize: 12, cursor: 'pointer',
              backgroundColor: form.serviceCounties.includes(county) ? 'rgba(243,216,64,0.1)' : 'transparent',
              color: form.serviceCounties.includes(county) ? '#F3D840' : '#9CA3AF',
            }}>
              <Checkbox checked={form.serviceCounties.includes(county)} onCheckedChange={() => toggleCounty(county)} className="h-3 w-3" />
              {county}
            </label>
          ))}
        </div>
      </div>

      {/* Business Capacity */}
      <div>
        <h3 style={sectionTitle}>Business Capacity</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Years in Business</Label>
            <Input type="number" value={form.yearsInBusiness} onChange={e => updateField('yearsInBusiness', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Team Size</Label>
            <Input type="number" value={form.teamSize} onChange={e => updateField('teamSize', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Qualified Electricians</Label>
            <Input type="number" value={form.qualifiedElectricians} onChange={e => updateField('qualifiedElectricians', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Van Fleet Size</Label>
            <Input type="number" value={form.vanFleetSize} onChange={e => updateField('vanFleetSize', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Avg Project Value (€)</Label>
            <Input type="number" value={form.avgProjectValue} onChange={e => updateField('avgProjectValue', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Onboarding Step (0-10)</Label>
            <Input type="number" min={0} max={10} value={form.onboardingStep} onChange={e => updateField('onboardingStep', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Specialisations */}
      <div>
        <h3 style={sectionTitle}>Specialisations</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {Object.entries(SPECIALIZATION_LABELS).map(([key, label]) => (
            <label key={key} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              borderRadius: 8, border: `1px solid ${form.specializations.includes(key) ? 'rgba(168,85,247,0.4)' : '#2A2A2A'}`,
              backgroundColor: form.specializations.includes(key) ? 'rgba(168,85,247,0.1)' : '#1A1A1A',
              cursor: 'pointer', fontSize: 12,
              color: form.specializations.includes(key) ? '#C084FC' : '#9CA3AF',
            }}>
              <Checkbox checked={form.specializations.includes(key)} onCheckedChange={() => toggleSpecialization(key)} className="h-3.5 w-3.5" />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* Lead Preferences */}
      <div>
        <h3 style={sectionTitle}>Lead Preferences</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Max Leads/Month</Label>
            <Input type="number" value={form.maxLeadsMonth} onChange={e => updateField('maxLeadsMonth', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Min Lead Value (€)</Label>
            <Input type="number" value={form.minLeadValue} onChange={e => updateField('minLeadValue', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Response Time (hours)</Label>
            <Input type="number" value={form.responseTimeHours} onChange={e => updateField('responseTimeHours', e.target.value)} />
          </div>
          <div style={fieldGroup}>
            <Label style={{ fontSize: 12, marginBottom: 6, display: 'block' }}>Max Travel (km)</Label>
            <Input type="number" value={form.maxTravelKm} onChange={e => updateField('maxTravelKm', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid #2A2A2A' }}>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          style={{ backgroundColor: '#F3D840', color: '#0A0A0A', fontWeight: 600, border: 'none' }}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2" style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {mutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
