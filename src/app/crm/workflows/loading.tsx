export default function WorkflowsLoading() {
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
            <div className="skel-bar" style={{ width: 170, height: 28, marginBottom: 8 }} />
            <div className="skel-bar" style={{ width: 260, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 180, height: 40 }} />
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <div className="skel" style={{ maxWidth: 400, height: 44, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <div className="skel-bar" style={{ width: 180, height: 14 }} />
          </div>
        </div>

        {/* Workflow Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="skel-bar" style={{ width: 40, height: 40, borderRadius: 10 }} />
                  <div>
                    <div className="skel-bar" style={{ width: 140, height: 16, marginBottom: 6 }} />
                    <div className="skel-bar" style={{ width: 200, height: 12 }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="skel-bar" style={{ width: 48, height: 26, borderRadius: 13 }} />
                  <div className="skel-bar" style={{ width: 36, height: 36, borderRadius: 8 }} />
                </div>
              </div>

              {/* Flow steps visualization */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '0 8px' }}>
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="skel-bar" style={{ width: 80, height: 32, borderRadius: 8 }} />
                    {j < 3 && <div className="skel-bar" style={{ width: 24, height: 2 }} />}
                  </div>
                ))}
              </div>

              {/* Metadata */}
              <div style={{ display: 'flex', gap: 24, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="skel-bar" style={{ width: 50, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 36, height: 14 }} />
                </div>
                <div>
                  <div className="skel-bar" style={{ width: 60, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 42, height: 14 }} />
                </div>
                <div>
                  <div className="skel-bar" style={{ width: 55, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 48, height: 14 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
