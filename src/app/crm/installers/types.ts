// Shared types and constants for the Installers portal

export const IRELAND_COUNTIES = [
  'Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Tipperary',
  'Clare', 'Kerry', 'Kilkenny', 'Wexford', 'Wicklow', 'Meath',
  'Kildare', 'Donegal', 'Sligo', 'Mayo', 'Roscommon', 'Longford',
  'Westmeath', 'Offaly', 'Laois', 'Carlow', 'Cavan', 'Monaghan', 'Leitrim',
]

export const PLAN_PRICING: Record<string, number> = {
  starter: 1000,
  pro: 1250,
  enterprise: 1500,
}

export const EQUIPMENT_ICONS: Record<string, { icon: string; label: string }> = {
  inverter: { icon: 'Zap', label: 'Inverter' },
  battery: { icon: 'Battery', label: 'Battery' },
  panel: { icon: 'Sun', label: 'Panels' },
  mounting: { icon: 'Grid3x3', label: 'Mounting' },
  ev_charger: { icon: 'Plug', label: 'EV Charger' },
}

export const SPECIALIZATION_LABELS: Record<string, string> = {
  ruralSpecialist: 'Rural Specialist',
  commercialSpecialist: 'Commercial Specialist',
  heritageExperience: 'Heritage Experience',
  offersEvCharger: 'EV Charger Install',
  offersHeatPump: 'Heat Pump Install',
}

export const PLAN_COLORS: Record<string, React.CSSProperties> = {
  starter: { backgroundColor: '#222222', color: '#A0A0A0', border: '1px solid #2A2A2A' },
  pro: { backgroundColor: 'rgba(243,216,64,0.15)', color: '#8a7500', border: '1px solid rgba(243,216,64,0.4)' },
  enterprise: { backgroundColor: 'rgba(168,85,247,0.15)', color: '#C084FC', border: '1px solid rgba(168,85,247,0.2)' },
}

export const SUBSCRIPTION_COLORS: Record<string, React.CSSProperties> = {
  none: { backgroundColor: '#1A1A1A', color: '#6B7280', border: '1px solid #2A2A2A' },
  trialing: { backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA', border: '1px solid rgba(59,130,246,0.2)' },
  active: { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34D399', border: '1px solid rgba(16,185,129,0.2)' },
  past_due: { backgroundColor: 'rgba(249,115,22,0.15)', color: '#FB923C', border: '1px solid rgba(249,115,22,0.2)' },
  cancelled: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#F87171', border: '1px solid rgba(239,68,68,0.2)' },
}

export const DOCUMENT_TYPES = [
  { key: 'msa', label: 'Master Services Agreement', short: 'MSA' },
  { key: 'nda', label: 'Non-Disclosure Agreement', short: 'NDA' },
  { key: 'dpa', label: 'Data Processing Agreement', short: 'DPA' },
  { key: 'tos', label: 'Terms of Service', short: 'ToS' },
]

export const ONBOARDING_STEPS = [
  { step: 1, label: 'Company Info' },
  { step: 2, label: 'Contact Details' },
  { step: 3, label: 'Certifications' },
  { step: 4, label: 'Service Territory' },
  { step: 5, label: 'Insurance' },
  { step: 6, label: 'Equipment' },
  { step: 7, label: 'Team & Capacity' },
  { step: 8, label: 'Lead Preferences' },
  { step: 9, label: 'Legal Documents' },
  { step: 10, label: 'Go Live' },
]

// ──────────────────────────── Types ────────────────────────────
export interface InstallerRow {
  id: string
  companyName: string
  contactName: string
  contactEmail: string | null
  contactPhone: string | null
  plan: string
  subscriptionStatus: string
  onboardingStep: number
  onboardingComplete: boolean
  counties: string[]
  equipmentCategories: string[]
  seaiRegistered: boolean
  reciRegistered: boolean
  teamSize: number | null
  avgProjectValue: number | null
  createdAt: string
  mrr: number | null
}

export interface InstallerDetail extends InstallerRow {
  website: string | null
  address: string | null
  city: string | null
  county: string | null
  eircode: string | null
  seaiNumber: string | null
  reciNumber: string | null
  yearsInBusiness: number | null
  electricians: number | null
  vans: number | null
  specializations: string[]
  equipment: Array<{
    id: string
    category: string
    brand: string
    model: string | null
  }>
  documents: Array<{
    type: string
    signed: boolean
    signedAt: string | null
    documentUrl: string | null
  }>
  subscription: {
    plan: string
    status: string
    billingCycle: string
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    mrr: number
  } | null
  leadPreferences: {
    maxLeadsPerMonth: number | null
    minValue: number | null
    responseTimeHours: number | null
    travelRadiusKm: number | null
  } | null
  integrations: Array<{
    provider: string
    connected: boolean
    connectedAt: string | null
  }>
  description: string | null
}

export interface InstallerStats {
  totalInstallers: number
  activeSubscriptions: number
  mrr: number
  onboardingRate: number
  countiesCovered: number
  plans: Record<string, number>
  seaiRegistered: number
  reciRegistered: number
  avgTeamSize: number
}

export interface ActivityItem {
  id: string
  type: string
  subject: string
  description: string | null
  createdAt: string
  userName: string | null
  userAvatar: string | null
  contactName: string | null
}

export interface PerformanceData {
  totalInstalls: number
  installsThisMonth: number
  installsLastMonth: number
  leadConversionRate: number
  avgResponseTime: number
  revenueGenerated: number
  satisfactionScore: number
  mrr: number
  healthScore: number
  monthlyTrend: Array<{ month: string; installs: number; revenue: number }>
  leadFunnel: Array<{ stage: string; count: number }>
  revenueBreakdown: Array<{ month: string; revenue: number }>
}
