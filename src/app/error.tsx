'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[ErrorBoundary] Client error:', error.message, error.stack)
  }, [error])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '40px',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#0A0A0A',
      color: '#fff',
    }}>
      <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#F3D840' }}>
        Something went wrong
      </h2>
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '24px', textAlign: 'center', maxWidth: '500px' }}>
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        style={{
          padding: '10px 24px',
          backgroundColor: '#F3D840',
          color: '#1A1A1A',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 700,
          fontSize: '14px',
          cursor: 'pointer',
        }}
      >
        Try again
      </button>
    </div>
  )
}
