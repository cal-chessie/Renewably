export default function ReportsLoading() {
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
            <div className="skel-bar" style={{ width: 140, height: 28, marginBottom: 8 }} />
            <div className="skel-bar" style={{ width: 220, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 160, height: 40 }} />
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="skel" style={{ padding: '12px 20px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel-bar" style={{ width: 64, height: 30, borderRadius: 6 }} />
            ))}
          </div>
          <div className="skel-bar" style={{ width: 180, height: 30, borderRadius: 6 }} />
        </div>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 20 }}>
              <div className="skel-bar" style={{ width: 80, height: 12, marginBottom: 12 }} />
              <div className="skel-bar" style={{ width: '55%', height: 26, marginBottom: 6 }} />
              <div className="skel-bar" style={{ width: '30%', height: 10 }} />
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <div className="skel-bar" style={{ width: 140, height: 18 }} />
                <div className="skel-bar" style={{ width: 60, height: 28, borderRadius: 14 }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200 }}>
                {Array.from({ length: 10 }).map((_, j) => (
                  <div key={j} className="skel-bar" style={{ flex: 1, height: `${25 + ((j * 11) % 75)}%`, borderRadius: 4 }} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Table Section */}
        <div className="skel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="skel-bar" style={{ width: 140, height: 18 }} />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="skel-bar" style={{ width: '60%', height: 14 }} />
              <div className="skel-bar" style={{ width: '45%', height: 14 }} />
              <div className="skel-bar" style={{ width: '50%', height: 14 }} />
              <div className="skel-bar" style={{ width: '40%', height: 14 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
