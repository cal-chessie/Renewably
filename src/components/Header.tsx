"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [headerShadow, setHeaderShadow] = useState(0);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  // Smooth interpolated header background & shadow based on scroll position
  useMotionValueEvent(scrollY, "change", (latest) => {
    const opacity = Math.min(latest / 120, 1); // 0→1 over 0–120px
    const shadow = Math.min(Math.max((latest - 40) / 80, 0), 1); // 0→1 over 40–120px
    setHeaderOpacity(opacity);
    setHeaderShadow(shadow);

    // Auto-hide on scroll down, show on scroll up (after 200px)
    if (latest > 200) {
      setHidden(latest > lastScrollY.current + 5);
    } else {
      setHidden(false);
    }
    lastScrollY.current = latest;
  });

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const bgOpacity = headerOpacity;
  const bgBlur = headerOpacity * 12;
  const shadowIntensity = headerShadow;

  return (
    <motion.header
      animate={{ y: hidden ? -100 : 0 }}
      transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      className="fixed top-0 left-0 right-0 z-[100] will-change-transform"
      style={{
        backgroundColor: `rgba(255,255,255,${bgOpacity * 0.97})`,
        backdropFilter: `blur(${bgBlur}px)`,
        WebkitBackdropFilter: `blur(${bgBlur}px)`,
        boxShadow: shadowIntensity > 0
          ? `0 ${1 + shadowIntensity * 3}px ${8 + shadowIntensity * 12}px rgba(0,0,0,${shadowIntensity * 0.08})`
          : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative transition-transform duration-500 ease-out group-hover:scale-110">
              <Image
                src="/logo-transparent.png"
                alt="Renewably"
                width={38}
                height={38}
                className="relative z-10 transition-all duration-500"
                style={{
                  filter: headerOpacity < 0.5
                    ? "brightness(0) invert(1)"
                    : "brightness(0) invert(0)",
                  opacity: 1,
                }}
                priority
              />
            </div>
            <span
              className="text-lg font-extrabold tracking-tight transition-colors duration-500 ease-out"
              style={{
                color: headerOpacity < 0.5
                  ? "rgba(255,255,255,1)"
                  : "rgba(26,26,26,1)",
              }}
            >
              Renewably
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ease-out group"
                  style={{
                    color: isActive
                      ? (headerOpacity < 0.5 ? "#F3D840" : "#1A1A1A")
                      : headerOpacity < 0.5
                        ? "rgba(255,255,255,0.8)"
                        : "rgba(26,26,26,0.7)",
                  }}
                >
                  <span className="relative z-10">{link.label}</span>
                  {/* Hover underline */}
                  <span
                    className="absolute bottom-1.5 left-4 right-4 h-[2px] rounded-full bg-[#F3D840] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                  />
                  {/* Active indicator */}
                  {isActive && (
                    <span className="absolute bottom-1.5 left-4 right-4 h-[2px] rounded-full bg-[#F3D840]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA + Mobile Toggle */}
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden md:inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-full bg-[#F3D840] text-[#1A1A1A] transition-all duration-300 ease-out hover:bg-[#E5C832] hover:scale-[1.03] active:scale-[0.98] hover:shadow-lg hover:shadow-[#F3D840]/20"
            >
              Book a Call
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl transition-colors duration-300"
              style={{
                backgroundColor: mobileOpen ? "rgba(0,0,0,0.05)" : "transparent",
              }}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-5 flex flex-col justify-between relative">
                <span
                  className="absolute left-0 w-6 h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    backgroundColor: mobileOpen || headerOpacity > 0.5 ? "#1A1A1A" : "#fff",
                    top: mobileOpen ? "9px" : "0px",
                    transform: mobileOpen ? "rotate(45deg)" : "rotate(0deg)",
                  }}
                />
                <span
                  className="absolute left-0 top-[9px] w-6 h-[1.5px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    backgroundColor: mobileOpen || headerOpacity > 0.5 ? "#1A1A1A" : "#fff",
                    opacity: mobileOpen ? 0 : 1,
                    transform: mobileOpen ? "scaleX(0)" : "scaleX(1)",
                  }}
                />
                <span
                  className="absolute left-0 w-6 h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  style={{
                    backgroundColor: mobileOpen || headerOpacity > 0.5 ? "#1A1A1A" : "#fff",
                    top: mobileOpen ? "9px" : "18px",
                    transform: mobileOpen ? "rotate(-45deg)" : "rotate(0deg)",
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[-1] md:hidden"
              onClick={closeMobile}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.9 }}
              className="fixed top-0 right-0 bottom-0 w-[300px] bg-white shadow-2xl z-50 md:hidden overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Mobile panel header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100/80">
                  <Link
                    href="/"
                    onClick={closeMobile}
                    className="flex items-center gap-2"
                  >
                    <Image
                      src="/logo-transparent.png"
                      alt="Renewably"
                      width={32}
                      height={32}
                    />
                    <span className="text-base font-extrabold tracking-tight text-[#1A1A1A]">
                      Renewably
                    </span>
                  </Link>
                  <button
                    onClick={closeMobile}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                    aria-label="Close menu"
                  >
                    <svg
                      className="w-5 h-5 text-[#1A1A1A]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Nav links with stagger */}
                <nav className="flex-1 py-4 overflow-y-auto">
                  {navLinks.map((link, index) => {
                    const isActive = pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.08 + index * 0.04,
                          duration: 0.35,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 px-6 py-4 text-[15px] font-medium transition-colors duration-200 rounded-xl mx-2 ${
                            isActive
                              ? "text-[#1A1A1A] bg-[#F3D840]/10 font-semibold"
                              : "text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-gray-50"
                          }`}
                        >
                          {link.label}
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F3D840] ml-auto" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Mobile CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                  className="p-6 border-t border-gray-100/80"
                >
                  <Link
                    href="/contact"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-[#F3D840] hover:bg-[#E5C832] text-[#1A1A1A] font-bold rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-[#F3D840]/20 active:scale-[0.98]"
                  >
                    Book a Call
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
