'use client'

import { motion } from 'framer-motion'
import { Euro } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// ============================================================================
// DESIGN SYSTEM CONSTANTS
// ============================================================================
const GREEN = '#10B981'
const CARD_BG = '#141414'
const BORDER = 'rgba(255,255,255,0.05)'
const BORDER_HOVER = 'rgba(255,255,255,0.09)'
const TEXT_PRIMARY = '#FFFFFF'
const TEXT_SECONDARY = 'rgba(255,255,255,0.50)'
const TEXT_TERTIARY = 'rgba(255,255,255,0.30)'
const CARD_RADIUS = 16

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const productColors: Record<string, string> = {
  solarpilot: '#F3D840',
  'ai workforce': '#A78BFA',
  both: '#10B981',
}

const cardStyle: React.CSSProperties = {
  borderRadius: CARD_RADIUS,
  background: CARD_BG,
  border: `1px solid ${BORDER}`,
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 600,
  color: TEXT_PRIMARY,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
}

// ============================================================================
// REVENUE CHART CARD
// ============================================================================
export function RevenueChartCard({
  monthlyBreakdown,
  mrr,
  byProduct,
}: {
  monthlyBreakdown: Array<{ month: string; revenue: number }>
  mrr: number
  byProduct: Record<string, { count: number; value: number; mrr: number }>
}) {
  const customTooltipStyle: React.CSSProperties = {
    background: '#1A1A1A',
    border: `1px solid ${BORDER_HOVER}`,
    borderRadius: 10,
    padding: '10px 14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  }

  return (
    <motion.div
      variants={fadeUp}
      style={{ ...cardStyle, padding: 26, display: 'flex', flexDirection: 'column' }}
      whileHover={{ borderColor: BORDER_HOVER, boxShadow: '0 0 30px rgba(16,185,129,0.03)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={sectionTitle}>
          <Euro size={18} style={{ color: GREEN }} />
          Revenue
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 10, color: TEXT_TERTIARY, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>MRR</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: TEXT_PRIMARY }}>{formatCurrency(mrr)}</span>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={monthlyBreakdown} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.25} />
                <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: TEXT_TERTIARY }} axisLine={false} tickLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(1)}k`} />
            <Tooltip
              contentStyle={customTooltipStyle}
              labelStyle={{ fontSize: 11, color: TEXT_TERTIARY, marginBottom: 4 }}
              itemStyle={{ fontSize: 12, color: TEXT_PRIMARY, fontWeight: 600 }}
              formatter={(value: number) => [formatCurrency(value), 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={GREEN}
              strokeWidth={2}
              fill="url(#revenueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Product */}
      {byProduct && (
        <div style={{ marginTop: 20, display: 'flex', gap: 16, paddingTop: 18, borderTop: `1px solid ${BORDER}` }}>
          {Object.entries(byProduct).map(([product, data]) => {
            const pColor = productColors[product.toLowerCase()] || TEXT_SECONDARY
            return (
              <div key={product} style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: pColor,
                    flexShrink: 0,
                  }} />
                  <p style={{ fontSize: 10, color: TEXT_TERTIARY, margin: 0, fontWeight: 500 }}>
                    {product}
                  </p>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY, margin: 0 }}>
                  {formatCurrency(data.value)}
                </p>
                <p style={{ fontSize: 10, color: TEXT_TERTIARY, margin: '2px 0 0' }}>
                  {data.count} client{data.count !== 1 ? 's' : ''} &middot; {formatCurrency(data.mrr)}/mo
                </p>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
