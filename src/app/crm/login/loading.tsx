export default function LoginLoading() {
  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
        .skel {
          background: #141414;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.05);
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        .skel-bar {
          background: rgba(255,255,255,0.08);
          border-radius: 6px;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        @media (max-width: 767px) {
          .crm-skel-wrap {
            padding: 16px !important;
          }
        }
      `}</style>

      <div className="crm-skel-wrap" style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #111827 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            {/* Logo placeholder */}
            <div className="skel-bar" style={{ width: 64, height: 64, borderRadius: 16, margin: '0 auto 20px' }} />
            <div className="skel-bar" style={{ width: 220, height: 26, margin: '0 auto 8px' }} />
            <div className="skel-bar" style={{ width: 260, height: 14, margin: '0 auto' }} />
          </div>

          {/* Login Card */}
          <div className="skel" style={{ padding: '32px 28px' }}>
            {/* Email field */}
            <div style={{ marginBottom: 20 }}>
              <div className="skel-bar" style={{ width: 36, height: 13, marginBottom: 6 }} />
              <div className="skel-bar" style={{ width: '100%', height: 46, borderRadius: 10 }} />
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 24 }}>
              <div className="skel-bar" style={{ width: 60, height: 13, marginBottom: 6 }} />
              <div className="skel-bar" style={{ width: '100%', height: 46, borderRadius: 10 }} />
            </div>

            {/* Submit button */}
            <div className="skel-bar" style={{ width: '100%', height: 46, borderRadius: 10 }} />
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <div className="skel-bar" style={{ width: 200, height: 12, margin: '0 auto 12px' }} />
            <div className="skel-bar" style={{ width: 180, height: 11, margin: '0 auto' }} />
          </div>
        </div>
      </div>
    </>
  )
}
