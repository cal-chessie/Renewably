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

  return (
    <motion.div style={{ x, y }}>
      <Component
        ref={ref as React.Ref<HTMLAnchorElement & HTMLButtonElement>}
        href={href}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#F3D840] to-[#E5C832] hover:from-[#E5C832] hover:to-[#D4BA28] text-[#1A1A1A] font-bold rounded-full transition-all duration-300 ${isHovered ? "shadow-xl shadow-[#F3D840]/25 scale-105" : "shadow-lg shadow-[#F3D840]/15"} ${className}`}
      >
        {children}
      </Component>
    </motion.div>
  );
}
