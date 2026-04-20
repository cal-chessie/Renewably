export default function ActivitiesLoading() {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div className="skel-bar" style={{ width: 180, height: 28, marginBottom: 8 }} />
            <div className="skel-bar" style={{ width: 240, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 160, height: 40 }} />
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skel-bar" style={{ width: 80, height: 36, borderRadius: 8 }} />
          ))}
        </div>

        {/* Activity Feed - Timeline Style */}
        <div className="skel" style={{ padding: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: i < 7 ? 24 : 0 }}>
              {/* Timeline line + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 32 }}>
                <div className="skel-bar" style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0 }} />
                {i < 7 && <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.08)', marginTop: 4 }} />}
              </div>

              {/* Activity content */}
              <div style={{ flex: 1, paddingBottom: 24, borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div className="skel-bar" style={{ width: '55%', height: 14, marginBottom: 6 }} />
                    <div className="skel-bar" style={{ width: '35%', height: 12 }} />
                  </div>
                  <div className="skel-bar" style={{ width: 64, height: 10, flexShrink: 0 }} />
                </div>
                <div className="skel-bar" style={{ width: '75%', height: 12, marginBottom: 10 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <div className="skel-bar" style={{ width: 72, height: 24, borderRadius: 6 }} />
                  <div className="skel-bar" style={{ width: 56, height: 24, borderRadius: 6 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
