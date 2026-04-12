"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function LoadingScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F3D840",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease-out",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <Image
          src="/logo-transparent.png"
          alt="Renewably"
          width={80}
          height={80}
          style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.15))" }}
        />
        <span style={{ fontSize: 20, fontWeight: 700, color: "#1A1A1A" }}>
          Renewably
        </span>
      </div>
    </div>
  );
}
