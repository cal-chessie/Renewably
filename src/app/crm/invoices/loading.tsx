export default function InvoicesLoading() {
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
            <div className="skel-bar" style={{ width: 160, height: 28, marginBottom: 8 }} />
            <div className="skel-bar" style={{ width: 240, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 160, height: 40 }} />
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 20 }}>
              <div className="skel-bar" style={{ width: 90, height: 12, marginBottom: 12 }} />
              <div className="skel-bar" style={{ width: '60%', height: 24, marginBottom: 6 }} />
              <div className="skel-bar" style={{ width: '35%', height: 10 }} />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <div className="skel" style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <div className="skel-bar" style={{ width: 180, height: 14 }} />
          </div>
          <div className="skel" style={{ width: 130, height: 44 }} />
          <div className="skel" style={{ width: 130, height: 44 }} />
        </div>

        {/* Table */}
        <div className="skel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 80px', gap: 16, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <div className="skel-bar" style={{ width: 70, height: 12 }} />
              </div>
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 80px', gap: 16, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="skel-bar" style={{ width: 80, height: 14 }} />
              <div className="skel-bar" style={{ width: 120, height: 14 }} />
              <div className="skel-bar" style={{ width: 90, height: 14 }} />
              <div className="skel-bar" style={{ width: 64, height: 24, borderRadius: 12 }} />
              <div className="skel-bar" style={{ width: 70, height: 14 }} />
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <div className="skel-bar" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div className="skel-bar" style={{ width: 28, height: 28, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
