'use client'

import { CRMProvider, useCRM } from '@/components/crm/CRMProvider'
import { AIAssistant } from '@/components/crm/AIAssistant'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Activity,
  CheckSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const navItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/contacts', label: 'Contacts', icon: Users },
  { href: '/crm/companies', label: 'Companies', icon: Building2 },
  { href: '/crm/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/crm/activities', label: 'Activities', icon: Activity },
  { href: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useCRM()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image
            src="/logo-transparent.png"
            alt="Renewably"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Renewably</h1>
            <p className="text-white/40 text-xs">CRM Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/crm'
              ? pathname === '/crm'
              : pathname.startsWith(item.href)

          return (
            <button
              key={item.href}
              onClick={() => {
                window.location.href = item.href
                onNavigate?.()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[#F3D840]/10 text-[#F3D840]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-[#F3D840]' : ''}`} />
              {item.label}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-[#F3D840]"
                />
              )}
            </button>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-white/10">
        {user && (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[#F3D840] text-[#374151] text-sm font-bold">
                {user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.name}</p>
              <p className="text-white/40 text-xs truncate">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-white/40 hover:text-white hover:bg-white/10 h-8 w-8"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function CRMShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on login page
  if (pathname === '/crm/login') {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-[#1A1A1A] shrink-0 border-r border-[#F3D840]/10">
        <SidebarNav />
      </aside>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 z-50 p-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-[#F3D840] text-[#1A1A1A] hover:bg-[#E5C832] h-10 w-10 rounded-lg shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-[#1A1A1A] border-0">
            <SidebarNav />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="min-h-full">{children}</div>
      </main>

      {/* AI Assistant — floating chat widget */}
      <AIAssistant />
    </div>
  )
}

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <CRMShell>{children}</CRMShell>
    </CRMProvider>
  )
}
