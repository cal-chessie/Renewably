export default function TasksLoading() {
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
            <div className="skel-bar" style={{ width: 200, height: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="skel" style={{ width: 130, height: 40 }} />
            <div className="skel" style={{ width: 160, height: 40 }} />
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skel-bar" style={{ width: 70, height: 36, borderRadius: 8 }} />
          ))}
        </div>

        {/* Task List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="skel" key={i} style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Checkbox */}
              <div className="skel-bar" style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0 }} />

              {/* Priority indicator */}
              <div className="skel-bar" style={{ width: 4, height: 32, borderRadius: 2, flexShrink: 0 }} />

              {/* Task info */}
              <div style={{ flex: 1 }}>
                <div className="skel-bar" style={{ width: `${45 + ((i * 7) % 25)}%`, height: 14, marginBottom: 6 }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div className="skel-bar" style={{ width: 80, height: 10 }} />
                  <div className="skel-bar" style={{ width: 60, height: 10 }} />
                </div>
              </div>

              {/* Assignee */}
              <div className="skel-bar" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />

              {/* Due date */}
              <div className="skel-bar" style={{ width: 80, height: 12, flexShrink: 0 }} />

              {/* Status */}
              <div className="skel-bar" style={{ width: 72, height: 26, borderRadius: 13, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
