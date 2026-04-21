'use client'

import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Clock, User, Flag, AlertTriangle, CheckCircle2,
  Pencil, Trash2, Activity, MessageSquare, FilePlus,
  ArrowRightCircle,
} from 'lucide-react'
import { format } from 'date-fns'

// ═══════════════════════════════════════════════════════════════════════════════
// COLOUR PALETTE
// ═══════════════════════════════════════════════════════════════════════════════

const DARK  = '#0A0A0A'
const DARK2 = '#1A1A1A'
const DARK3 = '#222222'
const BORDER = '#2A2A2A'
const YELLOW = '#F3D840'
const YELLOW_MUTED = '#C79828'
const GREEN = '#22C55E'
const RED = '#EF4444'
const BLUE = '#3B82F6'
const PURPLE = '#A855F7'
const ORANGE = '#F97316'
const MUTED = '#A0A0A0'

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskData {
  id: string
  title: string
  description: string
  priority: 'High' | 'Urgent' | 'Medium' | 'Low'
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled'
  dueDate: string
  assignee: string
  overdue: boolean
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLOUR MAPPINGS
// ═══════════════════════════════════════════════════════════════════════════════

const PRIORITY_STYLES: Record<string, { bg: string; text: string }> = {
  Urgent: { bg: 'rgba(239,68,68,0.12)', text: RED },
  High:   { bg: 'rgba(249,115,22,0.12)', text: ORANGE },
  Medium: { bg: 'rgba(243,216,64,0.12)', text: YELLOW },
  Low:    { bg: 'rgba(107,114,128,0.12)', text: '#6B7280' },
}

const STATUS_STYLES: Record<string, { colour: string; label: string }> = {
  todo:        { colour: '#6B7280', label: 'To Do' },
  in_progress: { colour: YELLOW,    label: 'In Progress' },
  completed:   { colour: GREEN,     label: 'Completed' },
  cancelled:   { colour: RED,       label: 'Cancelled' },
}

const STATUS_BG: Record<string, string> = {
  todo:        'rgba(107,114,128,0.12)',
  in_progress: 'rgba(243,216,64,0.12)',
  completed:   'rgba(34,197,94,0.12)',
  cancelled:   'rgba(239,68,68,0.12)',
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK ACTIVITY DATA
// ═══════════════════════════════════════════════════════════════════════════════

interface ActivityItem {
  id: string
  type: 'created' | 'status_changed' | 'comment_added'
  message: string
  time: string
}

function getMockActivities(task: TaskData): ActivityItem[] {
  const statusLabel = STATUS_STYLES[task.status]?.label ?? task.status
  return [
    {
      id: 'a1',
      type: 'created',
      message: `Task "${task.title}" was created`,
      time: '2 days ago',
    },
    {
      id: 'a2',
      type: 'status_changed',
      message: `Status changed to ${statusLabel}`,
      time: '1 day ago',
    },
    {
      id: 'a3',
      type: 'comment_added',
      message: 'Progress update added by team member',
      time: '6 hours ago',
    },
  ]
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITY ICON HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  const config: Record<string, { icon: React.ElementType; colour: string; bg: string }> = {
    created:        { icon: FilePlus,         colour: BLUE,   bg: 'rgba(59,130,246,0.12)' },
    status_changed: { icon: ArrowRightCircle, colour: PURPLE, bg: 'rgba(168,85,247,0.12)' },
    comment_added:  { icon: MessageSquare,    colour: GREEN,  bg: 'rgba(34,197,94,0.12)' },
  }
  const { icon: Icon, colour, bg } = config[type] ?? config.created

  return (
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={15} style={{ color: colour }} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOADING SKELETON
// ═══════════════════════════════════════════════════════════════════════════════

function LoadingSkeleton() {
  const bar = (width: string | number, height = 12) => (
    <div style={{
      width: String(width), height, borderRadius: 6,
      background: `linear-gradient(90deg, ${DARK3} 25%, ${BORDER} 50%, ${DARK3} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.5s ease-in-out infinite',
    }} />
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bar('70%', 22)}
        {bar('40%', 14)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {bar(70, 24)}
        {bar(80, 24)}
      </div>
      <div style={{ height: 1, background: BORDER }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bar('60%', 10)}
            {bar('80%', 16)}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: DARK3,
              flexShrink: 0,
            }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {bar(`${60 + i * 10}%`, 12)}
              {bar('30%', 10)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TaskDetailModalProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  task?: TaskData | null
  onComplete?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function TaskDetailModal({
  taskId,
  open,
  onClose,
  task,
  onComplete,
  onEdit,
  onDelete,
}: TaskDetailModalProps) {
  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  const priorityStyle = PRIORITY_STYLES[task?.priority ?? 'Medium']
  const statusStyle = STATUS_STYLES[task?.status ?? 'todo']
  const statusBg = STATUS_BG[task?.status ?? 'todo']
  const activities = task ? getMockActivities(task) : []

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const formattedDueDate = task?.dueDate
    ? format(new Date(task.dueDate), 'd MMMM yyyy')
    : 'Not set'

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="task-detail-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
        >
          <motion.div
            key="task-detail-modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            style={{
              position: 'relative',
              maxWidth: 560,
              width: '100%',
              maxHeight: '80vh',
              background: DARK2,
              borderRadius: 16,
              border: `1px solid ${BORDER}`,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              padding: '20px 24px 16px',
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
            }}>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <h2
                  id="task-detail-title"
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    lineHeight: 1.3,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {task?.title ?? 'Loading\u2026'}
                </h2>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: `1px solid ${BORDER}`,
                  background: DARK3,
                  color: MUTED,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = BORDER
                  e.currentTarget.style.color = '#FFFFFF'
                  e.currentTarget.style.borderColor = MUTED
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = DARK3
                  e.currentTarget.style.color = MUTED
                  e.currentTarget.style.borderColor = BORDER
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px 24px',
              scrollbarWidth: 'thin',
              scrollbarColor: `${BORDER} transparent`,
            }}>
              {!task ? (
                <LoadingSkeleton />
              ) : (
                <>
                  {/* Status + Priority badges + Overdue */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: statusStyle.colour,
                      backgroundColor: statusBg,
                      border: `1px solid ${statusStyle.colour}25`,
                      textTransform: 'capitalize' as const,
                      whiteSpace: 'nowrap',
                    }}>
                      <span style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: statusStyle.colour,
                        flexShrink: 0,
                      }} />
                      {statusStyle.label}
                    </span>

                    {/* Priority badge */}
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: priorityStyle.text,
                      backgroundColor: priorityStyle.bg,
                      border: `1px solid ${priorityStyle.text}25`,
                      textTransform: 'capitalize' as const,
                      whiteSpace: 'nowrap',
                    }}>
                      <Flag size={11} />
                      {task.priority}
                    </span>

                    {/* Overdue indicator */}
                    {task.overdue && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 700,
                        color: RED,
                        backgroundColor: 'rgba(239,68,68,0.12)',
                        border: `1px solid rgba(239,68,68,0.25)`,
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.3px',
                      }}>
                        <AlertTriangle size={12} />
                        OVERDUE
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div style={{ marginBottom: 24 }}>
                      <p style={{
                        fontSize: 14,
                        lineHeight: 1.65,
                        color: MUTED,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}>
                        {task.description}
                      </p>
                    </div>
                  )}

                  {/* ── Details grid ── */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 1,
                    borderRadius: 10,
                    overflow: 'hidden',
                    border: `1px solid ${BORDER}`,
                    marginBottom: 24,
                  }}>
                    <DetailCell
                      icon={<CalendarIcon />}
                      label="Due Date"
                      value={formattedDueDate}
                      highlight={task.overdue}
                      highlightColour={RED}
                    />
                    <DetailCell
                      icon={<UserIcon />}
                      label="Assignee"
                      value={task.assignee || 'Unassigned'}
                    />
                    <DetailCell
                      icon={<StatusIcon colour={statusStyle.colour} />}
                      label="Status"
                      value={statusStyle.label}
                      valueColour={statusStyle.colour}
                    />
                    <DetailCell
                      icon={<PriorityIcon colour={priorityStyle.text} />}
                      label="Priority"
                      value={task.priority}
                      valueColour={priorityStyle.text}
                    />
                  </div>

                  {/* ── Activity section ── */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      <Activity size={15} style={{ color: MUTED }} />
                      <span style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#FFFFFF',
                        letterSpacing: '0.2px',
                      }}>
                        Activity
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0,
                    }}>
                      {activities.map((item, index) => (
                        <div key={item.id}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 0',
                          }}>
                            <ActivityIcon type={item.type} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{
                                fontSize: 13,
                                color: '#FFFFFF',
                                margin: 0,
                                lineHeight: 1.4,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {item.message}
                              </p>
                              <span style={{
                                fontSize: 11,
                                color: MUTED,
                                marginTop: 2,
                                display: 'block',
                              }}>
                                {item.time}
                              </span>
                            </div>
                          </div>
                          {index < activities.length - 1 && (
                            <div style={{
                              marginLeft: 16,
                              borderLeft: `1px solid ${BORDER}`,
                              height: 0,
                              position: 'relative',
                            }}>
                              <div style={{
                                position: 'absolute',
                                top: 0,
                                left: -1,
                                width: 1,
                                height: 0,
                                background: BORDER,
                              }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Action buttons ── */}
            {task && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 8,
                padding: '16px 24px 20px',
                borderTop: `1px solid ${BORDER}`,
                flexShrink: 0,
                flexWrap: 'wrap',
              }}>
                {task.status !== 'completed' && task.status !== 'cancelled' && (
                  <ActionButton
                    label="Mark Complete"
                    icon={<CheckCircle2 size={14} />}
                    colour={GREEN}
                    bg="rgba(34,197,94,0.12)"
                    hoverBg="rgba(34,197,94,0.2)"
                    borderColour="rgba(34,197,94,0.25)"
                    onClick={() => onComplete?.(task.id)}
                  />
                )}
                <ActionButton
                  label="Edit Task"
                  icon={<Pencil size={14} />}
                  colour={BLUE}
                  bg="rgba(59,130,246,0.12)"
                  hoverBg="rgba(59,130,246,0.2)"
                  borderColour="rgba(59,130,246,0.25)"
                  onClick={() => onEdit?.(task.id)}
                />
                <ActionButton
                  label="Delete"
                  icon={<Trash2 size={14} />}
                  colour={RED}
                  bg="rgba(239,68,68,0.12)"
                  hoverBg="rgba(239,68,68,0.2)"
                  borderColour="rgba(239,68,68,0.25)"
                  onClick={() => onDelete?.(task.id)}
                />
                <ActionButton
                  label="Close"
                  icon={<X size={14} />}
                  colour={MUTED}
                  bg={DARK3}
                  hoverBg={BORDER}
                  borderColour={BORDER}
                  onClick={onClose}
                />
              </div>
            )}

            {/* Inline keyframe styles for skeleton shimmer */}
            <style>{`
              @keyframes skeletonShimmer {
                0%   { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  // Render via portal to document.body
  if (typeof window === 'undefined') return null
  return createPortal(content, document.body)
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/* Detail cell for the 2-column grid */
function DetailCell({
  icon,
  label,
  value,
  highlight,
  highlightColour,
  valueColour,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
  highlightColour?: string
  valueColour?: string
}) {
  return (
    <div style={{
      background: DARK3,
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 500, color: MUTED, letterSpacing: '0.3px' }}>
          {label}
        </span>
      </div>
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: valueColour ?? '#FFFFFF',
        lineHeight: 1.3,
      }}>
        {value}
      </span>
    </div>
  )
}

/* Small icon wrappers */
function CalendarIcon() {
  return (
    <Clock size={13} style={{ color: MUTED }} />
  )
}

function UserIcon() {
  return (
    <User size={13} style={{ color: MUTED }} />
  )
}

function StatusIcon({ colour }: { colour: string }) {
  return (
    <span style={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      background: colour,
      display: 'inline-block',
      flexShrink: 0,
      boxShadow: `0 0 6px ${colour}50`,
    }} />
  )
}

function PriorityIcon({ colour }: { colour: string }) {
  return (
    <Flag size={13} style={{ color: colour }} />
  )
}

/* Action button at bottom of modal */
function ActionButton({
  label,
  icon,
  colour,
  bg,
  hoverBg,
  borderColour,
  onClick,
}: {
  label: string
  icon: React.ReactNode
  colour: string
  bg: string
  hoverBg: string
  borderColour: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 8,
        border: `1px solid ${borderColour}`,
        background: bg,
        color: colour,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hoverBg
        e.currentTarget.style.borderColor = colour
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = bg
        e.currentTarget.style.borderColor = borderColour
      }}
    >
      {icon}
      {label}
    </button>
  )
}
