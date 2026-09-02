"use client";

import { useRef, useState, type ReactNode, type MouseEvent, type ElementType } from "react";
import { motion, useSpring } from "framer-motion";
import Link from "next/link";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  href?: string;
  onClick?: () => void;
  strength?: number;
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: "12px 28px",
  fontSize: 15,
  fontWeight: 700,
  letterSpacing: "0.02em",
  color: "#1A1A1A",
  background: "linear-gradient(to right, #F3D840, #E5C832)",
  borderRadius: 9999,
  border: "none",
  cursor: "pointer",
  position: "relative",
  overflow: "hidden",
  isolation: "isolate",
  textDecoration: "none",
  transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
  boxShadow: "0 10px 25px rgba(243,216,64,0.15)",
};

export default function MagneticButton({
  children,
  className = "",
  style: customStyle,
  href,
  onClick,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  // Local pointer position, as percentages, for the cursor-follow glow.
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const x = useSpring(0, { stiffness: 300, damping: 20 });
  const y = useSpring(0, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    x.set(deltaX);
    y.set(deltaY);
    setGlow({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  // Internal routes go through next/link for client-side navigation and
  // prefetch. External URLs, mailto and in-page hashes stay a plain anchor.
  const isInternalLink = !!href && href.startsWith("/");
  const Component: ElementType = href ? (isInternalLink ? Link : "a") : "button";

  const mergedStyle = customStyle ? { ...btnStyle, ...customStyle } : btnStyle;

  const hoverStyle = isHovered
    ? { ...mergedStyle, boxShadow: "0 20px 40px rgba(243,216,64,0.25)", transform: "scale(1.05)" }
    : mergedStyle;

  return (
    <motion.div style={{ x, y }} whileTap={{ scale: 0.98 }}>
      <Component
        ref={ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>}
        href={href}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={hoverStyle}
        className={`magnetic-cta ${className}`.trim()}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            pointerEvents: "none",
            background: `radial-gradient(circle 80px at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.55), transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            mixBlendMode: "soft-light",
          }}
        />
        <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 12 }}>
          {children}
        </span>
      </Component>
    </motion.div>
  );
}
