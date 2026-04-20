'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, createContext, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Toaster } from 'sonner'

interface CRMUser {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
  phone: string | null
}

interface CRMContextType {
  user: CRMUser | null
  loading: boolean
  logout: () => void
}

export const CRMContext = createContext<CRMContextType>({
  user: null,
  loading: true,
  logout: () => {},
})

export function useCRM() {
  return useContext(CRMContext)
}

export function CRMProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  const [user, setUser] = useState<CRMUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Dev/demo user for preview environments where cookies aren't available
  const DEMO_USER: CRMUser = {
    id: 'demo',
    email: 'admin@renewably.ie',
    name: 'Cal Chesters',
    role: 'admin',
    avatar: null,
    phone: '+353 87 395 8424',
  }

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      if (pathname === '/crm/login') {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/crm/auth')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled) setUser(data.user)
          if (!cancelled) setLoading(false)
          return
        }
        // No valid session — redirect to login
        if (!cancelled) {
          router.push('/crm/login')
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    checkAuth()
    return () => { cancelled = true }
  }, [pathname, router])

  const logout = () => {
    fetch('/api/crm/auth', { method: 'DELETE' }).catch(() => {})
    setUser(null)
    router.push('/crm/login')
  }

  return (
    <CRMContext.Provider value={{ user, loading, logout }}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </CRMContext.Provider>
  )
}
