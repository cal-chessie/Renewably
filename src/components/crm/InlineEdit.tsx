'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Pencil, Loader2 } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// DESIGN SYSTEM CONSTANTS — matches PipelineBoard DS
// ═══════════════════════════════════════════════════════════════════
const DS = {
  BG_CARD: '#141414',
  BG_ELEVATED: '#1A1A1A',
  BG_INPUT: '#0E0E0E',
  BORDER: 'rgba(255,255,255,0.05)',
  BORDER_HOVER: 'rgba(255,255,255,0.09)',
  BORDER_FOCUS: 'rgba(243,216,64,0.35)',
  YELLOW: '#F3D840',
  GREEN: '#10B981',
  RED: '#F87171',
  TEXT_PRIMARY: '#FFFFFF',
  TEXT_SECONDARY: 'rgba(255,255,255,0.50)',
  TEXT_TERTIARY: 'rgba(255,255,255,0.30)',
  TEXT_MUTED: 'rgba(255,255,255,0.30)',
} as const

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
type InlineEditMode = 'text' | 'number' | 'select'

interface SelectOption {
  value: string
  label: string
  color?: string
  icon?: React.ElementType
}

interface InlineEditProps {
  /** The current raw value */
  value: string | number | null | undefined
  /** Display value (formatted) when not editing */
  displayValue?: ReactNode
  /** Mode: text input, number input, or select dropdown */
  mode?: InlineEditMode
  /** Options for select mode */
  options?: SelectOption[]
  /** Placeholder when value is empty */
  placeholder?: string
  /** Callback to save the new value. Receives the new value. Returns a promise. */
  onSave: (value: string | number) => Promise<void>
  /** Format the number for display (e.g. currency) */
  formatValue?: (value: number) => string
  /** Color accent for the edit state */
  accentColor?: string
  /** Extra CSS styles for the container */
  containerStyle?: React.CSSProperties
  /** Input font size */
  fontSize?: number
  /** Input font weight */
  fontWeight?: number
  /** Whether the field is disabled */
  disabled?: boolean
  /** Input width (e.g. '120px', '100%') */
  inputWidth?: string
}

// ═══════════════════════════════════════════════════════════════════
// INLINE EDIT COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function InlineEdit({
  value,
  displayValue,
  mode = 'text',
  options = [],
  placeholder = 'Click to edit',
  onSave,
  formatValue,
  accentColor = DS.YELLOW,
  containerStyle,
  fontSize = 14,
  fontWeight = 600,
  disabled = false,
  inputWidth,
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Sync edit value when entering edit mode
  const startEditing = useCallback(() => {
    if (disabled || isLoading) return
    if (mode === 'number') {
      setEditValue(value != null ? String(value) : '')
    } else {
      setEditValue(value != null ? String(value) : '')
    }
    setError(null)
    setIsEditing(true)
  }, [value, disabled, isLoading, mode])

  // Auto-focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // Select all text for easy replacement
      if (mode !== 'select') {
        inputRef.current.select()
      }
    }
  }, [isEditing, mode])

  // Save handler
  const save = useCallback(async () => {
    if (isLoading) return

    // For number mode, parse and validate
    if (mode === 'number') {
      const num = parseFloat(editValue)
      if (editValue.trim() === '' || isNaN(num)) {
        setIsEditing(false)
        return
      }
      if (num < 0) {
        setError('Must be non-negative')
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        await onSave(num)
        setIsEditing(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      } finally {
        setIsLoading(false)
      }
    } else if (mode === 'select') {
      const opt = options.find((o) => o.value === editValue)
      if (opt) {
        setIsLoading(true)
        setError(null)
        try {
          await onSave(opt.value)
          setIsEditing(false)
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to save')
        } finally {
          setIsLoading(false)
        }
      }
    } else {
      // Text mode — only save if changed
      const str = editValue.trim()
      if (str === String(value ?? '')) {
        setIsEditing(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        await onSave(str)
        setIsEditing(false)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save')
      } finally {
        setIsLoading(false)
      }
    }
  }, [editValue, mode, isLoading, onSave, value, options])

  // Cancel handler
  const cancel = useCallback(() => {
    if (isLoading) return
    setIsEditing(false)
    setError(null)
  }, [isLoading])

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        save()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancel()
      }
    },
    [save, cancel]
  )

  // Click outside to save
  useEffect(() => {
    if (!isEditing) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        save()
      }
    }
    // Use mousedown so we catch it before focus shifts
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isEditing, save])

  // Determine the display text
  const getDisplayText = () => {
    if (displayValue !== undefined) return displayValue
    if (value == null) return null
    if (mode === 'number' && formatValue && typeof value === 'number') {
      return formatValue(value)
    }
    return String(value)
  }

  const display = getDisplayText()
  const isEmpty = value == null || value === '' || value === 0

  // Get the current select option for display
  const currentOption = mode === 'select' ? options.find((o) => o.value === value) : null

  return (
    <div
      ref={containerRef}
      className="relative inline-flex items-center"
      style={{ minWidth: 32, ...containerStyle }}
    >
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.button
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            onClick={startEditing}
            disabled={disabled}
            className="group/inline-edit flex items-center gap-1.5 cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 transition-all duration-150 w-full"
            style={{
              background: 'transparent',
              border: 'none',
              color: isEmpty ? DS.TEXT_TERTIARY : DS.TEXT_PRIMARY,
              fontSize,
              fontWeight,
              fontFamily: mode === 'number' ? 'monospace' : 'inherit',
              letterSpacing: mode === 'number' ? '-0.02em' : 'inherit',
              textAlign: 'left',
              width: inputWidth || 'auto',
            }}
            onMouseEnter={(e) => {
              if (disabled) return
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              e.currentTarget.style.outline = `1px solid ${DS.BORDER_HOVER}`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.outline = '1px solid transparent'
            }}
          >
            <span className="truncate">{display || placeholder}</span>
            <Pencil
              className="shrink-0 opacity-0 group-hover/inline-edit:opacity-100 transition-opacity duration-150"
              size={fontSize < 16 ? 11 : 13}
              style={{ color: accentColor }}
            />
          </motion.button>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1"
            style={{ width: inputWidth || '100%' }}
          >
            {mode === 'select' ? (
              <select
                ref={inputRef as React.RefObject<HTMLSelectElement>}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="rounded-lg px-2 py-1 text-sm outline-none cursor-pointer"
                style={{
                  flex: 1,
                  background: DS.BG_INPUT,
                  border: `1.5px solid ${accentColor}50`,
                  color: DS.TEXT_PRIMARY,
                  fontSize,
                  fontWeight,
                  boxShadow: `0 0 0 2px ${accentColor}10`,
                  appearance: 'auto',
                  minWidth: 100,
                }}
              >
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                ref={inputRef}
                type={mode === 'number' ? 'number' : 'text'}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                placeholder={placeholder}
                min={mode === 'number' ? 0 : undefined}
                step={mode === 'number' ? 'any' : undefined}
                className="rounded-lg px-2.5 py-1 outline-none"
                style={{
                  flex: 1,
                  background: DS.BG_INPUT,
                  border: `1.5px solid ${accentColor}50`,
                  color: DS.TEXT_PRIMARY,
                  fontSize,
                  fontWeight,
                  fontFamily: mode === 'number' ? 'monospace' : 'inherit',
                  letterSpacing: mode === 'number' ? '-0.02em' : 'inherit',
                  boxShadow: `0 0 0 2px ${accentColor}10`,
                  width: inputWidth || 'auto',
                  minWidth: 80,
                }}
              />
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: 20, height: 20,
                    border: `2px solid ${accentColor}30`,
                    borderTopColor: accentColor,
                    borderRadius: '50%',
                  }}
                />
              ) : (
                <>
                  <button
                    onClick={save}
                    className="flex items-center justify-center rounded-md transition-colors duration-100"
                    style={{
                      width: 22, height: 22,
                      background: `${accentColor}18`,
                      color: accentColor,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${accentColor}30`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `${accentColor}18`
                    }}
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={cancel}
                    className="flex items-center justify-center rounded-md transition-colors duration-100"
                    style={{
                      width: 22, height: 22,
                      background: 'rgba(255,255,255,0.05)',
                      color: DS.TEXT_SECONDARY,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.10)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }}
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 mt-1 whitespace-nowrap z-50"
          >
            <div
              className="rounded-lg px-2.5 py-1 text-xs font-medium"
              style={{
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.25)',
                color: DS.RED,
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
            >
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// INLINE EDIT FOR KANBAN CARD — Compact number + product cycle
// ═══════════════════════════════════════════════════════════════════
interface CardInlineNumberProps {
  value: number | null
  onSave: (value: number) => Promise<void>
  /** Format function for display */
  format?: (v: number) => string
  accentColor?: string
}

export function CardInlineNumber({ value, onSave, format, accentColor = DS.GREEN }: CardInlineNumberProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const startEditing = useCallback(() => {
    if (isLoading) return
    setEditValue(value != null ? String(value) : '')
    setError(null)
    setIsEditing(true)
  }, [value, isLoading])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const save = useCallback(async () => {
    if (isLoading) return
    const num = parseFloat(editValue)
    if (editValue.trim() === '' || isNaN(num) || num <= 0) {
      setIsEditing(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await onSave(num)
      setIsEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setIsLoading(false)
    }
  }, [editValue, isLoading, onSave])

  const cancel = useCallback(() => {
    if (isLoading) return
    setIsEditing(false)
    setError(null)
  }, [isLoading])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') { e.preventDefault(); save() }
      else if (e.key === 'Escape') { e.preventDefault(); cancel() }
    },
    [save, cancel]
  )

  // Click outside to save
  useEffect(() => {
    if (!isEditing) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        save()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isEditing, save])

  if (value == null || value <= 0) return null

  return (
    <div ref={containerRef} className="relative inline-flex items-baseline gap-1">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.span
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            onClick={startEditing}
            className="cursor-pointer rounded px-1 -mx-1"
            style={{
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'monospace',
              color: accentColor,
              letterSpacing: '0.01em',
            }}
            title="Click to edit MRR"
          >
            {format ? format(value) : `€${value.toLocaleString('en-IE')}`}
          </motion.span>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-1"
          >
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: accentColor }}>€</span>
            <input
              ref={inputRef}
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              min={0}
              step="any"
              className="rounded-md px-1 py-0 outline-none"
              style={{
                width: 80,
                background: DS.BG_INPUT,
                border: `1.5px solid ${accentColor}50`,
                color: DS.TEXT_PRIMARY,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'monospace',
                boxShadow: `0 0 0 2px ${accentColor}10`,
              }}
            />
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 14, height: 14,
                  border: `1.5px solid ${accentColor}30`,
                  borderTopColor: accentColor,
                  borderRadius: '50%',
                }}
              />
            ) : (
              <>
                <button
                  onClick={save}
                  className="flex items-center justify-center rounded"
                  style={{ width: 18, height: 18, background: `${accentColor}18`, color: accentColor, border: 'none', cursor: 'pointer' }}
                >
                  <Check size={10} />
                </button>
                <button
                  onClick={cancel}
                  className="flex items-center justify-center rounded"
                  style={{ width: 18, height: 18, background: 'rgba(255,255,255,0.05)', color: DS.TEXT_SECONDARY, border: 'none', cursor: 'pointer' }}
                >
                  <X size={10} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full left-0 mt-0.5 z-50"
          >
            <div className="rounded px-2 py-0.5" style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', color: DS.RED, fontSize: 10, whiteSpace: 'nowrap' }}>
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PRODUCT CYCLER — Click to cycle through product options
// ═══════════════════════════════════════════════════════════════════
interface ProductCyclerProps {
  product: string
  onSave: (product: string) => Promise<void>
}

export function ProductCycler({ product, onSave }: ProductCyclerProps) {
  const [isLoading, setIsLoading] = useState(false)

  const productOrder = ['solarpilot', 'ai_workforce', 'both']

  const PRODUCTS: Record<string, { label: string; color: string }> = {
    solarpilot: { label: 'SolarPilot', color: '#F3D840' },
    ai_workforce: { label: 'AI Workforce', color: '#A78BFA' },
    both: { label: 'Both', color: '#22C55E' },
  }

  const cycle = useCallback(async () => {
    if (isLoading) return
    const currentIdx = productOrder.indexOf(product)
    const nextIdx = (currentIdx + 1) % productOrder.length
    const nextProduct = productOrder[nextIdx]
    setIsLoading(true)
    try {
      await onSave(nextProduct)
    } catch {
      // Error handled by parent
    } finally {
      setIsLoading(false)
    }
  }, [product, isLoading, onSave])

  const p = PRODUCTS[product] || PRODUCTS.solarpilot

  return (
    <button
      onClick={cycle}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all duration-150"
      style={{
        color: p.color,
        backgroundColor: `${p.color}14`,
        border: 'none',
        opacity: isLoading ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${p.color}22`
        e.currentTarget.style.outline = `1px solid ${p.color}30`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${p.color}14`
        e.currentTarget.style.outline = '1px solid transparent'
      }}
      title="Click to change product"
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 10, height: 10,
            border: `1.5px solid ${p.color}40`,
            borderTopColor: p.color,
            borderRadius: '50%',
          }}
        />
      ) : (
        p.label
      )}
    </button>
  )
}
