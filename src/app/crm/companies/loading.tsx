export default function CompaniesLoading() {
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
            <div className="skel-bar" style={{ width: 260, height: 16 }} />
          </div>
          <div className="skel" style={{ width: 160, height: 40 }} />
        </div>

        {/* Search & Filters Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'center' }}>
          <div className="skel" style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <div className="skel-bar" style={{ width: 24, height: 24, borderRadius: 4 }} />
            <div className="skel-bar" style={{ width: 200, height: 14, marginLeft: 12 }} />
          </div>
          <div className="skel" style={{ width: 130, height: 44 }} />
          <div className="skel" style={{ width: 130, height: 44 }} />
          <div className="skel" style={{ width: 44, height: 44, borderRadius: 12 }} />
        </div>

        {/* Grid of 6 company cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 24 }}>
              {/* Company header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <div className="skel-bar" style={{ width: 48, height: 48, borderRadius: 12 }} />
                <div style={{ flex: 1 }}>
                  <div className="skel-bar" style={{ width: '65%', height: 16, marginBottom: 6 }} />
                  <div className="skel-bar" style={{ width: '40%', height: 12 }} />
                </div>
              </div>

              {/* Info rows */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div className="skel-bar" style={{ width: 14, height: 14, borderRadius: 3 }} />
                  <div className="skel-bar" style={{ width: '50%', height: 12 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div className="skel-bar" style={{ width: 14, height: 14, borderRadius: 3 }} />
                  <div className="skel-bar" style={{ width: '40%', height: 12 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="skel-bar" style={{ width: 14, height: 14, borderRadius: 3 }} />
                  <div className="skel-bar" style={{ width: '55%', height: 12 }} />
                </div>
              </div>

              {/* Bottom stats */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="skel-bar" style={{ width: 50, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 36, height: 16 }} />
                </div>
                <div>
                  <div className="skel-bar" style={{ width: 50, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 42, height: 16 }} />
                </div>
                <div>
                  <div className="skel-bar" style={{ width: 50, height: 10, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 30, height: 16 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
