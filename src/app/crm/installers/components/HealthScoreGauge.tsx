'use client'

import { motion } from 'framer-motion'

interface HealthScoreGaugeProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

export function HealthScoreGauge({ score, size = 72, strokeWidth = 6, showLabel = true }: HealthScoreGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10B981'
    if (s >= 60) return '#F3D840'
    if (s >= 40) return '#F59E0B'
    return '#EF4444'
  }

  const color = getScoreColor(score)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#222222"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: size * 0.28, fontWeight: 700, color: '#FFFFFF', lineHeight: 1 }}
          >
            {score}
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <span style={{ fontSize: 11, fontWeight: 500, color: '#9CA3AF' }}>
          {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'At Risk'}
        </span>
      )}
    </div>
  )
}
