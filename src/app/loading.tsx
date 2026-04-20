export default function PublicLoading() {
  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
        .pub-skel {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        .pub-skel-text {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Fixed header skeleton (matches 64px height) */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          background: "rgba(10, 10, 10, 0.85)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(16px, 5vw, 32px)",
        }}
      >
        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="pub-skel" style={{ width: 44, height: 44, borderRadius: 12 }} />
          <div className="pub-skel-text" style={{ width: 100, height: 20 }} />
        </div>
        {/* Nav placeholder */}
        <div style={{ display: "flex", gap: 8 }}>
          {[80, 60, 80, 50, 80].map((w, i) => (
            <div key={i} className="pub-skel-text" style={{ width: w, height: 14, borderRadius: 6 }} />
          ))}
        </div>
      </div>

      {/* Page content skeleton */}
      <div style={{ background: "#0A0A0A", minHeight: "100vh", paddingTop: 64 }}>
        {/* Hero section */}
        <div
          style={{
            padding: "clamp(60px, 10vw, 120px) clamp(16px, 5vw, 48px)",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {/* Hero text blocks */}
          <div style={{ maxWidth: 640, marginBottom: 40 }}>
            <div className="pub-skel-text" style={{ width: "40%", height: 14, marginBottom: 16 }} />
            <div className="pub-skel-text" style={{ width: "85%", height: "clamp(32px, 5vw, 52px)", marginBottom: 16, borderRadius: 8 }} />
            <div className="pub-skel-text" style={{ width: "70%", height: "clamp(32px, 5vw, 52px)", marginBottom: 24, borderRadius: 8 }} />
            <div className="pub-skel-text" style={{ width: "55%", height: 14, marginBottom: 12 }} />
            <div className="pub-skel-text" style={{ width: "45%", height: 14, marginBottom: 32 }} />
            <div style={{ display: "flex", gap: 12 }}>
              <div className="pub-skel" style={{ width: 160, height: 48, borderRadius: 14 }} />
              <div className="pub-skel" style={{ width: 140, height: 48, borderRadius: 14 }} />
            </div>
          </div>
        </div>

        {/* Features / cards section */}
        <div
          style={{
            padding: "0 clamp(16px, 5vw, 48px) clamp(60px, 8vw, 100px)",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div className="pub-skel-text" style={{ width: 200, height: 20, margin: "0 auto 40px" }} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="pub-skel" style={{ padding: 28, borderRadius: 16 }}>
                <div className="pub-skel-text" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 20 }} />
                <div className="pub-skel-text" style={{ width: "65%", height: 18, marginBottom: 12 }} />
                <div className="pub-skel-text" style={{ width: "90%", height: 12, marginBottom: 8 }} />
                <div className="pub-skel-text" style={{ width: "75%", height: 12, marginBottom: 8 }} />
                <div className="pub-skel-text" style={{ width: "50%", height: 12 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial / CTA section */}
        <div
          style={{
            padding: "clamp(40px, 6vw, 80px) clamp(16px, 5vw, 48px)",
            maxWidth: 700,
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div className="pub-skel-text" style={{ width: "60%", height: 24, margin: "0 auto 20px" }} />
          <div className="pub-skel-text" style={{ width: "80%", height: 14, margin: "0 auto 10px" }} />
          <div className="pub-skel-text" style={{ width: "65%", height: 14, margin: "0 auto 28px" }} />
          <div className="pub-skel" style={{ width: 180, height: 48, borderRadius: 14, margin: "0 auto" }} />
        </div>
      </div>

      {/* Footer skeleton */}
      <div
        style={{
          background: "#0A0A0A",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          padding: "clamp(32px, 5vw, 60px) clamp(16px, 5vw, 48px)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 24,
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i}>
              <div className="pub-skel-text" style={{ width: 80, height: 12, marginBottom: 16 }} />
              {[100, 80, 90, 70].slice(0, i === 0 ? 2 : 4).map((w, j) => (
                <div
                  key={j}
                  className="pub-skel-text"
                  style={{ width: w, height: 11, marginBottom: 10 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
