'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  X,
  Mail,
  Phone,
  MapPin,
  Building2,
  Briefcase,
  Linkedin,
  Globe,
  Clock,
  FileEdit,
  DollarSign,
  CheckCircle2,
  MessageSquare,
  StickyNote,
  User,
} from 'lucide-react'

// ============================================================================
// DESIGN TOKENS
// ============================================================================
const DARK = '#0A0A0A'
const DARK2 = '#1A1A1A'
const DARK3 = '#222222'
const BORDER = '#2A2A2A'
const YELLOW = '#F3D840'
const YELLOW_MUTED = '#C79828'
const GREEN = '#22C55E'
const RED = '#EF4444'
const BLUE = '#3B82F6'
const PURPLE = '#A855F7'

// ============================================================================
// HELPERS
// ============================================================================
function timeAgo(date: string | Date): string {
  const now = new Date()
  const d = new Date(date)
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return format(d, 'MMM d, yyyy')
}

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  switch (status?.toLowerCase()) {
    case 'customer': return { bg: 'rgba(34,197,94,0.12)', text: GREEN, label: 'Customer' }
    case 'lead': return { bg: 'rgba(59,130,246,0.12)', text: BLUE, label: 'Lead' }
    case 'prospect': return { bg: 'rgba(168,85,247,0.12)', text: PURPLE, label: 'Prospect' }
    default: return { bg: 'rgba(107,114,128,0.12)', text: '#6B7280', label: status || 'Unknown' }
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================
function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
      <Icon size={14} style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.3)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginTop: 20,
      marginBottom: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      {children}
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  )
}

function DealRow({ deal }: { deal: Record<string, unknown> }) {
  const stage = deal.stage as Record<string, unknown> | null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 12px',
      borderRadius: 8,
      background: DARK3,
      border: `1px solid ${BORDER}`,
      marginBottom: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div style={{
          width: 4,
          height: 32,
          borderRadius: 2,
          background: (stage?.color as string) || YELLOW,
          flexShrink: 0,
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deal.title as string}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
            {stage?.name as string || 'Unknown'} · {(deal.probability as number) || 0}% probability
          </div>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', flexShrink: 0, marginLeft: 8 }}>
        {formatCurrency(deal.value as number)}
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: Record<string, unknown> }) {
  const typeIcons: Record<string, React.ElementType> = {
    call: Phone,
    email: Mail,
    meeting: User,
    note: StickyNote,
  }
  const typeColors: Record<string, string> = {
    call: GREEN,
    email: BLUE,
    meeting: PURPLE,
    note: YELLOW_MUTED,
  }
  const Icon = typeIcons[activity.type as string] || FileEdit
  const colour = typeColors[activity.type as string] || 'rgba(255,255,255,0.3)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '8px 0',
      borderBottom: `1px solid rgba(255,255,255,0.04)`,
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        background: `${colour}18`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: 2,
      }}>
        <Icon size={13} style={{ color: colour }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
          {activity.subject as string}
        </div>
        {activity.description && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.4 }}>
            {activity.description as string}
          </div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 3 }}>
          {timeAgo(activity.createdAt as string)}
        </div>
      </div>
    </div>
  )
}

function NoteCard({ note }: { note: Record<string, unknown> }) {
  const user = note.user as Record<string, unknown> | null
  return (
    <div style={{
      padding: 12,
      borderRadius: 8,
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${BORDER}`,
      marginBottom: 8,
    }}>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
        {note.content as string}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {user?.name as string || 'Unknown'}
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)' }}>·</span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
          {timeAgo(note.createdAt as string)}
        </span>
      </div>
    </div>
  )
}

// ============================================================================
// ACTIVE TAB BAR
// ============================================================================
function TabBar({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'deals', label: 'Deals' },
    { key: 'activity', label: 'Activity' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div style={{
      display: 'flex',
      gap: 2,
      padding: 3,
      borderRadius: 8,
      background: DARK3,
      marginBottom: 16,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            flex: 1,
            padding: '7px 0',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: active === tab.key ? 600 : 500,
            color: active === tab.key ? DARK : 'rgba(255,255,255,0.4)',
            background: active === tab.key ? YELLOW : 'transparent',
            transition: 'all 0.15s',
            fontFamily: 'inherit',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

// ============================================================================
// MODAL PORTAL
// ============================================================================
function ModalOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9998,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    />
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface ContactDetailSheetProps {
  contactId: string | null
  open: boolean
  onClose: () => void
}

export default function ContactDetailSheet({ contactId, open, onClose }: ContactDetailSheetProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [mounted, setMounted] = useState(false)

  // Track client-side mount for portal target
  useState(() => {
    setMounted(true)
  })

  const { data, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => fetch(`/api/crm/contacts/${contactId}`).then((r) => r.json()),
    enabled: !!contactId && open,
  })

  // Reset tab when opening a new contact
  const handleClose = () => {
    setActiveTab('overview')
    onClose()
  }

  const contact = data?.contact
  const statusStyle = getStatusStyle(contact?.status)
  const deals = (contact?.deals || []) as Record<string, unknown>[]
  const activities = (contact?.activities || []) as Record<string, unknown>[]
  const notes = (contact?.notes || []) as Record<string, unknown>[]
  const tags = ((contact?.tags || []) as Record<string, unknown>[]).map((t) => t.tag as Record<string, unknown>)

  if (!open || !mounted) return null

  const modalContent = (
    <>
      <ModalOverlay onClose={handleClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' as const }}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          width: 'calc(100% - 32px)',
          maxWidth: 680,
          maxHeight: '85vh',
          background: DARK2,
          borderRadius: 16,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 10,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${BORDER}`,
            background: DARK3,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            padding: 0,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = DARK3 }}
          aria-label="Close"
        >
          <X size={15} />
        </button>

        {/* Loading */}
        {isLoading && !contact && (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ width: 120, height: 16, borderRadius: 6, background: DARK3 }} />
            <div style={{ width: 200, height: 24, borderRadius: 6, background: DARK3 }} />
            <div style={{ width: 160, height: 16, borderRadius: 6, background: DARK3 }} />
          </div>
        )}

        {/* Contact content */}
        {contact && (
          <div style={{ flex: 1, overflow: 'auto' }}>
            {/* Header */}
            <div style={{ padding: '28px 28px 0' }}>
              {/* Avatar + Name */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${YELLOW}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                  color: YELLOW,
                  flexShrink: 0,
                }}>
                  {contact.firstName[0]}{contact.lastName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: '#FFFFFF', margin: 0, lineHeight: 1.3 }}>
                    {contact.firstName} {contact.lastName}
                  </h2>
                  {contact.jobTitle && (
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{contact.jobTitle}</div>
                  )}
                  {contact.company && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Building2 size={11} style={{ color: 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        {(contact.company as Record<string, unknown>)?.name as string || contact.company}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: statusStyle.text,
                      background: statusStyle.bg,
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}>
                      {statusStyle.label}
                    </span>
                    {tags.map((tag: Record<string, unknown>) => (
                      <span key={tag.id as string} style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: `${tag.color as string}18`,
                        color: tag.color as string,
                      }}>
                        {tag.name as string}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tab bar */}
              <TabBar active={activeTab} onChange={setActiveTab} />
            </div>

            {/* Tab content */}
            <div style={{ padding: '0 28px 28px' }}>
              <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Contact info */}
                    <div style={{ marginBottom: 8 }}>
                      <InfoRow icon={Mail} label="Email" value={contact.email} />
                      <InfoRow icon={Phone} label="Phone" value={contact.phone} />
                      <InfoRow icon={MapPin} label="Address" value={[contact.address, contact.city, contact.country].filter(Boolean).join(', ') || null} />
                      <InfoRow icon={Linkedin} label="LinkedIn" value={contact.linkedin} />
                      <InfoRow icon={Globe} label="Source" value={contact.source} />
                      <InfoRow icon={Clock} label="Last Contact" value={contact.lastContactAt ? format(new Date(contact.lastContactAt), 'MMM d, yyyy') : 'Never'} />
                    </div>

                    {/* Description */}
                    {contact.description && (
                      <>
                        <SectionLabel>Description</SectionLabel>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, margin: 0 }}>
                          {contact.description}
                        </p>
                      </>
                    )}

                    {/* Quick stats */}
                    <SectionLabel>Summary</SectionLabel>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Deals', value: deals.length, icon: DollarSign, colour: YELLOW },
                        { label: 'Activities', value: activities.length, icon: FileEdit, colour: BLUE },
                        { label: 'Notes', value: notes.length, icon: StickyNote, colour: GREEN },
                      ].map((stat) => (
                        <div key={stat.label} style={{
                          padding: '12px 10px',
                          borderRadius: 8,
                          background: DARK3,
                          textAlign: 'center',
                        }}>
                          <stat.icon size={14} style={{ color: stat.colour, marginBottom: 4 }} />
                          <div style={{ fontSize: 18, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}>{stat.value}</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Recent activity preview */}
                    {activities.length > 0 && (
                      <>
                        <SectionLabel>Recent Activity</SectionLabel>
                        {activities.slice(0, 3).map((activity) => (
                          <ActivityRow key={activity.id as string} activity={activity} />
                        ))}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'deals' && (
                  <motion.div
                    key="deals"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {deals.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <DollarSign size={24} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No deals associated</p>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{deals.length} deal{deals.length !== 1 ? 's' : ''}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>
                            Total: {formatCurrency(deals.reduce((sum: number, d: Record<string, unknown>) => sum + (d.value as number), 0))}
                          </span>
                        </div>
                        {deals.map((deal) => (
                          <DealRow key={deal.id as string} deal={deal} />
                        ))}
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div
                    key="activity"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activities.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <FileEdit size={24} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No activities yet</p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <ActivityRow key={activity.id as string} activity={activity} />
                      ))
                    )}
                  </motion.div>
                )}

                {activeTab === 'notes' && (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    {notes.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <StickyNote size={24} style={{ color: 'rgba(255,255,255,0.15)', marginBottom: 8 }} />
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>No notes yet</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <NoteCard key={note.id as string} note={note} />
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* No contact selected */}
        {!isLoading && !contact && (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <User size={32} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>Select a contact to view details</p>
          </div>
        )}
      </motion.div>
    </>
  )

  return createPortal(modalContent, document.body)
}
