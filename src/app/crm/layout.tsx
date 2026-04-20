'use client'

import dynamic from 'next/dynamic'

const CRMLayout = dynamic(() => import('./crm-shell').then(m => ({ default: m.default })), {
  ssr: false,
})

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CRMLayout>{children}</CRMLayout>
}
