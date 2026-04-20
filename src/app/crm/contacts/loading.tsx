export default function ContactsLoading() {
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

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          <div className="skel" style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
            <div className="skel-bar" style={{ width: 200, height: 14 }} />
          </div>
          <div className="skel" style={{ width: 130, height: 44 }} />
          <div className="skel" style={{ width: 130, height: 44 }} />
        </div>

        {/* Table Card */}
        <div className="skel" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px', gap: 16, padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div className="skel-bar" style={{ width: i === 5 ? 24 : 70, height: 12 }} />
                {i < 5 && <div className="skel-bar" style={{ width: 10, height: 10, borderRadius: 2 }} />}
              </div>
            ))}
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 80px',
                gap: 16,
                padding: '16px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Name cell */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="skel-bar" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                <div>
                  <div className="skel-bar" style={{ width: 100, height: 14, marginBottom: 4 }} />
                  <div className="skel-bar" style={{ width: 130, height: 10 }} />
                </div>
              </div>
              {/* Company cell */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="skel-bar" style={{ width: 90, height: 14 }} />
              </div>
              {/* Email cell */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="skel-bar" style={{ width: 110, height: 12 }} />
              </div>
              {/* Phone cell */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="skel-bar" style={{ width: 90, height: 12 }} />
              </div>
              {/* Status cell */}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="skel-bar" style={{ width: 64, height: 24, borderRadius: 12 }} />
              </div>
              {/* Actions cell */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                <div className="skel-bar" style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div className="skel-bar" style={{ width: 28, height: 28, borderRadius: 6 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, padding: '0 8px' }}>
          <div className="skel-bar" style={{ width: 180, height: 14 }} />
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skel-bar" style={{ width: 36, height: 36, borderRadius: 8 }} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
