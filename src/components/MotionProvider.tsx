'use client'

import { LazyMotion, domAnimation } from 'framer-motion'

/**
 * Wraps the app with framer-motion LazyMotion.
 * This defers all animation style injection until after hydration,
 * preventing "attributes didn't match" hydration warnings from
 * motion.* elements with initial props.
 *
 * Uses domAnimation (smaller bundle) since we don't need layout animations.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      {children}
    </LazyMotion>
  )
}
