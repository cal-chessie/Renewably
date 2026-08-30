"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/**
 * Tiny IntersectionObserver hook: attaches a ref and reports the first time
 * the element enters the viewport, then disconnects. Replaces framer-motion's
 * useInView for lazy-render / reveal gating without the framer runtime.
 */
export function useInViewOnce<T extends Element = HTMLDivElement>(
  rootMargin = "0px",
): [RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return [ref, inView];
}
