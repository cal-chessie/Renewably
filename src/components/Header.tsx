"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/workforce", label: "Workforce" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact Us" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

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
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo-transparent.png"
                alt="Renewably"
                width={52}
                height={52}
                className="transition-transform duration-300 group-hover:scale-110 brightness-0 invert"
                priority
              />
              <span className="text-[22px] font-extrabold tracking-tight text-white hidden sm:inline">
                Renewably
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3.5 py-2 text-[13px] font-medium rounded-lg group transition-colors duration-200 ${
                      isActive ? "text-[#F3D840]" : "text-white/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                    <span className="absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full bg-[#F3D840] origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out" />
                    {isActive && (
                      <span className="absolute bottom-1 left-3.5 right-3.5 h-[1.5px] rounded-full bg-[#F3D840]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/contact"
                className="hidden md:inline-flex items-center gap-2 px-5 py-2 text-[13px] font-bold rounded-full bg-[#F3D840] text-[#1A1A1A] hover:bg-[#E5C832] transition-all duration-200 hover:shadow-lg hover:shadow-[#F3D840]/30 active:scale-[0.97]"
              >
                Book a Call
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-xl"
                aria-label="Toggle menu"
              >
                <div className="w-5 h-[18px] flex flex-col justify-between relative">
                  <span
                    className="absolute left-0 w-5 h-[1.5px] rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ top: mobileOpen ? "8px" : "0px", transform: mobileOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                  />
                  <span
                    className="absolute left-0 top-[8px] w-5 h-[1.5px] rounded-full bg-white transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ opacity: mobileOpen ? 0 : 1, transform: mobileOpen ? "scaleX(0)" : "scaleX(1)" }}
                  />
                  <span
                    className="absolute left-0 w-5 h-[1.5px] rounded-full bg-white transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ top: mobileOpen ? "8px" : "16px", transform: mobileOpen ? "rotate(-45deg)" : "rotate(0deg)" }}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] md:hidden"
              onClick={closeMobile}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 280, mass: 0.85 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[95] md:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
                    <Image src="/logo-transparent.png" alt="Renewably" width={28} height={28} />
                    <span className="text-[15px] font-extrabold tracking-tight text-[#1A1A1A]">Renewably</span>
                  </Link>
                  <button onClick={closeMobile} className="p-2 -mr-2 rounded-xl hover:bg-gray-100 transition-colors" aria-label="Close menu">
                    <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="flex-1 py-3">
                  {navLinks.map((link, index) => {
                    const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <motion.div key={link.href} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + index * 0.04, duration: 0.3 }}>
                        <Link
                          href={link.href}
                          onClick={closeMobile}
                          className={`flex items-center gap-3 px-5 py-3.5 text-[15px] font-medium transition-colors duration-200 rounded-xl mx-2 ${
                            isActive ? "text-[#1A1A1A] bg-[#F3D840]/10 font-semibold" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A] hover:bg-gray-50"
                          }`}
                        >
                          {link.label}
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#F3D840] ml-auto" />}
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.25 }} className="px-5 pb-6">
                  <Link
                    href="/contact"
                    onClick={closeMobile}
                    className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-[#F3D840] hover:bg-[#E5C832] text-[#1A1A1A] font-bold text-[15px] rounded-full transition-all duration-200 active:scale-[0.98]"
                  >
                    Book a Call
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
