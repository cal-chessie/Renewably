"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { motion, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
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
  textDecoration: "none",
  transition: "all 0.3s ease",
  boxShadow: "0 10px 25px rgba(243,216,64,0.15)",
};

export default function MagneticButton({
  children,
  className = "",
  href,
  onClick,
  strength = 0.3,
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);

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
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const Component = href ? "a" : "button";

  const hoverStyle = isHovered
    ? { ...btnStyle, boxShadow: "0 20px 40px rgba(243,216,64,0.25)", transform: "scale(1.05)" }
    : btnStyle;

  return (
    <motion.div style={{ x, y }}>
      <Component
        ref={ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>}
        href={href}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={hoverStyle}
        className={className}
      >
        {children}
      </Component>
    </motion.div>
  );
}
