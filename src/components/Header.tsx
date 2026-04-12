"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

/* ── Config ── */
const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Services" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

const SCROLL_HIDE_THRESHOLD = 200;
const HEADER_HEIGHT = 72;
const SHRINK_AT = 120;

/* ================================================================
   HEADER — World-class: IntersectionObserver dark-section detection,
   scroll progress bar, auto-hide, spring animations, premium mobile.
   ================================================================ */
export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isOverDark, setIsOverDark] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(HEADER_HEIGHT);
  const [hidden, setHidden] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const pathname = usePathname();

  /* ── IntersectionObserver: detect dark sections ── */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // If ANY observed dark section is intersecting the header zone, we're over dark
        const anyDark = entries.some(
          (e) =>
            e.isIntersecting &&
            e.intersectionRatio > 0,
        );
        setIsOverDark((prev) => {
          // Only update if different to avoid flicker
          // Use a "majority" approach: if the biggest intersecting entry is dark
          if (anyDark && entries.length > 0) {
            // Find the entry with the highest intersection ratio
            const mostVisible = entries.reduce((a, b) =>
              a.intersectionRatio > b.intersectionRatio ? a : b
            );
            if (mostVisible.target.getAttribute("data-theme") === "dark") {
              return true;
            }
            return false;
          }
          return prev;
        });
      },
      {
        // Header height zone at the top of the viewport
        rootMargin: `-${HEADER_HEIGHT - 10}px 0px 0px 0px`,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    // Small delay to let DOM settle after navigation
    const timer = setTimeout(() => {
      document.querySelectorAll("[data-theme]").forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    // Also observe on DOM mutations (for dynamically rendered content)
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll("[data-theme]").forEach((el) => {
        observer.observe(el);
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: false });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname]);

  /* ── Scroll: progress, hide/show, solid state, shrink ── */
  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const sy = window.scrollY;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docH > 0 ? sy / docH : 0;

        setScrollProgress(Math.min(progress, 1));

        // Solid background when scrolled or over dark section
        setHeaderSolid(sy > 20 || !isOverDark);

        // Shrink header slightly after scrolling
        setHeaderHeight(sy > SHRINK_AT ? 60 : HEADER_HEIGHT);

        // Auto-hide on scroll down
        if (sy > SCROLL_HIDE_THRESHOLD) {
          setHidden(sy > lastScrollY.current + 3);
        } else {
          setHidden(false);
        }

        lastScrollY.current = sy;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isOverDark]);

  /* ── Lock body scroll when mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  /* ── Derived styles ── */
  const textColor = isOverDark && !headerSolid
    ? "rgba(255,255,255,0.88)"
    : "rgba(26,26,26,0.78)";

  const textHoverColor = isOverDark && !headerSolid
    ? "rgba(255,255,255,1)"
    : "rgba(26,26,26,1)";

  const logoFilter = isOverDark && !headerSolid
    ? "brightness(0) invert(1)"
    : "brightness(0) invert(0)";

  // Background: solid when scrolled or not over dark; transparent over dark hero
  const bgAlpha = headerSolid ? 0.97 : 0;
  const bgBlur = headerSolid ? 14 : 0;

  return (
    <>
      {/* ── Scroll Progress Bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none">
        <motion.div
          className="h-full bg-[#F3D840]"
          style={{
            width: `${scrollProgress * 100}%`,
            boxShadow: scrollProgress > 0
              ? "0 0 8px rgba(243,216,64,0.4)"
              : "none",
          }}
          transition={{ duration: 0.15, ease: "linear" }}
        />
      </div>

      {/* ── Header ── */}
      <motion.header
        animate={{ y: hidden ? -100 : 0 }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 280,
          mass: 0.8,
        }}
        className="fixed top-0 left-0 right-0 z-[100] will-change-transform"
        style={{
          height: headerHeight,
          backgroundColor: `rgba(255,255,255,${bgAlpha})`,
          backdropFilter: `blur(${bgBlur}px)`,
          WebkitBackdropFilter: `blur(${bgBlur}px)`,
          boxShadow: headerSolid
            ? "0 1px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)"
            : "none",
          transition: "height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full"
          style={{
            transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <div className="flex items-center justify-between h-full">
            {/* ── Logo ── */}
            <Link href="/" className="flex items-center gap-2.5 group relative z-10">
              <div className="transition-transform duration-500 ease-out group-hover:scale-110">
                <Image
                  src="/logo-transparent.png"
                  alt="Renewably"
                  width={headerHeight > 64 ? 36 : 32}
                  height={headerHeight > 64 ? 36 : 32}
                  style={{
                    filter: logoFilter,
                    transition: "filter 0.4s ease, width 0.3s ease, height 0.3s ease",
                  }}
                  priority
                />
              </div>
              <span
                className="text-lg font-extrabold tracking-tight hidden sm:inline"
                style={{
                  color: isOverDark && !headerSolid ? "#fff" : "#1A1A1A",
                  transition: "color 0.4s ease",
                }}
              >
                Renewably
              </span>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden md:flex items-center gap-0.5 relative z-10">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3.5 py-2 text-[13px] font-medium rounded-lg transition-colors duration-300 ease-out group"
                    style={{
                      color: isActive
                        ? "#F3D840"
                        : textColor,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          textHoverColor;
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive)
                        (e.currentTarget as HTMLElement).style.color =
                          textColor;
                    }}
                  >
                    <span className="relative z-10">{link.label}</span>
                    {/* Hover underline */}
                    <span
                      className="absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out"
                      style={{ backgroundColor: "#F3D840" }}
                    />
                    {/* Active dot */}
                    {isActive && (
                      <span
                        className="absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full"
                        style={{ backgroundColor: "#F3D840" }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* ── CTA + Mobile Toggle ── */}
            <div className="flex items-center gap-2 relative z-10">
              {/* Desktop CTA */}
              <Link
                href="/contact"
                className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-[13px] font-bold rounded-full bg-[#F3D840] text-[#1A1A1A] transition-all duration-300 ease-out hover:bg-[#E5C832] hover:scale-[1.04] active:scale-[0.97] hover:shadow-lg hover:shadow-[#F3D840]/25"
              >
                Book a Call
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl transition-all duration-300"
                style={{
                  backgroundColor: mobileOpen
                    ? "rgba(243,216,64,0.15)"
                    : "transparent",
                }}
                aria-label="Toggle menu"
              >
                <div className="w-5 h-[18px] flex flex-col justify-between relative">
                  <span
                    className="absolute left-0 w-5 h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      backgroundColor:
                        mobileOpen || (!isOverDark && headerSolid)
                          ? "#1A1A1A"
                          : "#fff",
                      top: mobileOpen ? "8px" : "0px",
                      transform: mobileOpen
                        ? "rotate(45deg)"
                        : "rotate(0deg)",
                    }}
                  />
                  <span
                    className="absolute left-0 top-[8px] w-5 h-[1.5px] rounded-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      backgroundColor:
                        mobileOpen || (!isOverDark && headerSolid)
                          ? "#1A1A1A"
                          : "#fff",
                      opacity: mobileOpen ? 0 : 1,
                      transform: mobileOpen
                        ? "scaleX(0)"
                        : "scaleX(1)",
                    }}
                  />
                  <span
                    className="absolute left-0 w-5 h-[1.5px] rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{
                      backgroundColor:
                        mobileOpen || (!isOverDark && headerSolid)
                          ? "#1A1A1A"
                          : "#fff",
                      top: mobileOpen ? "8px" : "16px",
                      transform: mobileOpen
                        ? "rotate(-45deg)"
                        : "rotate(0deg)",
                    }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* ── Mobile Menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden"
              onClick={closeMobile}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 280,
                mass: 0.85,
              }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[95] md:hidden overflow-hidden"
            >
              <div className="flex flex-col h-full">
                {/* Panel header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Link
                    href="/"
                    onClick={closeMobile}
                    className="flex items-center gap-2"
                  >
                    <Image
                      src="/logo-transparent.png"
                      alt="Renewably"
                      width={28}
                      height={28}
                    />
                    <span className="text-[15px] font-extrabold tracking-tight text-[#1A1A1A]">
                      Renewably
                    </span>
                  </Link>
                  <button
                    onClick={closeMobile}
                    className="p-2 -mr-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
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

                {/* Nav links */}
                <nav className="flex-1 py-3 overflow-y-auto">
                  {navLinks.map((link, index) => {
                    const isActive =
                      link.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.06 + index * 0.04,
                          duration: 0.35,
                          ease: [0.4, 0, 0.2, 1],
                        }}
                      >
                        <Link
                          href={link.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium transition-colors duration-200 rounded-xl mx-2 ${
                            isActive
                              ? "text-[#1A1A1A] bg-[#F3D840]/10 font-semibold"
                              : "text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-gray-50"
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
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="px-5 pb-6"
                >
                  <Link
                    href="/contact"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-[#F3D840] hover:bg-[#E5C832] text-[#1A1A1A] font-bold text-[15px] rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-[#F3D840]/20 active:scale-[0.98]"
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
                        strokeWidth={2.5}
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
    </>
  );
}
