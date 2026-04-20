export default function MeetingsLoading() {
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
            <div className="skel-bar" style={{ width: 220, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 160, height: 40 }} />
          </div>
        </div>

        {/* View Toggle & Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="skel-bar" style={{ width: 50, height: 36, borderRadius: 8 }} />
            <div className="skel-bar" style={{ width: 50, height: 36, borderRadius: 8 }} />
            <div className="skel-bar" style={{ width: 50, height: 36, borderRadius: 8 }} />
          </div>
          <div className="skel" style={{ width: 200, height: 44 }} />
        </div>

        {/* Meeting Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Time block */}
              <div style={{ textAlign: 'center', width: 72, flexShrink: 0 }}>
                <div className="skel-bar" style={{ width: 48, height: 20, margin: '0 auto 4px' }} />
                <div className="skel-bar" style={{ width: 36, height: 12, margin: '0 auto' }} />
              </div>

              {/* Divider */}
              <div style={{ width: 3, height: 48, borderRadius: 2, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

              {/* Meeting info */}
              <div style={{ flex: 1 }}>
                <div className="skel-bar" style={{ width: '50%', height: 16, marginBottom: 8 }} />
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="skel-bar" style={{ width: 14, height: 14, borderRadius: 3 }} />
                    <div className="skel-bar" style={{ width: 100, height: 12 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="skel-bar" style={{ width: 14, height: 14, borderRadius: 3 }} />
                    <div className="skel-bar" style={{ width: 80, height: 12 }} />
                  </div>
                </div>
              </div>

              {/* Attendees */}
              <div style={{ display: 'flex', gap: -6 }}>
                <div className="skel-bar" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                <div className="skel-bar" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                <div className="skel-bar" style={{ width: 30, height: 30, borderRadius: '50%' }} />
              </div>

              {/* Status */}
              <div className="skel-bar" style={{ width: 72, height: 26, borderRadius: 13 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
