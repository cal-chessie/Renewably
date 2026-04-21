// CRM Shell v2.2 — hydration-stable
// cache-bust: 20260417-213700
'use client'

import { useState, useEffect, useCallback } from 'react'
import { CRMProvider, useCRM } from '@/components/crm/CRMProvider'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Building2, GitBranch, LogOut, Menu,
  ChevronLeft, ChevronRight, Users, Settings as SettingsIcon,
  TrendingUp, Euro, Trophy, CalendarDays as CalendarIcon,
} from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import PageTransition from '@/components/crm/PageTransition'
import { AIAssistant } from '@/components/crm/AIAssistant'

// CSS keyframe animations (replaces framer-motion to avoid Turbopack reducedMotion bug)
const CSS_ANIMS = `
@keyframes crm-fadeInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes crm-pulseGlow {
  0%, 100% { opacity: 0.3; transform: scale(0.85); }
  50% { opacity: 0.7; transform: scale(1.15); }
}
@keyframes crm-popIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
`
import Image from 'next/image'

// ============================================================================
// CONSTANTS
// ============================================================================
const DARK = '#080808'
const DARK2 = '#141414'
const YELLOW = '#F3D840'
const GREEN = '#10B981'
const BLUE = '#60A5FA'
const PURPLE = '#A78BFA'

const SIDEBAR_EXPANDED = 256
const SIDEBAR_COLLAPSED = 72

const navSections = [
  {
    label: null,
    items: [
      { href: '/crm/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/crm/companies', label: 'Companies', icon: Building2 },
      { href: '/crm/pipeline', label: 'Pipeline', icon: GitBranch },
      { href: '/crm/calendar', label: 'Calendar', icon: CalendarIcon },
      { href: '/crm/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

// ============================================================================
// HELPERS
// ============================================================================
const fmtCompact = (v: number) => {
  if (v >= 1000000) return `€${(v / 1000000).toFixed(1)}M`
  if (v >= 1000) return `€${(v / 1000).toFixed(0)}k`
  return `€${v}`
}

// ============================================================================
// COLLAPSED ICON BUTTON
// ============================================================================
function CollapsedNavItem({ item, isActive, onNavigate }: {
  item: { href: string; label: string; icon: React.ElementType }; isActive: boolean; onNavigate?: () => void
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => { router.push(item.href); onNavigate?.() }}
      title={item.label}
      aria-label={item.label}
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isActive ? `${YELLOW}18` : 'transparent',
        transition: 'all 0.2s ease',
        padding: 0,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = 'transparent'
      }}
    >
      <item.icon size={20} style={{ color: isActive ? YELLOW : 'rgba(255,255,255,0.6)' }} />
      {isActive && (
        <div
          style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: 3, height: 20, borderRadius: '0 3px 3px 0', background: YELLOW,
          }}
        />
      )}
    </button>
  )
}

// ============================================================================
// EXPANDED NAV ITEM
// ============================================================================
function ExpandedNavItem({ item, isActive, onNavigate }: {
  item: { href: string; label: string; icon: React.ElementType }; isActive: boolean; onNavigate?: () => void
}) {
  const router = useRouter()
  return (
    <button
      onClick={() => { router.push(item.href); onNavigate?.() }}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10, fontSize: 14,
        fontWeight: isActive ? 600 : 500,
        color: isActive ? YELLOW : 'rgba(255,255,255,0.6)',
        background: isActive ? `${YELLOW}12` : 'transparent',
        border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
        textAlign: 'left', fontFamily: 'inherit', position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }
      }}
      onMouseLeave={(e) => {
        if (!isActive) { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'transparent' }
      }}
    >
      <item.icon size={20} style={{ color: isActive ? YELLOW : undefined, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {isActive && (
        <div
          style={{ width: 6, height: 6, borderRadius: '50%', background: YELLOW }} />
      )}
    </button>
  )
}

// ============================================================================
// COLLAPSED STAT PILL (for collapsed sidebar)
// ============================================================================
function CollapsedStat({ value, label, color }: {
  value: string; label: string; color: string
}) {
  return (
    <div
      title={`${label}: ${value}`}
      style={{
        width: 44, height: 44, borderRadius: 12,
        background: `linear-gradient(135deg, ${color}14, ${color}08)`,
        border: `1px solid ${color}20`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 1,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1, fontFamily: 'monospace' }}>
        {value}
      </span>
    </div>
  )
}

// ============================================================================
// EXPANDED STAT CARD (for expanded sidebar metrics)
// ============================================================================
function ExpandedStatCard({ value, label, color, icon: StatIcon }: {
  value: string; label: string; color: string; icon: React.ElementType
}) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: `linear-gradient(145deg, ${color}0C, ${color}04)`,
      border: `1px solid ${color}14`,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
            textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 20, fontWeight: 800, color, lineHeight: 1,
            fontFamily: 'monospace', letterSpacing: '-0.03em',
          }}>
            {value}
          </div>
        </div>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: `${color}12`, border: `1px solid ${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 12px ${color}08`,
        }}>
          <StatIcon size={14} style={{ color }} />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// SIDEBAR NAV COMPONENT
// ============================================================================
function SidebarNav({ collapsed, onNavigate }: {
  collapsed: boolean; onNavigate?: () => void
}) {
  const pathname = usePathname()
  const { user, logout } = useCRM()
  const [stats, setStats] = useState<{
    activeClients: number | null
    openDeals: number | null
    mrr: number | null
    winsThisMonth: number | null
    pipelineValue: number | null
  } | null>(null)

  useEffect(() => {
    // Use dedicated stats endpoint instead of full dashboard fetch
    // Cache for 5 minutes — sidebar stats don't need real-time updates
    const cached = sessionStorage.getItem('crm-sidebar-stats')
    const cachedTime = sessionStorage.getItem('crm-sidebar-stats-time')
    if (cached && cachedTime && (Date.now() - Number(cachedTime)) < 300000) {
      try { setStats(JSON.parse(cached)) } catch {}
      return
    }

    fetch('/api/crm/dashboard')
      .then((r) => r.json())
      .then((data) => {
        if (data.kpis) {
          const statsData = {
            activeClients: data.kpis.activeClients ?? null,
            openDeals: data.kpis.openDeals ?? null,
            mrr: data.kpis.mrr ?? null,
            winsThisMonth: data.kpis.winsThisMonth ?? null,
            pipelineValue: data.kpis.pipelineValue ?? null,
          }
          setStats(statsData)
          sessionStorage.setItem('crm-sidebar-stats', JSON.stringify(statsData))
          sessionStorage.setItem('crm-sidebar-stats-time', String(Date.now()))
        }
      })
      .catch(() => {})
  }, [])

  const activeCount = stats?.activeClients
  const openDeals = stats?.openDeals
  const mrr = stats?.mrr
  const winsThisMonth = stats?.winsThisMonth

  // ── Collapsed sidebar ──
  if (collapsed) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        alignItems: 'center', padding: '0 0',
      }}>
        {/* Logo */}
        <div style={{
          padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
          width: '100%', display: 'flex', justifyContent: 'center',
        }}>
          <Image src="/logo-white.png" alt="Renewably" width={42} height={42} style={{ borderRadius: 12 }} />
        </div>

        {/* Nav icons */}
        <nav style={{
          flex: 1, paddingTop: 12, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 4,
        }}>
          {navSections.map((section) => (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return <CollapsedNavItem key={item.href} item={item} isActive={isActive} onNavigate={onNavigate} />
              })}
            </div>
          ))}

          {/* Compact stat pills */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <CollapsedStat value={activeCount !== null ? String(activeCount) : '—'} label="Active Clients" color={GREEN} />
            <CollapsedStat value={openDeals !== null ? String(openDeals) : '—'} label="Open Deals" color={YELLOW} />
            <CollapsedStat value={mrr != null ? fmtCompact(mrr) : '—'} label="MRR" color={BLUE} />
          </div>
        </nav>

        {/* User avatar + logout */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%',
          padding: '12px 0', display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 8,
        }}>
          {user && (
            <Avatar style={{ width: 36, height: 36 }}>
              <AvatarFallback style={{ background: YELLOW, color: '#374151', fontSize: 13, fontWeight: 700 }}>
                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <button
            onClick={logout} title="Log out" aria-label="Log out"
            style={{
              width: 44, height: 44, borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.55)', transition: 'all 0.2s', padding: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Expanded sidebar ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo + brand */}
      <div style={{ padding: '20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/logo-white.png" alt="Renewably" width={40} height={40} style={{ borderRadius: 12 }} />
          <div>
            <div style={{ color: '#FFF', fontWeight: 700, fontSize: 17, lineHeight: 1.2, letterSpacing: -0.2 }}>Renewably</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 500, letterSpacing: 0.3, textTransform: 'uppercase' }}>SolarPilot CRM</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1, padding: '16px 12px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            {section.label && !collapsed && (
              <div style={{
                fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
                textTransform: 'uppercase', letterSpacing: 0.8, padding: '0 12px 8px',
              }}>
                {section.label}
              </div>
            )}
            {section.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return collapsed
                ? <CollapsedNavItem key={item.href} item={item} isActive={isActive} onNavigate={onNavigate} />
                : <ExpandedNavItem key={item.href} item={item} isActive={isActive} onNavigate={onNavigate} />
            })}
          </div>
        ))}

        {/* ── At-a-Glance Metrics ── */}
        <div style={{ marginTop: 20 }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.25)',
            textTransform: 'uppercase', letterSpacing: 0.8, padding: '0 4px 10px',
          }}>
            At a Glance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Active Clients — hero stat */}
            <div
              style={{
                padding: '18px 18px', borderRadius: 16,
                background: `linear-gradient(145deg, ${GREEN}18, ${GREEN}06, ${GREEN}10)`,
                border: `1px solid ${GREEN}22`,
                position: 'relative', overflow: 'hidden',
                animation: 'crm-fadeInUp 0.5s ease both',
              }}
            >
              {/* Top glow line */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${GREEN}70, transparent)`,
              }} />
              {/* Animated radial pulse */}
              <div
                style={{
                  position: 'absolute', top: -30, right: -30, width: 100, height: 100,
                  background: `radial-gradient(circle, ${GREEN}18, transparent 70%)`,
                  pointerEvents: 'none', borderRadius: '50%',
                  animation: 'crm-pulseGlow 3s ease-in-out infinite',
                }}
              />
              {/* Bottom ambient glow */}
              <div style={{
                position: 'absolute', bottom: -10, left: '20%', right: '20%', height: 30,
                background: `radial-gradient(ellipse, ${GREEN}10, transparent 70%)`,
                pointerEvents: 'none',
              }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                <div>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.35)',
                    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <span>Active Clients</span>
                    <span style={{
                      fontSize: 8, fontWeight: 600, color: GREEN, background: `${GREEN}18`,
                      padding: '1px 6px', borderRadius: 20, letterSpacing: 0.5, textTransform: 'none',
                    }}>
                      LIVE
                    </span>
                  </div>
                  <div
                    key={activeCount}
                    style={{
                      fontSize: 40, fontWeight: 800, color: GREEN, lineHeight: 1,
                      fontFamily: 'monospace', letterSpacing: '-0.04em',
                      textShadow: `0 0 30px ${GREEN}40, 0 0 60px ${GREEN}15`,
                      animation: 'crm-popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                    }}
                  >
                    {activeCount !== null ? activeCount : '—'}
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: `${GREEN}AA`, marginTop: 4,
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <TrendingUp size={10} style={{ color: GREEN }} />
                    <span>Active</span>
                  </div>
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: `linear-gradient(145deg, ${GREEN}22, ${GREEN}0A)`,
                  border: `1px solid ${GREEN}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 24px ${GREEN}15, inset 0 1px 0 ${GREEN}15`,
                }}>
                  <Users size={22} style={{ color: GREEN }} />
                </div>
              </div>
            </div>

            {/* 3 smaller stat cards in a row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              <ExpandedStatCard
                value={openDeals !== null ? String(openDeals) : '—'}
                label="Deals"
                color={YELLOW}
                icon={TrendingUp}
              />
              <ExpandedStatCard
                value={mrr !== null ? fmtCompact(mrr) : '—'}
                label="MRR"
                color={BLUE}
                icon={Euro}
              />
              <ExpandedStatCard
                value={winsThisMonth !== null ? String(winsThisMonth) : '—'}
                label="Wins"
                color={PURPLE}
                icon={Trophy}
              />
            </div>
          </div>
        </div>
      </nav>

      {/* User section */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px',
      }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar style={{ width: 36, height: 36, flexShrink: 0 }}>
              <AvatarFallback style={{ background: YELLOW, color: '#374151', fontSize: 13, fontWeight: 700 }}>
                {user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#FFF', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.role}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                width: 44, height: 44, borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'rgba(255,255,255,0.55)', transition: 'all 0.2s', padding: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#FFF'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.background = 'transparent' }}
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
// COLLAPSE TOGGLE BUTTON — BOLD & VISIBLE
// ============================================================================
function CollapseToggle({ collapsed, onToggle }: {
  collapsed: boolean; onToggle: () => void
}) {
  const Icon = collapsed ? ChevronRight : ChevronLeft
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle() }}
      style={{
        position: 'absolute',
        top: 24,
        right: -20,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: `1px solid rgba(255,255,255,0.12)`,
        background: `#1E1E1E`,
        color: 'rgba(255,255,255,0.6)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
        transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        padding: 0,
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.color = '#FFF'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
        e.currentTarget.style.transform = 'scale(1.05)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#1E1E1E'
        e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
    >
      <Icon size={18} strokeWidth={3} />
    </button>
  )
}

// ============================================================================
// CRM SHELL
// ============================================================================
function CRMShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('crm-sidebar-collapsed')
    if (saved !== null) setCollapsed(saved === 'true')
  }, [])

  // Inject CSS animations + responsive rules client-side to avoid hydration mismatch
  useEffect(() => {
    const id = 'crm-keyframe-styles'
    if (document.getElementById(id)) return
    const style = document.createElement('style')
    style.id = id
    style.textContent = CSS_ANIMS + `
      @media (max-width: 767px) { .crm-sidebar-desktop { display: none !important; } }
      @media (min-width: 768px) { .crm-mobile-toggle { display: none !important; } }
    `
    document.head.appendChild(style)
  }, [])

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('crm-sidebar-collapsed', String(next))
      return next
    })
  }, [])

  if (pathname === '/crm/login') return <>{children}</>

  return (
    <div style={{ display: 'flex', height: '100vh', background: DARK }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <aside
          className="crm-sidebar-desktop"
          style={{
            width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
            flexShrink: 0, background: DARK2,
            borderRight: `1px solid rgba(255,255,255,0.05)`,
            flexDirection: 'column', display: 'flex',
            height: '100vh',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          }}
        >
          <SidebarNav collapsed={collapsed} />
        </aside>
        <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
      </div>

      <div className="crm-mobile-toggle" style={{ position: 'fixed', top: 12, left: 12, zIndex: 50 }}>
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <button onClick={() => setMobileMenuOpen(true)} style={{
              width: 44, height: 44, borderRadius: 10, border: 'none',
              background: YELLOW, color: DARK, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', padding: 0,
            }} aria-label="Open menu">
              <Menu size={22} />
            </button>
          <SheetContent side="left" style={{ padding: 0, width: 256, background: DARK2, border: 'none' }}>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarNav collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main id="main-content" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="crm-mobile-toggle" style={{ height: 56, flexShrink: 0 }} />
        <PageTransition>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>
        </PageTransition>
        <AIAssistant />
      </main>
    </div>
  )
}

// ============================================================================
// CRM LAYOUT (default export — wraps CRMProvider around the shell)
// ============================================================================
export default function CRMLayout({ children }: { children: React.ReactNode }) {
  return (
    <CRMProvider>
      <CRMShell>{children}</CRMShell>
    </CRMProvider>
  )
}
