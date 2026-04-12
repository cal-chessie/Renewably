"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {/* ── Floating Button ── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[150] w-14 h-20 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden group"
        style={{
          boxShadow: "0 4px 24px rgba(243,216,64,0.45), 0 0 0 0 rgba(243,216,64,0.3)",
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={
          !open
            ? {
                boxShadow: [
                  "0 4px 24px rgba(243,216,64,0.45), 0 0 0 0 rgba(243,216,64,0.3)",
                  "0 4px 24px rgba(243,216,64,0.45), 0 0 0 10px rgba(243,216,64,0)",
                ],
              }
            : {}
        }
        transition={
          !open
            ? {
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeOut",
                },
              }
            : { duration: 0.2 }
        }
        aria-label="Open chat"
      >
        {/* Robot image - tight crop, no background */}
        <Image
          src="/robot-2-cropped.png"
          alt="Chat with Renewably"
          width={56}
          height={80}
          className={`relative z-[1] w-full h-full object-cover transition-transform duration-300 ${
            open ? "scale-90" : "group-hover:scale-110"
          }`}
          priority
        />
      </motion.button>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
            className="fixed bottom-24 right-5 z-[150] w-[340px] sm:w-[370px] rounded-2xl overflow-hidden shadow-2xl"
            style={{
              boxShadow: "0 12px 48px rgba(0,0,0,0.2), 0 0 0 1px rgba(243,216,64,0.15)",
            }}
          >
            {/* ── Header ── */}
            <div className="bg-[#0A0A0A] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#F3D840]/15 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/robot-2-cropped.png"
                    alt=""
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Renewably AI</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/50 text-xs">Online now</span>
                  </div>
                </div>
              </div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Body ── */}
            <div className="bg-white px-5 py-6">
              <p className="text-[#1A1A1A] text-sm leading-relaxed mb-6">
                Hey! 👋 How can we help you today? Choose how you&apos;d like to get in touch.
              </p>

              <div className="space-y-3">
                {/* AI Chat Option */}
                <motion.a
                  href="/contact"
                  onClick={close}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3.5 p-4 rounded-xl bg-[#F3D840]/8 border border-[#F3D840]/20 hover:bg-[#F3D840]/15 hover:border-[#F3D840]/40 transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F3D840] flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-[#F3D840]/20 transition-shadow">
                    <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">Chat with AI</p>
                    <p className="text-[#535353] text-xs">Get instant answers about our AI workforce</p>
                  </div>
                  <svg className="w-4 h-4 text-[#535353] ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.a>

                {/* WhatsApp Option */}
                <motion.a
                  href="https://wa.me/353873958424?text=Hi%20Renewably%2C%20I%27d%20like%20to%20learn%20more%20about%20your%20AI%20workforce."
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3.5 p-4 rounded-xl bg-green-500/8 border border-green-500/20 hover:bg-green-500/15 hover:border-green-500/40 transition-all duration-200 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0 group-hover:shadow-lg group-hover:shadow-green-500/20 transition-shadow">
                    <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[#1A1A1A] font-bold text-sm">WhatsApp</p>
                    <p className="text-[#535353] text-xs">Message us directly on WhatsApp</p>
                  </div>
                  <svg className="w-4 h-4 text-[#535353] ml-auto shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.a>
              </div>

              {/* Footer note */}
              <p className="text-center text-[#999] text-[11px] mt-5 leading-relaxed">
                Typically replies within minutes during business hours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
