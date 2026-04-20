// ============================================================================
// SHARED CRM DATA — single source of truth for types, mock data, and helpers
// Used by: Companies, Pipeline, Dashboard pages
// ============================================================================

// ============================================================================
// DESIGN TOKENS (shared across CRM pages)
// ============================================================================
export const C = {
  bg: '#0A0A0A',
  surface: '#111111',
  card: '#1A1A1A',
  card2: '#1F1F1F',
  card3: '#262626',
  border: '#2A2A2A',
  borderLight: '#333333',
  text: '#E5E5E5',
  textSec: '#A3A3A3',
  textTer: '#737373',
  textMut: '#525252',
  yellow: '#F3D840',
  yellowDk: '#D4B82E',
  green: '#22C55E',
  greenBg: 'rgba(34,197,94,0.12)',
  red: '#EF4444',
  redBg: 'rgba(239,68,68,0.12)',
  orange: '#F97316',
  orangeBg: 'rgba(249,115,22,0.12)',
  blue: '#3B82F6',
  blueBg: 'rgba(59,130,246,0.12)',
  purple: '#8B5CF6',
  purpleBg: 'rgba(139,92,246,0.12)',
  teal: '#14B8A6',
} as const

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
export type PipelineStage = 'Lead' | 'Qualified' | 'Demo Scheduled' | 'Demo Complete' | 'Proposal Sent' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
export type Product = 'SolarPilot' | 'AI Workforce' | 'Both'
export type AnswerOption = 'Yes' | 'No' | 'Partial'
export type DemoOutcome = 'Not Booked' | 'Booked' | 'Completed - Positive' | 'Completed - Neutral' | 'Completed - Negative' | 'No Show'
export type CloseReason = 'Price' | 'Competitor' | 'Not Ready' | 'No Response' | 'Other'
export type ActivityType = 'Call' | 'Email' | 'Demo' | 'Proposal'
export type ActivityOutcome = 'Positive' | 'Neutral' | 'Negative'

export interface Contact {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isDecisionMaker: boolean
}

export interface Activity {
  id: string
  type: ActivityType
  description: string
  outcome?: ActivityOutcome
  duration?: string
  timestamp: string
}

export interface Deal {
  id: string
  product: Product
  mrr: number
  setupFee: number
  stage: PipelineStage
  qualifiedAnswers: [AnswerOption, AnswerOption, AnswerOption]
  demoOutcome: DemoOutcome
  closeReason?: CloseReason
  activities: Activity[]
  createdAt: string
}

export interface OnboardingStep {
  label: string
  complete: boolean
}

export interface OnboardingProgress {
  solarPilot: OnboardingStep[]
  aiWorkforce: OnboardingStep[]
}

export interface Company {
  id: string
  name: string
  county: string
  counties: string[]
  seaiRegistered: boolean
  seaiRegNumber: string | null
  teamSize: number
  installsPerYear: number
  website: string
  founded: string
  contacts: Contact[]
  deals: Deal[]
  onboarding: OnboardingProgress
}

// ============================================================================
// PIPELINE STAGE CONFIG
// ============================================================================
export const STAGES: { label: PipelineStage; colour: string; bg: string }[] = [
  { label: 'Lead', colour: C.blue, bg: C.blueBg },
  { label: 'Qualified', colour: C.purple, bg: C.purpleBg },
  { label: 'Demo Scheduled', colour: C.orange, bg: C.orangeBg },
  { label: 'Demo Complete', colour: C.teal, bg: 'rgba(20,184,166,0.12)' },
  { label: 'Proposal Sent', colour: C.yellow, bg: 'rgba(243,216,64,0.12)' },
  { label: 'Negotiation', colour: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  { label: 'Closed Won', colour: C.green, bg: C.greenBg },
  { label: 'Closed Lost', colour: C.red, bg: C.redBg },
]

// ============================================================================
// MOCK DATA — 10 Irish solar installer companies
// ============================================================================
export const COMPANIES: Company[] = [
  {
    id: 'c1', name: 'SunPower Ireland', county: 'Dublin', counties: ['Dublin', 'Wicklow', 'Meath', 'Kildare'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2024-0892', teamSize: 15, installsPerYear: 120,
    website: 'sunpowerireland.ie', founded: '2018',
    contacts: [
      { id: 'ct1', name: 'Declan Murphy', email: 'declan@sunpowerireland.ie', phone: '+353 83 412 7800', role: 'CEO', isDecisionMaker: true },
      { id: 'ct2', name: 'Aoife Brennan', email: 'aoife@sunpowerireland.ie', phone: '+353 85 623 9100', role: 'Operations Manager', isDecisionMaker: true },
      { id: 'ct3', name: 'Liam Kavanagh', email: 'liam@sunpowerireland.ie', phone: '+353 87 345 6200', role: 'Sales Manager', isDecisionMaker: false },
      { id: 'ct4', name: 'Sinead O\'Neill', email: 'sinead@sunpowerireland.ie', phone: '+353 86 178 3400', role: 'Finance', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd1', product: 'SolarPilot', mrr: 890, setupFee: 2500, stage: 'Negotiation',
        qualifiedAnswers: ['Yes', 'Yes', 'Partial'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a1', type: 'Call', description: 'Initial discovery call — discussed current workflow pain points', outcome: 'Positive', duration: '32 min', timestamp: '2026-04-02 10:30' },
          { id: 'a2', type: 'Email', description: 'Sent product overview and pricing brochure', timestamp: '2026-04-04 14:15' },
          { id: 'a3', type: 'Demo', description: 'Full product demo with Declan and Aoife', outcome: 'Positive', duration: '55 min', timestamp: '2026-04-08 11:00' },
          { id: 'a4', type: 'Proposal', description: 'Sent custom proposal — Enterprise plan with priority support', timestamp: '2026-04-10 09:45' },
          { id: 'a5', type: 'Call', description: 'Follow-up call — Aoife requested volume discount for multi-site', outcome: 'Neutral', duration: '25 min', timestamp: '2026-04-12 16:00' },
        ],
        createdAt: '2026-03-28',
      },
      {
        id: 'd2', product: 'AI Workforce', mrr: 450, setupFee: 1500, stage: 'Lead',
        qualifiedAnswers: ['Partial', 'No', 'No'],
        demoOutcome: 'Not Booked',
        activities: [
          { id: 'a6', type: 'Email', description: 'Sent AI Workforce teaser — automated lead scoring and email drafts', timestamp: '2026-04-11 10:00' },
        ],
        createdAt: '2026-04-11',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: true },
        { label: 'Data Migration', complete: true },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c2', name: 'EcoSpark Solar', county: 'Cork', counties: ['Cork', 'Kerry', 'Limerick'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2023-1456', teamSize: 8, installsPerYear: 65,
    website: 'ecosparksolar.ie', founded: '2019',
    contacts: [
      { id: 'ct5', name: 'Eoin O\'Sullivan', email: 'eoin@ecosparksolar.ie', phone: '+353 87 567 8900', role: 'CEO', isDecisionMaker: true },
      { id: 'ct6', name: 'Mairead Collins', email: 'mairead@ecosparksolar.ie', phone: '+353 86 234 5600', role: 'Operations Manager', isDecisionMaker: false },
      { id: 'ct7', name: 'Cillian Walsh', email: 'cillian@ecosparksolar.ie', phone: '+353 83 890 1200', role: 'Installations Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd3', product: 'SolarPilot', mrr: 590, setupFee: 1500, stage: 'Closed Won',
        qualifiedAnswers: ['Yes', 'Yes', 'Yes'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a7', type: 'Call', description: 'Discovery call — Eoin frustrated with spreadsheets', outcome: 'Positive', duration: '28 min', timestamp: '2026-02-15 09:00' },
          { id: 'a8', type: 'Demo', description: 'Demo with full team — very engaged', outcome: 'Positive', duration: '50 min', timestamp: '2026-02-20 14:00' },
          { id: 'a9', type: 'Proposal', description: 'Pro plan proposal accepted same day', timestamp: '2026-02-22 11:30' },
        ],
        createdAt: '2026-02-14',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: true },
        { label: 'Data Migration', complete: true },
        { label: 'Team Trained', complete: true },
        { label: 'Live', complete: true },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c3', name: 'GreenShine Energy', county: 'Galway', counties: ['Galway', 'Roscommon', 'Mayo'],
    seaiRegistered: false, seaiRegNumber: null, teamSize: 4, installsPerYear: 28,
    website: 'greenshineenergy.ie', founded: '2021',
    contacts: [
      { id: 'ct8', name: 'Conor Fahy', email: 'conor@greenshineenergy.ie', phone: '+353 91 555 1234', role: 'CEO', isDecisionMaker: true },
      { id: 'ct9', name: 'Roisin Duffy', email: 'roisin@greenshineenergy.ie', phone: '+353 91 555 5678', role: 'Sales Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd4', product: 'SolarPilot', mrr: 350, setupFee: 1000, stage: 'Demo Complete',
        qualifiedAnswers: ['No', 'Yes', 'Partial'],
        demoOutcome: 'Completed - Neutral',
        activities: [
          { id: 'a10', type: 'Email', description: 'Cold outreach — found via SEAI installer list', timestamp: '2026-03-20 08:30' },
          { id: 'a11', type: 'Call', description: 'Conor interested but concerned about team size requirements', outcome: 'Neutral', duration: '18 min', timestamp: '2026-03-25 11:00' },
          { id: 'a12', type: 'Demo', description: 'Demo with Conor — showed Starter plan features', outcome: 'Neutral', duration: '40 min', timestamp: '2026-04-01 15:00' },
        ],
        createdAt: '2026-03-19',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c4', name: 'BrightFuture Solar', county: 'Limerick', counties: ['Limerick', 'Clare', 'Tipperary'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2025-0234', teamSize: 12, installsPerYear: 90,
    website: 'brightfuturesolar.ie', founded: '2017',
    contacts: [
      { id: 'ct10', name: 'Fiona Donnelly', email: 'fiona@brightfuturesolar.ie', phone: '+353 61 234 567', role: 'CEO', isDecisionMaker: true },
      { id: 'ct11', name: 'Tomas Hegarty', email: 'tomas@brightfuturesolar.ie', phone: '+353 61 234 568', role: 'Operations Manager', isDecisionMaker: true },
      { id: 'ct12', name: 'Grainne McNamara', email: 'grainne@brightfuturesolar.ie', phone: '+353 61 234 569', role: 'Finance', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd5', product: 'SolarPilot', mrr: 750, setupFee: 2000, stage: 'Lead',
        qualifiedAnswers: ['Partial', 'Partial', 'No'],
        demoOutcome: 'Not Booked',
        activities: [
          { id: 'a13', type: 'Email', description: 'Inbound enquiry via website — request for demo', timestamp: '2026-04-14 09:20' },
        ],
        createdAt: '2026-04-14',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c5', name: 'SolarEdge Solutions', county: 'Kildare', counties: ['Kildare', 'Dublin', 'Meath', 'Wicklow', 'Westmeath'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2022-0078', teamSize: 20, installsPerYear: 180,
    website: 'solaredgesolutions.ie', founded: '2015',
    contacts: [
      { id: 'ct13', name: 'Mark Reynolds', email: 'mark@solaredgesolutions.ie', phone: '+353 45 876 5432', role: 'CEO', isDecisionMaker: true },
      { id: 'ct14', name: 'Lisa Kelly', email: 'lisa@solaredgesolutions.ie', phone: '+353 45 876 5433', role: 'Operations Manager', isDecisionMaker: true },
      { id: 'ct15', name: 'David Dunne', email: 'david@solaredgesolutions.ie', phone: '+353 45 876 5434', role: 'Installations Manager', isDecisionMaker: false },
      { id: 'ct16', name: 'Emma Whelan', email: 'emma@solaredgesolutions.ie', phone: '+353 45 876 5435', role: 'Sales Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd6', product: 'Both', mrr: 1490, setupFee: 4000, stage: 'Closed Won',
        qualifiedAnswers: ['Yes', 'Yes', 'Yes'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a14', type: 'Call', description: 'Enterprise discovery — multi-site requirements', outcome: 'Positive', duration: '45 min', timestamp: '2026-01-10 10:00' },
          { id: 'a15', type: 'Demo', description: 'Full enterprise demo with Mark and Lisa', outcome: 'Positive', duration: '75 min', timestamp: '2026-01-18 14:00' },
          { id: 'a16', type: 'Proposal', description: 'Enterprise Both plan — custom pricing for 5 sites', timestamp: '2026-01-22 09:00' },
          { id: 'a17', type: 'Call', description: 'Negotiation call — agreed on volume pricing', outcome: 'Positive', duration: '30 min', timestamp: '2026-01-28 11:00' },
          { id: 'a18', type: 'Proposal', description: 'Final contract signed', timestamp: '2026-02-01 16:00' },
        ],
        createdAt: '2026-01-08',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: true },
        { label: 'Data Migration', complete: true },
        { label: 'Team Trained', complete: true },
        { label: 'Live', complete: true },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: true },
        { label: 'Configuration', complete: true },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c6', name: 'Photon Electrical', county: 'Meath', counties: ['Meath', 'Louth', 'Cavan'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2024-1567', teamSize: 6, installsPerYear: 45,
    website: 'photonelectrical.ie', founded: '2020',
    contacts: [
      { id: 'ct17', name: 'Sean Doyle', email: 'sean@photonelectrical.ie', phone: '+353 46 789 0123', role: 'CEO', isDecisionMaker: true },
      { id: 'ct18', name: 'Nora Brady', email: 'nora@photonelectrical.ie', phone: '+353 46 789 0124', role: 'Operations Manager', isDecisionMaker: false },
      { id: 'ct19', name: 'Padraig Lynch', email: 'padraig@photonelectrical.ie', phone: '+353 46 789 0125', role: 'Sales Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd7', product: 'SolarPilot', mrr: 450, setupFee: 1200, stage: 'Proposal Sent',
        qualifiedAnswers: ['Yes', 'Partial', 'Yes'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a19', type: 'Email', description: 'Initial outreach via LinkedIn connection', timestamp: '2026-03-10 09:00' },
          { id: 'a20', type: 'Call', description: 'Discovery call — Sean managing everything manually', outcome: 'Positive', duration: '35 min', timestamp: '2026-03-14 14:00' },
          { id: 'a21', type: 'Demo', description: 'Demo — Sean very impressed with scheduling features', outcome: 'Positive', duration: '45 min', timestamp: '2026-03-20 11:00' },
          { id: 'a22', type: 'Proposal', description: 'Pro plan proposal sent with 10% launch discount', timestamp: '2026-04-01 10:00' },
        ],
        createdAt: '2026-03-09',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c7', name: 'VoltGreen Installations', county: 'Wicklow', counties: ['Wicklow'],
    seaiRegistered: false, seaiRegNumber: null, teamSize: 3, installsPerYear: 15,
    website: 'voltgreen.ie', founded: '2023',
    contacts: [
      { id: 'ct20', name: 'Ryan Byrne', email: 'ryan@voltgreen.ie', phone: '+353 87 111 2233', role: 'CEO', isDecisionMaker: true },
      { id: 'ct21', name: 'Kate Ferguson', email: 'kate@voltgreen.ie', phone: '+353 87 444 5566', role: 'Sales Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd8', product: 'SolarPilot', mrr: 250, setupFee: 800, stage: 'Qualified',
        qualifiedAnswers: ['No', 'Yes', 'No'],
        demoOutcome: 'Booked',
        activities: [
          { id: 'a23', type: 'Email', description: 'Replied to social media ad', timestamp: '2026-04-05 13:00' },
          { id: 'a24', type: 'Call', description: 'Qualification call — small team, growing fast', outcome: 'Positive', duration: '20 min', timestamp: '2026-04-08 10:30' },
          { id: 'a25', type: 'Email', description: 'Sent Starter plan details and booked demo', timestamp: '2026-04-09 15:00' },
        ],
        createdAt: '2026-04-04',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c8', name: 'Clare Solar Co', county: 'Clare', counties: ['Clare', 'Limerick'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2025-0891', teamSize: 5, installsPerYear: 35,
    website: 'claresolar.ie', founded: '2022',
    contacts: [
      { id: 'ct22', name: 'Diarmuid McMahon', email: 'diarmuid@claresolar.ie', phone: '+353 65 234 5678', role: 'CEO', isDecisionMaker: true },
      { id: 'ct23', name: 'Aisling O\'Brien', email: 'aisling@claresolar.ie', phone: '+353 65 234 5679', role: 'Operations Manager', isDecisionMaker: true },
    ],
    deals: [
      {
        id: 'd9', product: 'SolarPilot', mrr: 350, setupFee: 1000, stage: 'Demo Scheduled',
        qualifiedAnswers: ['Partial', 'Yes', 'Partial'],
        demoOutcome: 'Booked',
        activities: [
          { id: 'a26', type: 'Call', description: 'Initial call — Diarmuid wants to streamline operations', outcome: 'Positive', duration: '22 min', timestamp: '2026-04-10 09:30' },
          { id: 'a27', type: 'Email', description: 'Confirmed demo for Thursday 17 April', timestamp: '2026-04-12 11:00' },
        ],
        createdAt: '2026-04-09',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c9', name: 'Midlands Solar Group', county: 'Westmeath', counties: ['Westmeath', 'Offaly', 'Longford'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2023-2345', teamSize: 10, installsPerYear: 72,
    website: 'midlandssolar.ie', founded: '2019',
    contacts: [
      { id: 'ct24', name: 'Brian O\'Reilly', email: 'brian@midlandssolar.ie', phone: '+353 90 645 7890', role: 'CEO', isDecisionMaker: true },
      { id: 'ct25', name: 'Ciara Hughes', email: 'ciara@midlandssolar.ie', phone: '+353 90 645 7891', role: 'Finance', isDecisionMaker: false },
      { id: 'ct26', name: 'Fergus Ryan', email: 'fergus@midlandssolar.ie', phone: '+353 90 645 7892', role: 'Installations Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd10', product: 'SolarPilot', mrr: 590, setupFee: 1500, stage: 'Closed Lost',
        qualifiedAnswers: ['Yes', 'No', 'No'],
        demoOutcome: 'Completed - Negative',
        closeReason: 'Competitor',
        activities: [
          { id: 'a28', type: 'Email', description: 'Outbound email — solar CRM solutions', timestamp: '2026-02-05 10:00' },
          { id: 'a29', type: 'Call', description: 'Discovery call — interested but budget constrained', outcome: 'Neutral', duration: '20 min', timestamp: '2026-02-10 14:00' },
          { id: 'a30', type: 'Demo', description: 'Demo — team liked product but went with competitor', outcome: 'Negative', duration: '40 min', timestamp: '2026-02-18 11:00' },
          { id: 'a31', type: 'Call', description: 'Follow-up call — chose Jobber instead', outcome: 'Negative', duration: '10 min', timestamp: '2026-02-25 09:00' },
        ],
        createdAt: '2026-02-04',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c10', name: 'SouthEast Solar', county: 'Wexford', counties: ['Wexford', 'Waterford', 'Carlow', 'Kilkenny'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2024-0678', teamSize: 9, installsPerYear: 55,
    website: 'southeastsolar.ie', founded: '2020',
    contacts: [
      { id: 'ct27', name: 'James Power', email: 'james@southeastsolar.ie', phone: '+353 53 123 4567', role: 'CEO', isDecisionMaker: true },
      { id: 'ct28', name: 'Orlaith Dunne', email: 'orlaith@southeastsolar.ie', phone: '+353 53 123 4568', role: 'Operations Manager', isDecisionMaker: true },
      { id: 'ct29', name: 'Colm Kinsella', email: 'colm@southeastsolar.ie', phone: '+353 53 123 4569', role: 'Sales Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd11', product: 'Both', mrr: 990, setupFee: 3000, stage: 'Proposal Sent',
        qualifiedAnswers: ['Yes', 'Yes', 'Yes'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a32', type: 'Call', description: 'Warm lead from referral — SolarEdge recommended us', outcome: 'Positive', duration: '25 min', timestamp: '2026-03-28 10:00' },
          { id: 'a33', type: 'Demo', description: 'Demo with James and Orlaith — both very engaged', outcome: 'Positive', duration: '60 min', timestamp: '2026-04-03 14:00' },
          { id: 'a34', type: 'Proposal', description: 'Pro Both plan proposal sent with referral discount', timestamp: '2026-04-07 11:30' },
        ],
        createdAt: '2026-03-27',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c11', name: 'Killarney Solar Co', county: 'Kerry', counties: ['Kerry', 'Cork'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2024-2234', teamSize: 7, installsPerYear: 50,
    website: 'killarneysolar.ie', founded: '2019',
    contacts: [
      { id: 'ct30', name: 'Donal O\'Connor', email: 'donal@killarneysolar.ie', phone: '+353 64 345 6789', role: 'CEO', isDecisionMaker: true },
      { id: 'ct31', name: 'Siobhan Ryan', email: 'siobhan@killarneysolar.ie', phone: '+353 64 345 6790', role: 'Operations Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd12', product: 'SolarPilot', mrr: 520, setupFee: 1400, stage: 'Qualified',
        qualifiedAnswers: ['Yes', 'Yes', 'No'],
        demoOutcome: 'Booked',
        activities: [
          { id: 'a35', type: 'Email', description: 'Inbound enquiry via website form', timestamp: '2026-04-12 14:00' },
          { id: 'a36', type: 'Call', description: 'Discovery call — Donal looking to replace spreadsheet tracking', outcome: 'Positive', duration: '30 min', timestamp: '2026-04-13 11:00' },
        ],
        createdAt: '2026-04-12',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c12', name: 'Dublin Energy Solutions', county: 'Dublin', counties: ['Dublin', 'Kildare', 'Wicklow'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2023-0567', teamSize: 25, installsPerYear: 200,
    website: 'dublinenergy.ie', founded: '2014',
    contacts: [
      { id: 'ct32', name: 'Eamon Fitzpatrick', email: 'eamon@dublinenergy.ie', phone: '+353 1 456 7890', role: 'Managing Director', isDecisionMaker: true },
      { id: 'ct33', name: 'Rachel Keane', email: 'rachel@dublinenergy.ie', phone: '+353 1 456 7891', role: 'Head of Operations', isDecisionMaker: true },
      { id: 'ct34', name: 'Derek Byrne', email: 'derek@dublinenergy.ie', phone: '+353 1 456 7892', role: 'Sales Director', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd13', product: 'Both', mrr: 1290, setupFee: 3500, stage: 'Negotiation',
        qualifiedAnswers: ['Yes', 'Yes', 'Yes'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a37', type: 'Email', description: 'Referral from SolarEdge Solutions — enterprise intro', timestamp: '2026-03-15 09:00' },
          { id: 'a38', type: 'Call', description: 'Initial discovery with Eamon — 5-site operation', outcome: 'Positive', duration: '40 min', timestamp: '2026-03-18 10:30' },
          { id: 'a39', type: 'Demo', description: 'Full enterprise demo with Eamon and Rachel', outcome: 'Positive', duration: '70 min', timestamp: '2026-03-25 14:00' },
          { id: 'a40', type: 'Proposal', description: 'Enterprise Both plan proposal sent — multi-site pricing', timestamp: '2026-04-02 11:00' },
          { id: 'a41', type: 'Call', description: 'Negotiation — discussing volume discount for 5 sites', outcome: 'Positive', duration: '35 min', timestamp: '2026-04-10 15:30' },
        ],
        createdAt: '2026-03-14',
      },
      {
        id: 'd14', product: 'AI Workforce', mrr: 680, setupFee: 2000, stage: 'Lead',
        qualifiedAnswers: ['Yes', 'Partial', 'No'],
        demoOutcome: 'Not Booked',
        activities: [
          { id: 'a42', type: 'Email', description: 'AI Workforce intro email — automated lead nurture', timestamp: '2026-04-14 10:00' },
        ],
        createdAt: '2026-04-14',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c13', name: 'Cork Solar Installations', county: 'Cork', counties: ['Cork', 'Waterford'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2025-1890', teamSize: 11, installsPerYear: 80,
    website: 'corksolar.ie', founded: '2018',
    contacts: [
      { id: 'ct35', name: 'Fintan O\'Brien', email: 'fintan@corksolar.ie', phone: '+353 21 234 5678', role: 'CEO', isDecisionMaker: true },
      { id: 'ct36', name: 'Niamh Walsh', email: 'niamh@corksolar.ie', phone: '+353 21 234 5679', role: 'Operations Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd15', product: 'SolarPilot', mrr: 620, setupFee: 1800, stage: 'Demo Complete',
        qualifiedAnswers: ['Yes', 'Partial', 'Partial'],
        demoOutcome: 'Completed - Neutral',
        activities: [
          { id: 'a43', type: 'Call', description: 'Cold call from SEAI installer list', outcome: 'Neutral', duration: '15 min', timestamp: '2026-03-28 09:00' },
          { id: 'a44', type: 'Email', description: 'Sent SolarPilot overview and case study', timestamp: '2026-03-31 11:00' },
          { id: 'a45', type: 'Demo', description: 'Demo with Fintan — interested but concerned about migration effort', outcome: 'Neutral', duration: '45 min', timestamp: '2026-04-07 14:00' },
        ],
        createdAt: '2026-03-27',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c14', name: 'Tullamore Renewable Energy', county: 'Offaly', counties: ['Offaly', 'Westmeath', 'Laois'],
    seaiRegistered: false, seaiRegNumber: null, teamSize: 4, installsPerYear: 22,
    website: 'tullamoreenergy.ie', founded: '2022',
    contacts: [
      { id: 'ct37', name: 'Pat Whelan', email: 'pat@tullamoreenergy.ie', phone: '+353 57 234 5678', role: 'CEO', isDecisionMaker: true },
    ],
    deals: [
      {
        id: 'd16', product: 'SolarPilot', mrr: 280, setupFee: 900, stage: 'Lead',
        qualifiedAnswers: ['No', 'No', 'No'],
        demoOutcome: 'Not Booked',
        activities: [
          { id: 'a46', type: 'Email', description: 'Outbound email — small installer growth plan', timestamp: '2026-04-13 08:30' },
        ],
        createdAt: '2026-04-13',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c15', name: 'Sligo Sun Power', county: 'Sligo', counties: ['Sligo', 'Leitrim', 'Donegal'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2024-3345', teamSize: 6, installsPerYear: 40,
    website: 'sligosunpower.ie', founded: '2020',
    contacts: [
      { id: 'ct38', name: 'Michael Gallagher', email: 'michael@sligosunpower.ie', phone: '+353 71 345 6789', role: 'CEO', isDecisionMaker: true },
      { id: 'ct39', name: 'Aoife MacNamara', email: 'aoife@sligosunpower.ie', phone: '+353 71 345 6790', role: 'Office Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd17', product: 'SolarPilot', mrr: 420, setupFee: 1200, stage: 'Demo Scheduled',
        qualifiedAnswers: ['Partial', 'Yes', 'Partial'],
        demoOutcome: 'Booked',
        activities: [
          { id: 'a47', type: 'Email', description: 'LinkedIn connection — mutual contact intro', timestamp: '2026-04-08 10:00' },
          { id: 'a48', type: 'Call', description: 'Discovery call — Michael managing 40 installs with pen and paper', outcome: 'Positive', duration: '22 min', timestamp: '2026-04-10 14:00' },
          { id: 'a49', type: 'Email', description: 'Booked demo for Friday 18 April', timestamp: '2026-04-14 09:30' },
        ],
        createdAt: '2026-04-07',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: false },
        { label: 'Configuration', complete: false },
        { label: 'Testing', complete: false },
        { label: 'Live', complete: false },
      ],
    },
  },
  {
    id: 'c16', name: 'Limerick Eco Energy', county: 'Limerick', counties: ['Limerick', 'Clare', 'Tipperary'],
    seaiRegistered: true, seaiRegNumber: 'SEAI-2025-0678', teamSize: 9, installsPerYear: 60,
    website: 'limerickeco.ie', founded: '2019',
    contacts: [
      { id: 'ct40', name: 'Cathal Moran', email: 'cathal@limerickeco.ie', phone: '+353 61 789 0123', role: 'CEO', isDecisionMaker: true },
      { id: 'ct41', name: 'Edel Sheehan', email: 'edel@limerickeco.ie', phone: '+353 61 789 0124', role: 'Sales Manager', isDecisionMaker: false },
    ],
    deals: [
      {
        id: 'd18', product: 'AI Workforce', mrr: 380, setupFee: 1200, stage: 'Closed Won',
        qualifiedAnswers: ['Yes', 'Yes', 'Yes'],
        demoOutcome: 'Completed - Positive',
        activities: [
          { id: 'a50', type: 'Call', description: 'Discovery call — Cathal wants AI for lead follow-up', outcome: 'Positive', duration: '25 min', timestamp: '2026-01-20 10:00' },
          { id: 'a51', type: 'Demo', description: 'AI Workforce demo — automated email sequences impressed Cathal', outcome: 'Positive', duration: '35 min', timestamp: '2026-01-27 14:00' },
          { id: 'a52', type: 'Proposal', description: 'Pro AI Workforce plan accepted', timestamp: '2026-02-01 11:00' },
        ],
        createdAt: '2026-01-19',
      },
      {
        id: 'd19', product: 'SolarPilot', mrr: 540, setupFee: 1500, stage: 'Closed Lost',
        qualifiedAnswers: ['Yes', 'No', 'No'],
        demoOutcome: 'Completed - Negative',
        closeReason: 'Price',
        activities: [
          { id: 'a53', type: 'Email', description: 'Cross-sell SolarPilot to existing AI Workforce customer', timestamp: '2026-02-15 10:00' },
          { id: 'a54', type: 'Call', description: 'Cathal interested but felt pricing too high for team size', outcome: 'Negative', duration: '18 min', timestamp: '2026-02-20 11:00' },
          { id: 'a55', type: 'Demo', description: 'Demo delivered but budget not available until next quarter', outcome: 'Negative', duration: '30 min', timestamp: '2026-02-27 14:00' },
        ],
        createdAt: '2026-02-14',
      },
    ],
    onboarding: {
      solarPilot: [
        { label: 'Account Created', complete: false },
        { label: 'Data Migration', complete: false },
        { label: 'Team Trained', complete: false },
        { label: 'Live', complete: false },
      ],
      aiWorkforce: [
        { label: 'Needs Assessment', complete: true },
        { label: 'Configuration', complete: true },
        { label: 'Testing', complete: true },
        { label: 'Live', complete: true },
      ],
    },
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get the style config for a pipeline stage */
export function getStageStyle(stage: PipelineStage) {
  return STAGES.find(s => s.label === stage) || STAGES[0]
}

/** Format a number as EUR currency (no decimals) */
export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val)
}

/** Flatten all deals across companies, attaching company info */
export function getAllDeals(): { deal: Deal; company: Company }[] {
  const results: { deal: Deal; company: Company }[] = []
  for (const company of COMPANIES) {
    for (const deal of company.deals) {
      results.push({ deal, company })
    }
  }
  return results
}

/** Find the parent company for a given deal ID */
export function getDealCompany(dealId: string): Company | undefined {
  return COMPANIES.find(c => c.deals.some(d => d.id === dealId))
}
