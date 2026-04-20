'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Mail, FileText, MessageSquare, Settings, Send, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { ActivityItem } from '../types'
import { timeAgo } from '@/lib/format'

interface ActivityTimelineProps {
  installerId: string
}

const TYPE_CONFIG: Record<string, { icon: typeof Phone; colour: string; label: string }> = {
  call: { icon: Phone, colour: '#10B981', label: 'Call' },
  email: { icon: Mail, colour: '#60A5FA', label: 'Email' },
  note: { icon: MessageSquare, colour: '#F3D840', label: 'Note' },
  system: { icon: Settings, colour: '#9CA3AF', label: 'System' },
  meeting: { icon: FileText, colour: '#A855F7', label: 'Meeting' },
  task: { icon: FileText, colour: '#F59E0B', label: 'Task' },
}

export function ActivityTimeline({ installerId }: ActivityTimelineProps) {
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('')
  const [noteText, setNoteText] = useState('')
  const [showNoteInput, setShowNoteInput] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['installer-activities', installerId, typeFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      return fetch(`/api/crm/installers/${installerId}/activities?${params}`).then(r => r.json())
    },
    enabled: !!installerId,
  })

  const activities: ActivityItem[] = data?.activities || []

  const addNoteMutation = useMutation({
    mutationFn: async (subject: string) => {
      const res = await fetch(`/api/crm/installers/${installerId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'note', subject, description: null }),
      })
      if (!res.ok) throw new Error('Failed to add note')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installer-activities'] })
      setNoteText('')
      setShowNoteInput(false)
      toast.success('Note added')
    },
    onError: () => toast.error('Failed to add note'),
  })

  const handleAddNote = () => {
    if (!noteText.trim()) return
    addNoteMutation.mutate(noteText.trim())
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 20 }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse" style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#222222', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 14, width: '60%', backgroundColor: '#222222', borderRadius: 4 }} />
              <div style={{ height: 12, width: '40%', backgroundColor: '#1A1A1A', borderRadius: 4, marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Quick add note */}
      {showNoteInput ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            autoFocus
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddNote()}
            placeholder="Add a note..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(243,216,64,0.3)',
              backgroundColor: '#1A1A1A',
              color: '#FFFFFF',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={handleAddNote}
            disabled={addNoteMutation.isPending || !noteText.trim()}
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              backgroundColor: '#F3D840',
              color: '#0A0A0A',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: addNoteMutation.isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {addNoteMutation.isPending ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Send style={{ width: 14, height: 14 }} />}
            Save
          </button>
          <button
            onClick={() => { setShowNoteInput(false); setNoteText('') }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #2A2A2A',
              backgroundColor: '#222222',
              color: '#A0A0A0',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNoteInput(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            border: '1px dashed rgba(243,216,64,0.3)',
            backgroundColor: 'rgba(243,216,64,0.05)',
            color: '#F3D840',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <MessageSquare style={{ width: 16, height: 16 }} />
          Add Note
        </button>
      )}

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button
          onClick={() => setTypeFilter('')}
          style={{
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 500,
            border: `1px solid ${!typeFilter ? 'rgba(243,216,64,0.4)' : '#2A2A2A'}`,
            backgroundColor: !typeFilter ? 'rgba(243,216,64,0.15)' : 'transparent',
            color: !typeFilter ? '#F3D840' : '#9CA3AF',
            cursor: 'pointer',
          }}
        >
          All
        </button>
        {Object.entries(TYPE_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setTypeFilter(typeFilter === key ? '' : key)}
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 500,
              border: `1px solid ${typeFilter === key ? config.colour + '44' : '#2A2A2A'}`,
              backgroundColor: typeFilter === key ? config.colour + '18' : 'transparent',
              color: typeFilter === key ? config.colour : '#9CA3AF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <AnimatePresence>
          {activities.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#6B7280' }}>No activities recorded yet</p>
            </div>
          ) : (
            activities.map((activity, i) => {
              const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.system
              const Icon = config.icon
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '14px 0',
                    borderBottom: i < activities.length - 1 ? '1px solid #1E1E1E' : 'none',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: config.colour + '18',
                    border: `1px solid ${config.colour}33`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    <Icon style={{ width: 14, height: 14, color: config.colour }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>{activity.subject}</span>
                      <span style={{
                        fontSize: 10,
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 10,
                        backgroundColor: config.colour + '18',
                        color: config.colour,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        {config.label}
                      </span>
                    </div>
                    {activity.description && (
                      <p style={{ fontSize: 12, color: '#9CA3AF', margin: '4px 0 0', lineHeight: 1.5 }}>
                        {activity.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        {timeAgo(activity.createdAt)}
                      </span>
                      {activity.userName && (
                        <>
                          <span style={{ fontSize: 11, color: '#2A2A2A' }}>·</span>
                          <span style={{ fontSize: 11, color: '#6B7280' }}>{activity.userName}</span>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
