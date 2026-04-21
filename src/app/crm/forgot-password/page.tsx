'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Sun, ArrowLeft, CheckCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

// ============================================================================
// BRAND CONSTANTS
// ============================================================================
const DARK = '#0A0A0A'
const DARK2 = '#1A1A1A'
const YELLOW = '#F3D840'
const YELLOW_DARK = '#E5C832'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/crm/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send reset email')
        return
      }

      setSent(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${DARK} 0%, ${DARK2} 50%, #111827 100%)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient background elements */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${YELLOW}08 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        left: '-10%',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${YELLOW}05 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Brand Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ textAlign: 'center', marginBottom: 40 }}
        >
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 16,
            background: `${YELLOW}15`,
            border: `1px solid ${YELLOW}25`,
            marginBottom: 20,
          }}>
            <Image
              src="/logo-white.png"
              alt="Renewably"
              width={36}
              height={36}
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
          <h1 style={{
            color: '#FFF',
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            margin: '0 0 8px',
          }}>
            {sent ? 'Check Your Email' : 'Forgot Password?'}
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.45)',
            fontSize: 14,
            margin: 0,
          }}>
            {sent
              ? "If an account exists with that email, you'll receive a reset link shortly."
              : "Enter your email and we'll send you a password reset link."
            }
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '32px 28px',
          }}
        >
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  marginBottom: 16,
                }}
              >
                <CheckCircle size={28} color="#86EFAC" />
              </motion.div>
              <p style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 14,
                lineHeight: 1.6,
                margin: '0 0 24px',
              }}>
                We&apos;ve sent a password reset link to <strong style={{ color: '#FFF' }}>{email}</strong>.
                The link will expire in 1 hour.
              </p>
              <button
                onClick={() => router.push('/crm/login')}
                style={{
                  background: YELLOW,
                  color: DARK,
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  width: '100%',
                }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#FCA5A5',
                    fontSize: 13,
                    borderRadius: 10,
                    padding: '12px 16px',
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* Email Field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="email" style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: 13,
                  fontWeight: 500,
                }}>
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@renewably.ie"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    color: '#FFF',
                    fontSize: 14,
                    padding: '0 14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = `${YELLOW}60`
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${YELLOW}15`
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  height: 46,
                  borderRadius: 10,
                  border: 'none',
                  background: loading ? YELLOW_DARK : YELLOW,
                  color: DARK,
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'background 0.2s',
                  marginTop: 4,
                }}
              >
                {loading ? (
                  <>
                    <div style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${DARK}33`,
                      borderTopColor: DARK,
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }} />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </motion.button>
            </form>
          )}

          {!sent && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Link
                href="/crm/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = YELLOW
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.4)'
                }}
              >
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{
            textAlign: 'center',
            marginTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'rgba(255,255,255,0.2)',
            fontSize: 12,
          }}>
            <Sun size={12} />
            <span>Powering Ireland&apos;s solar revolution</span>
          </div>
          <p style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: 11,
            margin: 0,
          }}>
            &copy; 2026 Renewably. All rights reserved.
          </p>
        </motion.div>
      </motion.div>

      {/* Inline keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
