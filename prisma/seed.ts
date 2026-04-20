import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// 8 Deal Pipeline Stages
const STAGES = {
  NEW_LEAD: 'new_lead',
  CONTACTED: 'contacted',
  DISCOVERY: 'discovery_call',
  DEMO_BOOKED: 'demo_booked',
  DEMO_DONE: 'demo_done',
  PROPOSAL: 'proposal_sent',
  NEGOTIATION: 'negotiation',
  WON: 'closed_won',
} as const

const CLOSE_REASONS = ['price', 'timing', 'competitor', 'no_response', 'not_interested'] as const

async function main() {
  console.log('🌱 Seeding SolarPilot Agency CRM...')

  // Clean
  await db.dealActivity.deleteMany()
  await db.onboarding.deleteMany()
  await db.deal.deleteMany()
  await db.contact.deleteMany()
  await db.company.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()

  // ===== ADMIN =====
  const passwordHash = await bcrypt.hash('Renewably2024!', 12)
  const admin = await db.user.create({
    data: {
      email: 'admin@renewably.ie',
      name: 'Cal Chesters',
      passwordHash,
      role: 'admin',
      phone: '+353 87 395 8424',
    },
  })
  console.log('✅ Admin: admin@renewably.ie')

  // ===== COMPANIES =====
  const companies = await db.company.createMany({
    data: [
      { name: 'SunPower Installations', counties: 'Dublin, Meath, Louth', seaiReg: 'SEAI-4821', teamSize: 12, installsPerYear: 85, status: 'active', website: 'sunpowerinstalls.ie', notes: 'Top-performing client. Uses full AI workforce + SolarPilot CRM.' },
      { name: 'Midlands Solar Solutions', counties: 'Offaly, Westmeath, Longford', seaiReg: 'SEAI-3194', teamSize: 7, installsPerYear: 42, status: 'active', website: 'midlandsolar.ie', notes: 'Specialises in agricultural installations. Growth plan client.' },
      { name: 'SouthEast PV', counties: 'Waterford, Wexford, Kilkenny', seaiReg: 'SEAI-5567', teamSize: 9, installsPerYear: 63, status: 'active', website: 'sepv.ie', notes: 'Rapidly growing. Pro plan with full AI workforce deployed.' },
      { name: 'Cork Renewable Energy', counties: 'Cork, Kerry', seaiReg: 'SEAI-6023', teamSize: 5, installsPerYear: 28, status: 'active', website: 'corkrenewables.ie', notes: 'Newer partner. Onboarding in progress, SolarPilot setup 60% done.' },
      { name: 'West Coast Solar', counties: 'Galway, Clare, Mayo', seaiReg: 'SEAI-2781', teamSize: 8, installsPerYear: 55, status: 'active', website: 'westcoastsolar.ie', notes: 'Reliable partner. Growth plan, up-selling AI Workforce.' },
      { name: 'Capital PV Systems', counties: 'Dublin, Kildare, Wicklow', seaiReg: 'SEAI-8104', teamSize: 6, installsPerYear: 38, status: 'active', website: 'capitalpv.ie', notes: 'Dublin-based residential specialist. Active user, good engagement.' },
      { name: 'Kildare Energy Co', counties: 'Kildare, Meath, Offaly', seaiReg: 'SEAI-4455', teamSize: 10, installsPerYear: 72, status: 'active', website: 'kildareenergy.ie', notes: 'Commercial focus. Recently upgraded to Pro. High AI workforce usage.' },
      { name: 'Rebel County Solar', counties: 'Cork, Limerick', seaiReg: 'SEAI-1192', teamSize: 4, installsPerYear: 22, status: 'churned', website: 'rebelsolar.ie', notes: 'Churned after 4 months. Cited pricing concerns. Follow up in Q3.' },
      // Prospects / Pipeline companies
      { name: 'GreenLight Energy', counties: 'Tipperary, Limerick', teamSize: 6, installsPerYear: 35, status: 'prospect', notes: 'Enquired via website. Large agricultural focus.' },
      { name: 'Photon Electrical', counties: 'Dublin, Fingal', seaiReg: 'SEAI-9023', teamSize: 3, installsPerYear: 18, status: 'prospect', notes: 'Small outfit looking to scale with AI. Discovery call booked.' },
      { name: 'Shannonside Solar', counties: 'Clare, Limerick, Tipperary', teamSize: 5, installsPerYear: 30, status: 'prospect', notes: 'Referral from SunPower Installations. Strong interest in both products.' },
      { name: 'Donegal Solar Co', counties: 'Donegal, Sligo, Leitrim', seaiReg: 'SEAI-3345', teamSize: 4, installsPerYear: 20, status: 'prospect', notes: 'Cold outreach. Responded to LinkedIn DM. Initial interest.' },
      { name: 'Munster Renewables', counties: 'Cork, Kerry, Limerick', teamSize: 11, installsPerYear: 78, status: 'prospect', notes: 'Large installer. Currently evaluating multiple CRM options. Demo scheduled.' },
      { name: 'Bray PV Solutions', counties: 'Wicklow, Dublin', teamSize: 3, installsPerYear: 15, status: 'prospect', notes: 'Small residential installer. Price-sensitive. Need to pitch starter plan.' },
    ],
  })
  console.log(`✅ ${companies.count} companies created`)

  const allCompanies = await db.company.findMany({ orderBy: { createdAt: 'asc' } })
  const companyMap = new Map(allCompanies.map(c => [c.name, c]))

  // ===== CONTACTS =====
  await db.contact.createMany({
    data: [
      // SunPower Installations
      { companyId: companyMap.get('SunPower Installations')!.id, name: 'James Murphy', email: 'james@sunpowerinstalls.ie', phone: '+353 1 234 5678', role: 'Owner', isDecisionMaker: true },
      { companyId: companyMap.get('SunPower Installations')!.id, name: 'Sarah Byrne', email: 'sarah@sunpowerinstalls.ie', phone: '+353 1 234 5679', role: 'Operations Manager', isDecisionMaker: false },
      // Midlands Solar Solutions
      { companyId: companyMap.get('Midlands Solar Solutions')!.id, name: 'Emma Walsh', email: 'emma@midlandsolar.ie', phone: '+353 57 123 4567', role: 'Owner', isDecisionMaker: true },
      // SouthEast PV
      { companyId: companyMap.get('SouthEast PV')!.id, name: 'Conor Brennan', email: 'conor@sepv.ie', phone: '+353 51 234 5678', role: 'Managing Director', isDecisionMaker: true },
      { companyId: companyMap.get('SouthEast PV')!.id, name: 'Linda Hayes', email: 'linda@sepv.ie', phone: '+353 51 234 5679', role: 'Sales Director', isDecisionMaker: false },
      // Cork Renewable Energy
      { companyId: companyMap.get('Cork Renewable Energy')!.id, name: 'Fiona Sheehan', email: 'fiona@corkrenewables.ie', phone: '+353 21 123 4567', role: 'Owner', isDecisionMaker: true },
      { companyId: companyMap.get('Cork Renewable Energy')!.id, name: 'Donal O\'Brien', email: 'donal@corkrenewables.ie', phone: '+353 21 123 4568', role: 'Operations Lead', isDecisionMaker: false },
      // West Coast Solar
      { companyId: companyMap.get('West Coast Solar')!.id, name: 'Liam O\'Brien', email: 'liam@westcoastsolar.ie', phone: '+353 91 234 567', role: 'Owner', isDecisionMaker: true },
      // Capital PV Systems
      { companyId: companyMap.get('Capital PV Systems')!.id, name: 'Aisling Doyle', email: 'aisling@capitalpv.ie', phone: '+353 1 345 6789', role: 'Owner', isDecisionMaker: true },
      { companyId: companyMap.get('Capital PV Systems')!.id, name: 'Rob Whelan', email: 'rob@capitalpv.ie', phone: '+353 1 345 6790', role: 'Project Manager', isDecisionMaker: false },
      // Kildare Energy Co
      { companyId: companyMap.get('Kildare Energy Co')!.id, name: 'Mark Dunne', email: 'mark@kildareenergy.ie', phone: '+353 45 123 4567', role: 'Director', isDecisionMaker: true },
      // Rebel County Solar
      { companyId: companyMap.get('Rebel County Solar')!.id, name: 'Cillian O\'Sullivan', email: 'cillian@rebelsolar.ie', phone: '+353 21 456 7890', role: 'Owner', isDecisionMaker: true },
      // GreenLight Energy
      { companyId: companyMap.get('GreenLight Energy')!.id, name: 'Pat Foley', email: 'pat@greenlightenergy.ie', phone: '+353 67 234 5678', role: 'Owner', isDecisionMaker: true },
      { companyId: companyMap.get('GreenLight Energy')!.id, name: 'Mairead Ryan', email: 'mairead@greenlightenergy.ie', phone: '+353 67 234 5679', role: 'Admin', isDecisionMaker: false },
      // Photon Electrical
      { companyId: companyMap.get('Photon Electrical')!.id, name: 'Derek Chen', email: 'derek@photonelectrical.ie', phone: '+353 1 567 8901', role: 'Owner', isDecisionMaker: true },
      // Shannonside Solar
      { companyId: companyMap.get('Shannonside Solar')!.id, name: 'Tommy McNamara', email: 'tommy@shannonsidesolar.ie', phone: '+353 61 345 6789', role: 'Owner', isDecisionMaker: true },
      // Donegal Solar Co
      { companyId: companyMap.get('Donegal Solar Co')!.id, name: 'Eamon Gallagher', email: 'eamon@donegalsolar.ie', phone: '+353 74 234 5678', role: 'Managing Director', isDecisionMaker: true },
      // Munster Renewables
      { companyId: companyMap.get('Munster Renewables')!.id, name: 'Aoife Fitzgerald', email: 'aoife@munsterrenewables.ie', phone: '+353 22 567 8901', role: 'CEO', isDecisionMaker: true },
      { companyId: companyMap.get('Munster Renewables')!.id, name: 'Declan O\'Mahony', email: 'declan@munsterrenewables.ie', phone: '+353 22 567 8902', role: 'Head of Operations', isDecisionMaker: false },
      // Bray PV Solutions
      { companyId: companyMap.get('Bray PV Solutions')!.id, name: 'Neil Kavanagh', email: 'neil@braypv.ie', phone: '+353 1 678 9012', role: 'Owner', isDecisionMaker: true },
    ],
  })
  console.log('✅ Contacts created')

  // ===== DEALS =====
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const deals = await db.deal.createMany({
    data: [
      // WON DEALS (closed_won — active clients)
      { companyId: companyMap.get('SunPower Installations')!.id, product: 'both', mrr: 1530, setupFee: 2500, stage: STAGES.WON, value: 20860, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 85+ installs/year', q2: 'Currently using spreadsheets and email', q3: 'Budget approved for Q1' }), demoOutcome: 'completed', notes: 'Signed Pro plan. Full SolarPilot + 5 AI workers. Onboarding complete.' },
      { companyId: companyMap.get('Midlands Solar Solutions')!.id, product: 'solarpilot', mrr: 980, setupFee: 1500, stage: STAGES.WON, value: 13310, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 40+ installs/year', q2: 'No CRM currently', q3: 'Looking for Q1 start' }), demoOutcome: 'completed', notes: 'Growth plan. SolarPilot only. AI Workforce upsell planned for Q3.' },
      { companyId: companyMap.get('SouthEast PV')!.id, product: 'both', mrr: 1225, setupFee: 2500, stage: STAGES.WON, value: 17200, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 60+ installs/year', q2: 'Legacy CRM, unhappy with it', q3: 'Ready to switch immediately' }), demoOutcome: 'completed', notes: 'Pro plan. Full deployment. Highest AI usage among all clients.' },
      { companyId: companyMap.get('Cork Renewable Energy')!.id, product: 'solarpilot', mrr: 490, setupFee: 1000, stage: STAGES.WON, value: 6880, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 25+ installs/year', q2: 'Basic spreadsheet tracking', q3: 'Budget available now' }), demoOutcome: 'completed', notes: 'Starter plan. Onboarding 60% complete. AI workforce demo pending.' },
      { companyId: companyMap.get('West Coast Solar')!.id, product: 'solarpilot', mrr: 980, setupFee: 1500, stage: STAGES.WON, value: 13310, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 50+ installs/year', q2: 'Using Jobber, not ideal for solar', q3: 'Q1 budget cycle' }), demoOutcome: 'completed', notes: 'Growth plan. Considering AI Workforce upgrade after Q2 review.' },
      { companyId: companyMap.get('Capital PV Systems')!.id, product: 'solarpilot', mrr: 735, setupFee: 1500, stage: STAGES.WON, value: 10320, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 35+ installs/year', q2: 'Pen and paper mostly', q3: 'Eager to modernise' }), demoOutcome: 'completed', notes: 'Growth plan. Good engagement with SolarPilot. Active user.' },
      { companyId: companyMap.get('Kildare Energy Co')!.id, product: 'both', mrr: 1530, setupFee: 2500, stage: STAGES.WON, value: 20860, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 70+ installs/year', q2: 'Salesforce — too complex, too expensive', q3: 'Approved for immediate switch' }), demoOutcome: 'completed', notes: 'Pro plan. Recently upgraded. High satisfaction. 6 AI workers deployed.' },
      { companyId: companyMap.get('Rebel County Solar')!.id, product: 'solarpilot', mrr: 490, setupFee: 1000, stage: STAGES.WON, value: 6880, assignedToId: admin.id, closeReason: 'price', notes: 'Churned. Found cheaper alternative. Said they might return when they scale.' },

      // NEGOTIATION STAGE
      { companyId: companyMap.get('GreenLight Energy')!.id, product: 'both', mrr: 1225, setupFee: 2500, stage: STAGES.NEGOTIATION, value: 17200, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 35+ installs/year', q2: 'No CRM, spreadsheet chaos', q3: 'Budget depends on ROI demo' }), demoOutcome: 'completed', notes: 'Went well on demo. Negotiating on setup fee. Decision expected this week.' },
      { companyId: companyMap.get('Shannonside Solar')!.id, product: 'solarpilot', mrr: 980, setupFee: 1500, stage: STAGES.NEGOTIATION, value: 13310, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 30+ installs/year', q2: 'Tried GoHighLevel, wrong fit', q3: 'Wants to start next month' }), demoOutcome: 'completed', notes: 'Referral from SunPower. Wants Growth plan. Asking about multi-site support.' },

      // PROPOSAL SENT
      { companyId: companyMap.get('Photon Electrical')!.id, product: 'solarpilot', mrr: 490, setupFee: 1000, stage: STAGES.PROPOSAL, value: 6880, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 15+ installs/year', q2: 'Nothing formal', q3: 'Limited budget, starter preferred' }), demoOutcome: 'completed', notes: 'Proposal sent for Starter plan. Small team but keen to modernise. Awaiting response.' },
      { companyId: companyMap.get('Munster Renewables')!.id, product: 'both', mrr: 1530, setupFee: 2500, stage: STAGES.PROPOSAL, value: 20860, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 75+ installs/year', q2: 'Evaluating HubSpot vs SolarPilot', q3: 'Decision by end of month' }), demoOutcome: 'completed', notes: 'Big deal. Pro plan proposal sent. Comparing with HubSpot. Strong fit for AI Workforce.' },

      // DEMO DONE
      { companyId: companyMap.get('Donegal Solar Co')!.id, product: 'solarpilot', mrr: 735, setupFee: 1500, stage: STAGES.DEMO_DONE, value: 10320, assignedToId: admin.id, qualifiedAnswers: JSON.stringify({ q1: 'Yes, 20+ installs/year', q2: 'Basic CRM, not solar-specific', q3: 'Interested but cautious' }), demoOutcome: 'completed', notes: 'Demo went well. Eamon impressed with AI features. Sending proposal this week.' },

      // DEMO BOOKED
      { companyId: companyMap.get('Bray PV Solutions')!.id, product: 'solarpilot', mrr: 490, setupFee: 1000, stage: STAGES.DEMO_BOOKED, value: 6880, assignedToId: admin.id, demoOutcome: 'booked', notes: 'Demo booked for next Tuesday. Price-sensitive — pitch starter plan value.' },

      // DISCOVERY CALL
      { companyId: companyMap.get('Bray PV Solutions')!.id, product: 'ai_workforce', mrr: 735, setupFee: 1500, stage: STAGES.DISCOVERY, value: 10320, assignedToId: admin.id, notes: 'Discovery call about AI Workforce upsell. Showed interest after seeing SunPower case study.' },
    ],
  })
  console.log(`✅ ${deals.count} deals created`)

  // ===== DEAL ACTIVITIES =====
  const allDeals = await db.deal.findMany({ orderBy: { createdAt: 'asc' } })

  const activities = await db.dealActivity.createMany({
    data: [
      // GreenLight Energy — recent negotiation activity
      { dealId: allDeals[8].id, userId: admin.id, type: 'call', title: 'Negotiation call with Pat Foley', content: 'Discussed setup fee discount for annual prepayment. Pat wants 10% off. Talking to Cal about approval.', createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      { dealId: allDeals[8].id, userId: admin.id, type: 'email', title: 'Sent revised proposal', content: 'Updated proposal with adjusted pricing. Highlighted 3-year ROI projection showing 340% return.', createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000) },
      { dealId: allDeals[8].id, userId: admin.id, type: 'demo', title: 'Product demo for GreenLight Energy', content: 'Full demo of SolarPilot + AI Workforce. Pat and Mairead attended. Very engaged, lots of questions about grant automation.', createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[8].id, userId: admin.id, type: 'call', title: 'Discovery call', content: 'Initial discovery. Pat runs 35 installs/year, mainly agricultural. Losing leads due to slow response times. Perfect AI Workforce fit.', createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[8].id, userId: admin.id, type: 'email', title: 'Website enquiry response', content: 'Responded to web form submission within 30 minutes. Sent info pack and booked discovery call.', createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },

      // Shannonside Solar — negotiation
      { dealId: allDeals[9].id, userId: admin.id, type: 'call', title: 'Follow-up with Tommy', content: 'Tommy wants to know if we can handle multi-site scheduling. Checking with product team.', createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000) },
      { dealId: allDeals[9].id, userId: admin.id, type: 'demo', title: 'Demo for Shannonside Solar', content: 'Tommy referred by James Murphy (SunPower). Showed him the pipeline view and automated lead follow-up. He was sold on the spot.', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },

      // Munster Renewables — proposal sent
      { dealId: allDeals[11].id, userId: admin.id, type: 'proposal', title: 'Pro plan proposal sent', content: 'Sent detailed proposal for both products. €1,530/mrr + €2,500 setup. Aoife reviewing with Declan. Decision expected by April 25.', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[11].id, userId: admin.id, type: 'demo', title: 'Demo for Munster Renewables', content: 'Large team demo — Aoife, Declan, and 2 operations staff. Very thorough Q&A. Compared favourably against HubSpot for solar-specific features.', createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },

      // Photon Electrical — proposal sent
      { dealId: allDeals[10].id, userId: admin.id, type: 'proposal', title: 'Starter plan proposal', content: 'Sent Starter plan proposal. €490/mrr + €1,000 setup. Derek reviewing, small team budget constraints.', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[10].id, userId: admin.id, type: 'demo', title: 'Demo for Photon Electrical', content: 'Derek joined solo. Impressed by the speed of lead capture and automated scheduling. Concerned about learning curve for small team.', createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },

      // Donegal Solar — demo done, proposal coming
      { dealId: allDeals[12].id, userId: admin.id, type: 'demo', title: 'Demo for Donegal Solar Co', content: 'Eamon joined via video call. Showed grant automation and customer communication features. He wants a proposal for Growth plan.', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[12].id, userId: admin.id, type: 'call', title: 'Discovery call', content: 'Eamon responded to LinkedIn outreach. Runs 20 installs/year across Donegal, Sligo, Leitrim. Wants to modernise operations.', createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },

      // Bray PV — demo booked
      { dealId: allDeals[13].id, userId: admin.id, type: 'email', title: 'Demo confirmation', content: 'Confirmed demo for next Tuesday 2pm. Sending calendar invite. Neil will join solo.', createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000) },
      { dealId: allDeals[13].id, userId: admin.id, type: 'call', title: 'Initial contact', content: 'Spoke to Neil for 15 mins. Very interested but price-sensitive. Pitching Starter plan value proposition.', createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },

      // Active client activities
      { dealId: allDeals[0].id, userId: admin.id, type: 'note', title: 'Quarterly review scheduled', content: 'QBR with James and Sarah booked for April 28. Preparing usage stats and ROI report.', createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[2].id, userId: admin.id, type: 'call', title: 'Upsell discussion with Conor', content: 'Conor interested in adding 2 more AI workers. Discussing pricing for expanded workforce. Good expansion signal.', createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[3].id, userId: admin.id, type: 'email', title: 'Onboarding progress update', content: 'Sent Fiona updated onboarding checklist. SolarPilot setup at 60%. Need SEAI integration credentials to continue.', createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { dealId: allDeals[6].id, userId: admin.id, type: 'call', title: 'Check-in with Mark', content: 'Mark very happy with Pro plan. Using all 6 AI workers at full capacity. Wants to add Site Assessor role.', createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
    ],
  })
  console.log(`✅ ${activities.count} activities created`)

  // ===== ONBOARDING STATUS =====
  await db.onboarding.createMany({
    data: [
      { companyId: companyMap.get('SunPower Installations')!.id, solarpilotProgress: 100, aiWorkforceProgress: 100, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), aiWorkforceSteps: JSON.stringify([{ step: 'Role configuration', done: true }, { step: 'Process mapping', done: true }, { step: 'AI training', done: true }, { step: 'Testing', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('Midlands Solar Solutions')!.id, solarpilotProgress: 100, aiWorkforceProgress: 0, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('SouthEast PV')!.id, solarpilotProgress: 100, aiWorkforceProgress: 100, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), aiWorkforceSteps: JSON.stringify([{ step: 'Role configuration', done: true }, { step: 'Process mapping', done: true }, { step: 'AI training', done: true }, { step: 'Testing', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('Cork Renewable Energy')!.id, solarpilotProgress: 60, aiWorkforceProgress: 0, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: false }, { step: 'Data migration', done: false }, { step: 'Go live', done: false }]), startedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('West Coast Solar')!.id, solarpilotProgress: 100, aiWorkforceProgress: 0, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('Capital PV Systems')!.id, solarpilotProgress: 100, aiWorkforceProgress: 0, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('Kildare Energy Co')!.id, solarpilotProgress: 100, aiWorkforceProgress: 100, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), aiWorkforceSteps: JSON.stringify([{ step: 'Role configuration', done: true }, { step: 'Process mapping', done: true }, { step: 'AI training', done: true }, { step: 'Testing', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
      { companyId: companyMap.get('Rebel County Solar')!.id, solarpilotProgress: 100, aiWorkforceProgress: 0, solarpilotSteps: JSON.stringify([{ step: 'Account setup', done: true }, { step: 'SEAI integration', done: true }, { step: 'Team training', done: true }, { step: 'Data migration', done: true }, { step: 'Go live', done: true }]), startedAt: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000), completedAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
    ],
  })
  console.log('✅ Onboarding records created')

  console.log('\n🎉 Seed complete! Login: admin@renewably.ie / Renewably2024!')
  console.log('📊 14 companies | 19 contacts | 15 deals | 20 activities | 8 onboarding records')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
