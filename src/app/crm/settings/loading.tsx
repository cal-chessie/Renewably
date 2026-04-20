export default function SettingsLoading() {
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
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div className="skel-bar" style={{ width: 180, height: 28, marginBottom: 8 }} />
          <div className="skel-bar" style={{ width: 300, height: 16 }} />
        </div>

        {/* Two-column layout: sidebar nav + content */}
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24 }}>
          {/* Sidebar Navigation */}
          <div className="skel" style={{ padding: 16, height: 'fit-content', position: 'sticky', top: 32 }}>
            <div className="skel-bar" style={{ width: 100, height: 12, marginBottom: 16, marginLeft: 12 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skel-bar" style={{ width: `${70 + ((i * 7) % 25)}%`, height: 40, borderRadius: 10 }} />
              ))}
            </div>
          </div>

          {/* Settings Content Area */}
          <div>
            {/* Section 1: Profile */}
            <div className="skel" style={{ padding: 28, marginBottom: 16 }}>
              <div className="skel-bar" style={{ width: 160, height: 20, marginBottom: 24 }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
                <div className="skel-bar" style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel-bar" style={{ width: 120, height: 14, marginBottom: 12 }} />
                  <div className="skel-bar" style={{ width: 140, height: 36, borderRadius: 8 }} />
                </div>
              </div>

              {/* Form fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="skel-bar" style={{ width: 80, height: 12, marginBottom: 8 }} />
                    <div className="skel-bar" style={{ width: '100%', height: 42, borderRadius: 10 }} />
                  </div>
                ))}
              </div>

              {/* Save button */}
              <div style={{ marginTop: 24 }}>
                <div className="skel-bar" style={{ width: 120, height: 40, borderRadius: 10 }} />
              </div>
            </div>

            {/* Section 2: Notifications */}
            <div className="skel" style={{ padding: 28, marginBottom: 16 }}>
              <div className="skel-bar" style={{ width: 200, height: 20, marginBottom: 24 }} />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div>
                    <div className="skel-bar" style={{ width: `${100 + ((i * 17) % 60)}px`, height: 14, marginBottom: 4 }} />
                    <div className="skel-bar" style={{ width: `${120 + ((i * 13) % 40)}px`, height: 12 }} />
                  </div>
                  <div className="skel-bar" style={{ width: 44, height: 24, borderRadius: 12 }} />
                </div>
              ))}
            </div>

            {/* Section 3: Danger Zone */}
            <div className="skel" style={{ padding: 28, borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <div className="skel-bar" style={{ width: 140, height: 20, marginBottom: 12 }} />
              <div className="skel-bar" style={{ width: '70%', height: 12, marginBottom: 20 }} />
              <div className="skel-bar" style={{ width: 160, height: 40, borderRadius: 10, background: 'rgba(239, 68, 68, 0.15)' }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
