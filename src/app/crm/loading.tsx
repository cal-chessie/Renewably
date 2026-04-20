export default function CRMLoading() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: 20,
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        border: '3px solid #1A1A1A',
        borderTopColor: '#F3D840',
        animation: 'crm-spin 0.8s linear infinite',
      }} />
      <div style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: 500,
      }}>
        Loading...
      </div>
      <style>{`
        @keyframes crm-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
