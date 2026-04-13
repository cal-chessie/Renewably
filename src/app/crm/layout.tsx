'use client'

import { CRMProvider, useCRM } from '@/components/crm/CRMProvider'
import { AIAssistant } from '@/components/crm/AIAssistant'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Kanban,
  Activity,
  CheckSquare,
  FileText,
  Zap,
  LogOut,
  Menu,
  Calendar as CalendarIcon,
  BarChart3,
  Receipt,
  Sun,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import Image from 'next/image'

// ============================================================================
// CONSTANTS
// ============================================================================
const DARK = '#0A0A0A'
const DARK2 = '#1A1A1A'
const YELLOW = '#F3D840'
const YELLOW_MUTED = '#C79828'

const navItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/installers', label: 'Installers', icon: Sun },
  { href: '/crm/contacts', label: 'People', icon: Users },
  { href: '/crm/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/crm/activities', label: 'Activities', icon: Activity },
  { href: '/crm/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/crm/proposals', label: 'Proposals', icon: FileText },
  { href: '/crm/meetings', label: 'Calendar', icon: CalendarIcon },
  { href: '/crm/workflows', label: 'Automations', icon: Zap },
  { href: '/crm/reports', label: 'Reports', icon: BarChart3 },
  { href: '/crm/invoices', label: 'Invoices', icon: Receipt },
]

// ============================================================================
// NAV ITEM COMPONENT
// ============================================================================
function NavItem({ item, isActive, onNavigate }: {
  item: typeof navItems[0]
  isActive: boolean
  onNavigate?: () => void
}) {
  return (
    <button
      onClick={() => {
        window.location.href = item.href
        onNavigate?.()
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 500,
        color: isActive ? YELLOW : 'rgba(255,255,255,0.55)',
        background: isActive ? `${YELLOW}15` : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = '#FFF'
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.color = 'rgba(255,255,255,0.55)'
          e.currentTarget.style.background = 'transparent'
        }
      }}
    >
      <item.icon size={20} style={{ color: isActive ? YELLOW : undefined, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {isActive && (
        <motion.div
          layoutId="activeNav"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: YELLOW,
          }}
        />
      )}
    </button>
  )
}

// ============================================================================
// SIDEBAR NAV COMPONENT
// ============================================================================
function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useCRM()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image
            src="/logo-transparent.png"
            alt="Renewably"
            width={36}
            height={36}
            style={{ borderRadius: 8 }}
          />
          <div>
            <div style={{ color: '#FFF', fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>Renewably</div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>Installer CRM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const isActive =
            item.href === '/crm'
              ? pathname === '/crm'
              : pathname.startsWith(item.href)

          return <NavItem key={item.href} item={item} isActive={isActive} onNavigate={onNavigate} />
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar style={{ width: 36, height: 36 }}>
              <AvatarFallback style={{ background: YELLOW, color: '#374151', fontSize: 13, fontWeight: 700 }}>
                {user.name
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#FFF', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.35)',
                transition: 'all 0.2s',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#FFF'
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.35)'
                e.currentTarget.style.background = 'transparent'
              }}
              aria-label="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// CRM SHELL (sidebar + main content)
// ============================================================================
function CRMShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Don't show sidebar on login page
  if (pathname === '/crm/login') {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F9FAFB' }}>
      {/* Desktop Sidebar */}
      <aside className="crm-sidebar-desktop"
        style={{
          width: 256,
          flexShrink: 0,
          background: DARK2,
          borderRight: `1px solid ${YELLOW}15`,
          flexDirection: 'column',
        }}
      >
        <SidebarNav />
      </aside>

      {/* Mobile Sidebar Toggle */}
      <div className="crm-mobile-toggle"
        style={{ position: 'fixed', top: 8, left: 8, zIndex: 50, padding: 8 }}
      >
        <Sheet>
          <SheetTrigger asChild>
            <button
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                border: 'none',
                background: YELLOW,
                color: DARK,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                padding: 0,
              }}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" style={{ padding: 0, width: 256, background: DARK2, border: 'none' }}>
            <SidebarNav />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ minHeight: '100%' }}>{children}</div>
      </main>

      {/* AI Assistant floating chat widget */}
      <AIAssistant />
    </div>
  )
}

// ============================================================================
// CRM LAYOUT (root wrapper)
// ============================================================================
export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <CRMShell>{children}</CRMShell>
    </CRMProvider>
  )
}
