export default function ContactDetailLoading() {
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
        .crm-skel-wrap {
          padding: 32px 48px !important;
        }
        @media (max-width: 767px) {
          .crm-skel-wrap {
            padding: 16px !important;
          }
          .crm-skel-wrap > div:first-child {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>

      <div className="crm-skel-wrap" style={{ background: '#080808', minHeight: '100vh', padding: '32px 48px', color: '#fff' }}>
        {/* Back button */}
        <div className="skel-bar" style={{ width: 140, height: 16, marginBottom: 32 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
          {/* Avatar */}
          <div className="skel-bar" style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0 }} />
          <div>
            <div className="skel-bar" style={{ width: 200, height: 24, marginBottom: 8 }} />
            <div className="skel-bar" style={{ width: 140, height: 14, marginBottom: 6 }} />
            <div className="skel-bar" style={{ width: 180, height: 14, marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="skel-bar" style={{ width: 64, height: 24, borderRadius: 12 }} />
              <div className="skel-bar" style={{ width: 56, height: 24, borderRadius: 12 }} />
              <div className="skel-bar" style={{ width: 72, height: 24, borderRadius: 12 }} />
            </div>
          </div>
        </div>

        {/* Tabs bar */}
        <div className="skel" style={{ padding: '6px 8px', marginBottom: 24, display: 'flex', gap: 4 }}>
          {['Overview', 'Deals', 'Activities', 'Tasks', 'Notes'].map((tab) => (
            <div className="skel-bar" key={tab} style={{ width: 80, height: 32, borderRadius: 6 }} />
          ))}
        </div>

        {/* Content area - 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
          {/* Contact Information Card */}
          <div className="skel" style={{ padding: 24 }}>
            <div className="skel-bar" style={{ width: 140, height: 18, marginBottom: 24 }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div className="skel-bar" style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0 }} />
                <div>
                  <div className="skel-bar" style={{ width: 40, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 120, height: 14 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Description / Main content area */}
          <div className="skel" style={{ padding: 24 }}>
            <div className="skel-bar" style={{ width: 100, height: 18, marginBottom: 20 }} />
            <div className="skel-bar" style={{ width: '90%', height: 14, marginBottom: 10 }} />
            <div className="skel-bar" style={{ width: '80%', height: 14, marginBottom: 10 }} />
            <div className="skel-bar" style={{ width: '70%', height: 14, marginBottom: 10 }} />
            <div className="skel-bar" style={{ width: '85%', height: 14 }} />
          </div>
        </div>
      </div>
    </>
  )
}
