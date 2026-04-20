export default function DashboardLoading() {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <div className="skel-bar" style={{ width: 220, height: 28, marginBottom: 8 }} />
            <div className="skel-bar" style={{ width: 320, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 140, height: 40 }} />
            <div className="skel" style={{ width: 140, height: 40 }} />
          </div>
        </div>

        {/* KPI Cards Row - 5 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 32 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div className="skel-bar" style={{ width: 100, height: 14 }} />
                <div className="skel-bar" style={{ width: 32, height: 32, borderRadius: 8 }} />
              </div>
              <div className="skel-bar" style={{ width: '60%', height: 28, marginBottom: 8 }} />
              <div className="skel-bar" style={{ width: '40%', height: 12 }} />
            </div>
          ))}
        </div>

        {/* Middle Section - 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 32 }}>
          {/* Chart area */}
          <div className="skel" style={{ padding: 24, height: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div className="skel-bar" style={{ width: 160, height: 20 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="skel-bar" style={{ width: 60, height: 28, borderRadius: 14 }} />
                <div className="skel-bar" style={{ width: 60, height: 28, borderRadius: 14 }} />
                <div className="skel-bar" style={{ width: 60, height: 28, borderRadius: 14 }} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 220 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="skel-bar"
                  style={{
                    flex: 1,
                    height: `${30 + ((i * 11) % 70)}%`,
                    borderRadius: 6,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="skel" style={{ padding: 24 }}>
            <div className="skel-bar" style={{ width: 140, height: 20, marginBottom: 24 }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div className="skel-bar" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel-bar" style={{ width: '70%', height: 14, marginBottom: 6 }} />
                  <div className="skel-bar" style={{ width: '45%', height: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section - 3 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 24 }}>
              <div className="skel-bar" style={{ width: 120, height: 18, marginBottom: 20 }} />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: j > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="skel-bar" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <div>
                      <div className="skel-bar" style={{ width: 100, height: 13, marginBottom: 4 }} />
                      <div className="skel-bar" style={{ width: 60, height: 10 }} />
                    </div>
                  </div>
                  <div className="skel-bar" style={{ width: 60, height: 20, borderRadius: 10 }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
