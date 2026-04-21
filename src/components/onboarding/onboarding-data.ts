// onboarding-data.ts — Static data constants for SolarPilot Onboarding

export const COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry',
  'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
];

export const PROVINCES: Record<string, string[]> = {
  Connacht: ['Galway', 'Leitrim', 'Mayo', 'Roscommon', 'Sligo'],
  Leinster: ['Carlow', 'Dublin', 'Kildare', 'Kilkenny', 'Laois', 'Longford', 'Louth', 'Meath', 'Offaly', 'Westmeath', 'Wexford', 'Wicklow'],
  Munster: ['Clare', 'Cork', 'Kerry', 'Limerick', 'Tipperary', 'Waterford'],
  Ulster: ['Cavan', 'Donegal', 'Monaghan'],
};

export const PLANS = [
  { id: 'starter', name: 'Starter', price: 199, tagline: 'Solo installers',
    feat: ['Up to 30 jobs / month', 'Basic pipeline reporting', 'Email support (48h)'] },
  { id: 'pro', name: 'Pro', price: 349, tagline: 'Small teams', popular: true,
    feat: ['Unlimited jobs', 'API access + webhooks', 'PPA earnings dashboard', 'Priority support (4h)', 'AI Co-Pilot for proposals'] },
  { id: 'enterprise', name: 'Enterprise', price: 699, tagline: 'Multi-region',
    feat: ['Custom SLA + uptime', 'White-label homeowner portal', 'Dedicated CSM', 'Audit + SSO'] },
];

export const DOCS = [
  { id: 'msa', name: 'Master Service Agreement', desc: 'Legal terms of your subscription', pages: 12 },
  { id: 'nda', name: 'Non-Disclosure Agreement', desc: 'Protects confidential information', pages: 4 },
  { id: 'dpa', name: 'Data Processing Agreement', desc: 'GDPR compliance for client data', pages: 8 },
  { id: 'tos', name: 'Terms of Service', desc: 'Acceptable use of SolarPilot', pages: 6 },
];

export const STEPS = [
  { key: 'account', label: 'Account', icon: 'User' },
  { key: 'company', label: 'Company', icon: 'Office' },
  { key: 'territory', label: 'Territory', icon: 'Map' },
  { key: 'tools', label: 'Tools', icon: 'Plug' },
  { key: 'legal', label: 'Legal', icon: 'Doc' },
  { key: 'finance', label: 'Finance', icon: 'Euro' },
  { key: 'tech', label: 'Tech', icon: 'Shield' },
  { key: 'welcome', label: 'Training', icon: 'Book' },
];

export interface IntegrationItem {
  id: string;
  name: string;
  desc: string;
  cat: string;
  domain: string;
  popular: boolean;
  fee: number;
}

export const INTEGRATIONS: IntegrationItem[] = [
  { id: 'seai', name: 'SEAI Grant Portal', desc: 'Homeowner grant applications & BER submissions', cat: 'Grants', domain: 'seai.ie', popular: true, fee: 0 },
  { id: 'esb',  name: 'ESB Networks NC6', desc: 'Micro-generation export notifications', cat: 'Grants', domain: 'esbnetworks.ie', popular: true, fee: 120 },
  { id: 'mprn', name: 'MPRN Lookup', desc: 'Verify meter numbers against ESB register', cat: 'Grants', domain: 'mprnsearch.ie', popular: false, fee: 40 },
  { id: 'solis',     name: 'Solis Cloud',         desc: 'Monitor installed Solis inverters', cat: 'Hardware', domain: 'solisinverters.com', popular: true, fee: 180 },
  { id: 'solaredge', name: 'SolarEdge Monitoring', desc: 'Optimiser-level performance data', cat: 'Hardware', domain: 'solaredge.com', popular: true, fee: 220 },
  { id: 'fronius',   name: 'Fronius Solar.web',   desc: 'Fronius inverter fleet & alerts', cat: 'Hardware', domain: 'fronius.com', popular: false, fee: 180 },
  { id: 'huawei',    name: 'Huawei FusionSolar',  desc: 'Residential & battery monitoring', cat: 'Hardware', domain: 'solar.huawei.com', popular: false, fee: 180 },
  { id: 'growatt',   name: 'Growatt ShinePhone',  desc: 'Entry-tier inverter monitoring', cat: 'Hardware', domain: 'growatt.com', popular: false, fee: 140 },
  { id: 'tesla',     name: 'Tesla Powerwall',     desc: 'Battery status via Tesla API', cat: 'Hardware', domain: 'tesla.com', popular: false, fee: 260 },
  { id: 'aurora',    name: 'Aurora Solar', desc: 'Roof design, shading, performance sims', cat: 'Design', domain: 'aurorasolar.com', popular: true, fee: 280 },
  { id: 'openSolar', name: 'OpenSolar',    desc: 'Free 3D proposal & design tool', cat: 'Design', domain: 'opensolar.com', popular: false, fee: 120 },
  { id: 'nearmap',   name: 'Nearmap',      desc: 'High-res aerial imagery of Irish rooftops', cat: 'Design', domain: 'nearmap.com', popular: false, fee: 160 },
  { id: 'xero',       name: 'Xero',            desc: 'Accounting + VAT 3 / RCT returns', cat: 'Finance', domain: 'xero.com', popular: true, fee: 150 },
  { id: 'surf',       name: 'Surf Accounts',   desc: 'Irish SME accounting, CSO-aligned', cat: 'Finance', domain: 'surfaccounts.com', popular: false, fee: 150 },
  { id: 'sage',       name: 'Sage Business',   desc: 'Payroll + accounting suite', cat: 'Finance', domain: 'sage.com', popular: false, fee: 180 },
  { id: 'stripe',     name: 'Stripe',          desc: 'Deposits, subscriptions, refunds', cat: 'Finance', domain: 'stripe.com', popular: true, fee: 90 },
  { id: 'gocardless', name: 'GoCardless',      desc: 'SEPA direct debit for PPA customers', cat: 'Finance', domain: 'gocardless.com', popular: false, fee: 110 },
  { id: 'revenue',    name: 'ROS (Revenue.ie)', desc: 'RCT subbie notifications, VAT returns', cat: 'Finance', domain: 'revenue.ie', popular: false, fee: 240 },
  { id: 'hubspot',    name: 'HubSpot',    desc: 'Sync contacts, pipelines, sequences', cat: 'CRM', domain: 'hubspot.com', popular: false, fee: 200 },
  { id: 'pipedrive',  name: 'Pipedrive',  desc: 'Deal pipeline + activities', cat: 'CRM', domain: 'pipedrive.com', popular: false, fee: 180 },
  { id: 'salesforce', name: 'Salesforce', desc: 'Enterprise CRM sync', cat: 'CRM', domain: 'salesforce.com', popular: false, fee: 420 },
  { id: 'gmail',    name: 'Google Workspace', desc: 'Gmail, Calendar, Drive, Meet', cat: 'Comms', domain: 'workspace.google.com', popular: true, fee: 60 },
  { id: 'ms365',    name: 'Microsoft 365',    desc: 'Outlook, Teams, SharePoint', cat: 'Comms', domain: 'microsoft365.com', popular: false, fee: 80 },
  { id: 'whatsapp', name: 'WhatsApp Business', desc: 'Homeowner messaging on the channel they use', cat: 'Comms', domain: 'business.whatsapp.com', popular: true, fee: 140 },
  { id: 'twilio',   name: 'Twilio SMS',       desc: 'Appointment + install-day reminders', cat: 'Comms', domain: 'twilio.com', popular: false, fee: 110 },
  { id: 'postmark', name: 'Postmark',         desc: 'Transactional email delivery', cat: 'Comms', domain: 'postmarkapp.com', popular: false, fee: 60 },
  { id: 'servicem8',  name: 'ServiceM8',    desc: 'Install scheduling & job sheets', cat: 'Field ops', domain: 'servicem8.com', popular: false, fee: 160 },
  { id: 'fergus',     name: 'Fergus',       desc: 'Job management for trades', cat: 'Field ops', domain: 'fergus.com', popular: false, fee: 160 },
  { id: 'companycam', name: 'CompanyCam',   desc: 'Time-stamped site + install photos', cat: 'Field ops', domain: 'companycam.com', popular: false, fee: 90 },
];

export const INTEGRATION_CATS = ['All', 'Grants', 'Hardware', 'Design', 'Finance', 'CRM', 'Comms', 'Field ops'];

export const TIME_SLOTS = ['09:30', '10:30', '11:30', '14:00', '15:00', '16:00'];

export const FOCUS_OPTIONS = ['Lead generation', 'Grant paperwork', 'Homeowner proposals', 'PPA earnings', 'AI Co-Pilot', 'Team workflows'];

export function addMins(t: string, mins: number): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}
