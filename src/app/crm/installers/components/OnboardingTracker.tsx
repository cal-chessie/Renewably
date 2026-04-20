'use client'

import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'
import { ONBOARDING_STEPS } from '../types'

interface OnboardingTrackerProps {
  currentStep: number
  isComplete: boolean
}

export function OnboardingTracker({ currentStep, isComplete }: OnboardingTrackerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 4, backgroundColor: '#222222', borderRadius: 100, overflow: 'hidden' }}>
          <motion.div
            style={{
              height: '100%',
              borderRadius: 100,
              background: isComplete
                ? 'linear-gradient(90deg, #10B981, #34D399)'
                : 'linear-gradient(90deg, #F3D840, #FACC15)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / 10) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: isComplete ? '#4ADE80' : '#D1D5DB', flexShrink: 0 }}>
          {currentStep}/10
        </span>
      </div>

      {/* Steps grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 6,
      }}>
        {ONBOARDING_STEPS.map((s, i) => {
          const done = s.step <= currentStep
          const current = s.step === currentStep && !isComplete
          return (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 10px',
                borderRadius: 8,
                backgroundColor: done ? 'rgba(16,185,129,0.08)' : current ? 'rgba(243,216,64,0.1)' : '#1A1A1A',
                border: `1px solid ${done ? 'rgba(16,185,129,0.2)' : current ? 'rgba(243,216,64,0.25)' : '#2A2A2A'}`,
              }}
            >
              {done ? (
                <Check style={{ width: 14, height: 14, color: '#4ADE80', flexShrink: 0 }} />
              ) : current ? (
                <div style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: '2px solid #F3D840',
                  flexShrink: 0,
                }} />
              ) : (
                <Circle style={{ width: 14, height: 14, color: '#4B5563', flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: 10,
                fontWeight: done || current ? 500 : 400,
                color: done ? '#4ADE80' : current ? '#FACC15' : '#6B7280',
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {s.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
