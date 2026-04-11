'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Toaster } from 'sonner'

interface CRMUser {
  id: string
  email: string
  name: string
  role: string
  avatar: string | null
}

interface CRMContextType {
  user: CRMUser | null
  loading: boolean
  logout: () => Promise<void>
}

import { createContext, useContext } from 'react'
export const CRMContext = createContext<CRMContextType>({
  user: null,
  loading: true,
  logout: async () => {},
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

  useEffect(() => {
    async function checkAuth() {
      // Skip auth check for login page
      if (pathname === '/crm/login') {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/crm/auth')
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
        } else {
          router.push('/crm/login')
        }
      } catch {
        router.push('/crm/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  const logout = async () => {
    try {
      await fetch('/api/crm/auth', { method: 'DELETE' })
    } catch {
      // ignore
    }
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
