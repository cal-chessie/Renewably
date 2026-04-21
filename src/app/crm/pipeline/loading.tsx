export default function PipelineLoading() {
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
        .skel-card {
          background: #141414;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.05);
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
            <div className="skel-bar" style={{ width: 280, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 160, height: 40 }} />
          </div>
        </div>

        {/* Pipeline Summary Bar */}
        <div className="skel" style={{ padding: '16px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 32 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="skel-bar" style={{ width: 80, height: 10, marginBottom: 4 }} />
                <div className="skel-bar" style={{ width: 48, height: 18 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skel-bar" style={{ width: 60, height: 28, borderRadius: 14 }} />
            <div className="skel-bar" style={{ width: 60, height: 28, borderRadius: 14 }} />
          </div>
        </div>

        {/* 9 Pipeline Columns */}
        <div style={{ display: 'flex', gap: 16, overflow: 'hidden' }}>
          {[
            { title: 'New Lead', count: 4 },
            { title: 'Contacted', count: 3 },
            { title: 'Discovery Call', count: 2 },
            { title: 'Demo Booked', count: 3 },
            { title: 'Demo Done', count: 2 },
            { title: 'Proposal Sent', count: 3 },
            { title: 'Negotiation', count: 2 },
            { title: 'Closed Won', count: 2 },
            { title: 'Closed Lost', count: 1 },
          ].map((col, colIdx) => (
            <div key={colIdx} style={{ flex: 1, minWidth: 0 }}>
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="skel-bar" style={{ width: 8, height: 8, borderRadius: '50%' }} />
                  <div className="skel-bar" style={{ width: 80, height: 14 }} />
                </div>
                <div className="skel-bar" style={{ width: 24, height: 24, borderRadius: 6 }} />
              </div>

              {/* Column Value */}
              <div style={{ marginBottom: 16, padding: '0 4px' }}>
                <div className="skel-bar" style={{ width: 56, height: 22, marginBottom: 2 }} />
                <div className="skel-bar" style={{ width: 40, height: 10 }} />
              </div>

              {/* Deal Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from({ length: col.count }).map((_, cardIdx) => (
                  <div className="skel-card" key={cardIdx} style={{ padding: 16 }}>
                    <div className="skel-bar" style={{ width: '75%', height: 14, marginBottom: 12 }} />
                    <div className="skel-bar" style={{ width: '50%', height: 10, marginBottom: 16 }} />

                    {/* Mini avatar row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div className="skel-bar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
                      <div className="skel-bar" style={{ width: 64, height: 18, borderRadius: 9 }} />
                    </div>

                    {/* Progress bar placeholder */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="skel-bar" style={{ width: '55%', height: 16, marginBottom: 6 }} />
                      <div className="skel-bar" style={{ width: 60, height: 8, borderRadius: 4, marginTop: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
