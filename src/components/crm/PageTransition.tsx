'use client'

import { ReactNode, useEffect, useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'

interface PageTransitionProps {
  children: ReactNode
  key?: string
}

export default function PageTransition({ children, key: propKey }: PageTransitionProps) {
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [prevPathname, setPrevPathname] = useState(pathname)

  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsTransitioning(true)
      // Allow the fade-out to complete before swapping content
      const timer = setTimeout(() => {
        startTransition(() => {
          setPrevPathname(pathname)
          setIsTransitioning(false)
        })
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [pathname, prevPathname, startTransition])

  const transitionKey = propKey ?? pathname

  return (
    <div
      key={transitionKey}
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? 'translateY(8px)' : 'translateY(0)',
        transition: 'opacity 0.15s ease, transform 0.15s ease',
      }}
    >
      {children}
    </div>
  )
}
