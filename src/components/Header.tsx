"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home", num: "01" },
  { href: "/about", label: "About Us", num: "02" },
  { href: "/workforce", label: "Workforce", num: "03" },
  { href: "/blog", label: "Blog", num: "04" },
  { href: "/contact", label: "Contact Us", num: "05" },
];

/* ─── Spring config ─── */
const menuSpring = { type: "spring" as const, damping: 30, stiffness: 200, mass: 0.8 };

/* ─── Tap-scale wrapper for mobile ─── */
function TapLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
      <Link {...props}>{children}</Link>
    </motion.div>
  );
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  /* Track mouse position inside the menu for the glow effect */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 25 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none">
        <motion.div className="h-full bg-[#F3D840]" style={{ width: progressWidth }} />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[100] h-16 md:h-[72px]">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full">
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              <img
                src="/logo-transparent.png"
                alt="Renewably"
                width={44}
                height={44}
                style={{ filter: 'brightness(0) invert(1)', transition: 'transform 0.3s' }}
              />
              <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                Renewably
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-2 text-[13.5px] font-medium rounded-lg group transition-colors duration-200 ${
                      isActive ? "text-[#F3D840]" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                    <span className="absolute bottom-1 left-4 right-4 h-[1.5px] rounded-full bg-[#F3D840] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                    {isActive && (
                      <span className="absolute bottom-1 left-4 right-4 h-[1.5px] rounded-full bg-[#F3D840]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              {/* Desktop CTA */}
              <Link
                href="/contact"
                className="hidden md:inline-flex items-center gap-2.5 rounded-full font-bold transition-all duration-200 active:scale-[0.97] shrink-0"
                style={{ padding: "7px 18px", fontSize: 13, letterSpacing: "0.02em", backgroundColor: "#F3D840", color: "#1A1A1A" }}
              >
                Book a Call
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              {/* Mobile Hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden relative z-[110] p-2 rounded-xl"
                aria-label="Toggle menu"
              >
                <div className="w-6 h-[20px] flex flex-col justify-between relative">
                  <motion.span
                    className="absolute left-0 w-full h-[2px] rounded-full bg-white"
                    animate={{
                      top: mobileOpen ? 9 : 0,
                      rotate: mobileOpen ? 45 : 0,
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.span
                    className="absolute left-0 top-[9px] w-full h-[2px] rounded-full bg-white"
                    animate={{
                      opacity: mobileOpen ? 0 : 1,
                      scaleX: mobileOpen ? 0 : 1,
                    }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  />
                  <motion.span
                    className="absolute left-0 w-full h-[2px] rounded-full bg-white"
                    animate={{
                      top: mobileOpen ? 9 : 18,
                      rotate: mobileOpen ? -45 : 0,
                    }}
                    transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
         MOBILE MENU — Full-screen immersive overlay
         ═══════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[100] md:hidden"
              style={{ backgroundColor: '#0A0A0A' }}
            >
              {/* Subtle grain texture */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.03,
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                  pointerEvents: 'none',
                }}
              />

              {/* Mouse-following glow */}
              <motion.div
                style={{
                  position: 'absolute',
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(243,216,64,0.07) 0%, transparent 70%)',
                  pointerEvents: 'none',
                  x: springX,
                  y: springY,
                  translateX: -150,
                  translateY: -150,
                }}
              />

              {/* Content container */}
              <div
                ref={menuRef}
                onMouseMove={handleMouseMove}
                className="relative flex flex-col h-full"
              >
                {/* ── Top bar ── */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    paddingTop: 56,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src="/robot-mobile-hero.png"
                      alt=""
                      width={28}
                      height={28}
                      style={{ borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.04em' }}>
                      Menu
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '6px 14px',
                      borderRadius: 9999,
                      border: '1px solid rgba(243,216,64,0.2)',
                      backgroundColor: 'rgba(243,216,64,0.08)',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#F3D840', letterSpacing: '0.06em' }}>
                      hello@renewably.ie
                    </span>
                  </div>
                </motion.div>

                {/* ── Nav Links ── */}
                <nav
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 20px',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    {navLinks.map((link, index) => {
                      const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                      const isHovered = hoveredLink === link.href;

                      return (
                        <motion.div
                          key={link.href}
                          initial={{ x: -40, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          exit={{ x: -40, opacity: 0 }}
                          transition={{
                            delay: 0.15 + index * 0.06,
                            duration: 0.5,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          onMouseEnter={() => setHoveredLink(link.href)}
                          onMouseLeave={() => setHoveredLink(null)}
                          style={{ position: 'relative' }}
                        >
                          <TapLink
                            href={link.href}
                            onClick={closeMobile}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 16,
                              padding: '18px 0',
                              textDecoration: 'none',
                              position: 'relative',
                            }}
                          >
                            {/* Number */}
                            <motion.span
                              animate={{
                                opacity: isHovered || isActive ? 1 : 0.3,
                                x: isHovered ? 0 : -4,
                              }}
                              transition={{ duration: 0.3 }}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                color: '#F3D840',
                                minWidth: 24,
                                textAlign: 'right',
                              }}
                            >
                              {link.num}
                            </motion.span>

                            {/* Label */}
                            <motion.span
                              animate={{
                                x: isHovered ? 8 : 0,
                                color: isActive
                                  ? '#F3D840'
                                  : isHovered
                                    ? '#fff'
                                    : 'rgba(255,255,255,0.6)',
                              }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              style={{
                                fontSize: 32,
                                fontWeight: 800,
                                letterSpacing: '-0.03em',
                                lineHeight: 1.2,
                                position: 'relative',
                              }}
                            >
                              {link.label}
                              {/* Underline effect */}
                              <motion.span
                                animate={{
                                  scaleX: isHovered || isActive ? 1 : 0,
                                  originX: 0,
                                }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                style={{
                                  position: 'absolute',
                                  bottom: -2,
                                  left: 0,
                                  right: 0,
                                  height: 3,
                                  borderRadius: 2,
                                  background: 'linear-gradient(90deg, #F3D840, #E5C832)',
                                  transformOrigin: 'left',
                                }}
                              />
                            </motion.span>

                            {/* Arrow */}
                            <motion.svg
                              animate={{
                                opacity: isHovered ? 1 : 0,
                                x: isHovered ? 0 : -8,
                              }}
                              transition={{ duration: 0.3 }}
                              width="20"
                              height="20"
                              fill="none"
                              stroke="#F3D840"
                              viewBox="0 0 24 24"
                              strokeWidth={2.5}
                              style={{ flexShrink: 0, marginLeft: 'auto' }}
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                            </motion.svg>
                          </TapLink>

                          {/* Divider */}
                          {index < navLinks.length - 1 && (
                            <motion.div
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: 0.3 + index * 0.06, duration: 0.5 }}
                              style={{
                                height: 1,
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)',
                                marginLeft: 40,
                              }}
                            />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </nav>

                {/* ── Bottom Section ── */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 30, opacity: 0 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  style={{ padding: '0 20px 40px' }}
                >
                  {/* CTA Button */}
                  <motion.a
                    href="/contact"
                    onClick={closeMobile}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '16px 24px',
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #F3D840 0%, #E5C832 100%)',
                      boxShadow: '0 8px 32px rgba(243,216,64,0.25), 0 0 0 1px rgba(243,216,64,0.3)',
                      textDecoration: 'none',
                      marginBottom: 20,
                    }}
                  >
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.01em' }}>
                      Book a Call
                    </span>
                    <svg width="18" height="18" fill="none" stroke="#1A1A1A" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7v10" />
                    </svg>
                  </motion.a>

                  {/* Contact row */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 24,
                  }}>
                    <a
                      href="tel:+353873958424"
                      onClick={closeMobile}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: 'none',
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'color 0.2s',
                      }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                      </svg>
                      Call
                    </a>
                    <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <a
                      href="mailto:hello@renewably.ie"
                      onClick={closeMobile}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        textDecoration: 'none',
                        color: 'rgba(255,255,255,0.35)',
                        fontSize: 13,
                        fontWeight: 500,
                        transition: 'color 0.2s',
                      }}
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      Email
                    </a>
                    <div style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 500 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Mon-Fri 9-6
                    </span>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
