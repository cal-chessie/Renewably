import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const db = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding CRM database...');

  // Clean existing data
  await db.meeting.deleteMany();
  await db.dealTag.deleteMany();
  await db.contactTag.deleteMany();
  await db.tag.deleteMany();
  await db.task.deleteMany();
  await db.note.deleteMany();
  await db.proposalLineItem.deleteMany();
  await db.proposal.deleteMany();
  await db.proposalTemplate.deleteMany();
  await db.activity.deleteMany();
  await db.deal.deleteMany();
  await db.pipelineStage.deleteMany();
  await db.contact.deleteMany();
  await db.company.deleteMany();
  await db.googleCalendarConnection.deleteMany();
  await db.user.deleteMany();
  await db.workflowExecution.deleteMany();
  await db.workflowRule.deleteMany();
  await db.reportSnapshot.deleteMany();
  await db.report.deleteMany();

  // ===== USERS =====
  const adminPass = hashPassword('admin123');
  const agentPass = hashPassword('agent123');

  const admin = await db.user.create({
    data: { email: 'admin@renewably.ie', name: 'Sarah O\'Brien', password: adminPass, role: 'admin', phone: '+353 1 234 5678', avatar: null },
  });
  const agent1 = await db.user.create({
    data: { email: 'james@renewably.ie', name: 'James Murphy', password: agentPass, role: 'agent', phone: '+353 1 234 5679', avatar: null },
  });
  const agent2 = await db.user.create({
    data: { email: 'emma@renewably.ie', name: 'Emma Walsh', password: agentPass, role: 'agent', phone: '+353 1 234 5680', avatar: null },
  });

  console.log('✅ Users created');

  // ===== COMPANIES =====
  const companies = await Promise.all([
    db.company.create({ data: { name: 'GreenTech Solutions', website: 'https://greentech.ie', industry: 'Renewable Energy', employees: 45, annualRevenue: '2.5M', city: 'Dublin', country: 'Ireland', phone: '+353 1 555 0001', description: 'Leading provider of commercial solar panel installations in Ireland.' } }),
    db.company.create({ data: { name: 'EcoWind Ireland', website: 'https://ecowind.ie', industry: 'Wind Energy', employees: 120, annualRevenue: '8M', city: 'Cork', country: 'Ireland', phone: '+353 21 555 0002', description: 'Large-scale wind farm development and maintenance company.' } }),
    db.company.create({ data: { name: 'Sustainable Homes Ltd', website: 'https://sus homes.ie', industry: 'Construction', employees: 30, annualRevenue: '1.2M', city: 'Galway', country: 'Ireland', phone: '+353 91 555 0003', description: 'Sustainable residential construction and retrofit specialists.' } }),
    db.company.create({ data: { name: 'CleanHeat Systems', website: 'https://cleanheat.ie', industry: 'HVAC', employees: 25, annualRevenue: '800K', city: 'Limerick', country: 'Ireland', phone: '+353 61 555 0004', description: 'Heat pump and renewable heating system installers.' } }),
    db.company.create({ data: { name: 'Atlantic Energy Partners', website: 'https://atlanticenergy.ie', industry: 'Energy Consulting', employees: 15, annualRevenue: '500K', city: 'Dublin', country: 'Ireland', phone: '+353 1 555 0005', description: 'Energy efficiency consulting for commercial and residential clients.' } }),
    db.company.create({ data: { name: 'BioGreen Fuels', website: 'https://biogreen.ie', industry: 'Bioenergy', employees: 60, annualRevenue: '3.5M', city: 'Waterford', country: 'Ireland', phone: '+353 51 555 0006', description: 'Producer and distributor of biofuels and biomass energy solutions.' } }),
    db.company.create({ data: { name: 'SolarStream Manufacturing', website: 'https://solarstream.ie', industry: 'Manufacturing', employees: 200, annualRevenue: '15M', city: 'Kildare', country: 'Ireland', phone: '+353 45 555 0007', description: 'Ireland\'s leading manufacturer of solar thermal panels.' } }),
    db.company.create({ data: { name: 'EV Charge Network', website: 'https://evchargenetwork.ie', industry: 'Electric Vehicles', employees: 35, annualRevenue: '1.8M', city: 'Dublin', country: 'Ireland', phone: '+353 1 555 0008', description: 'Design and installation of EV charging infrastructure.' } }),
  ]);

  console.log('✅ Companies created');

  // ===== CONTACTS =====
  const contacts = await Promise.all([
    db.contact.create({ data: { firstName: 'Patrick', lastName: 'O\'Sullivan', email: 'patrick@greentech.ie', phone: '+353 1 555 1001', jobTitle: 'CEO', source: 'linkedin', status: 'customer', city: 'Dublin', companyId: companies[0].id, lastContactAt: new Date('2026-04-10') } }),
    db.contact.create({ data: { firstName: 'Ciara', lastName: 'Byrne', email: 'ciara@greentech.ie', phone: '+353 1 555 1002', jobTitle: 'Operations Manager', source: 'referral', status: 'customer', city: 'Dublin', companyId: companies[0].id, lastContactAt: new Date('2026-04-08') } }),
    db.contact.create({ data: { firstName: 'Michael', lastName: 'Fitzgerald', email: 'michael@ecowind.ie', phone: '+353 21 555 2001', jobTitle: 'Technical Director', source: 'website', status: 'prospect', city: 'Cork', companyId: companies[1].id, lastContactAt: new Date('2026-04-05') } }),
    db.contact.create({ data: { firstName: 'Aoife', lastName: 'Kelly', email: 'aoife@sustainablehomes.ie', phone: '+353 91 555 3001', jobTitle: 'Managing Director', source: 'event', status: 'lead', city: 'Galway', companyId: companies[2].id, lastContactAt: new Date('2026-04-11') } }),
    db.contact.create({ data: { firstName: 'Declan', lastName: 'Murphy', email: 'declan@cleanheat.ie', phone: '+353 61 555 4001', jobTitle: 'Founder', source: 'cold', status: 'prospect', city: 'Limerick', companyId: companies[3].id, lastContactAt: new Date('2026-04-03') } }),
    db.contact.create({ data: { firstName: 'Niamh', lastName: 'O\'Connor', email: 'niamh@atlanticenergy.ie', phone: '+353 1 555 5001', jobTitle: 'Lead Consultant', source: 'website', status: 'customer', city: 'Dublin', companyId: companies[4].id, lastContactAt: new Date('2026-04-09') } }),
    db.contact.create({ data: { firstName: 'Sean', lastName: 'Doyle', email: 'sean@biogreen.ie', phone: '+353 51 555 6001', jobTitle: 'Sales Manager', source: 'referral', status: 'customer', city: 'Waterford', companyId: companies[5].id, lastContactAt: new Date('2026-04-07') } }),
    db.contact.create({ data: { firstName: 'Rachel', lastName: 'McCarthy', email: 'rachel@solarstream.ie', phone: '+353 45 555 7001', jobTitle: 'Head of Partnerships', source: 'linkedin', status: 'prospect', city: 'Kildare', companyId: companies[6].id, lastContactAt: new Date('2026-04-06') } }),
    db.contact.create({ data: { firstName: 'Eoin', lastName: 'Ryan', email: 'eoin@evchargenetwork.ie', phone: '+353 1 555 8001', jobTitle: 'CEO', source: 'website', status: 'lead', city: 'Dublin', companyId: companies[7].id, lastContactAt: new Date('2026-04-02') } }),
    db.contact.create({ data: { firstName: 'Lisa', lastName: 'Chen', email: 'lisa.chen@gmail.com', phone: '+353 87 123 4567', jobTitle: 'Homeowner', source: 'website', status: 'lead', city: 'Dublin', description: 'Interested in residential solar panel installation for her 4-bed home in Rathmines.' } }),
    db.contact.create({ data: { firstName: 'Tom', lastName: 'Henderson', email: 'tom@hendersonfarm.ie', phone: '+353 47 555 9001', jobTitle: 'Farm Owner', source: 'referral', status: 'prospect', city: 'Meath', description: 'Looking for solar solution for dairy farm operations.' } }),
    db.contact.create({ data: { firstName: 'Grainne', lastName: 'Ni Riain', email: 'grainne@hotelview.ie', phone: '+353 64 555 1001', jobTitle: 'General Manager', source: 'event', status: 'lead', city: 'Kerry', description: 'Interested in energy efficiency audit for boutique hotel chain.' } }),
  ]);

  console.log('✅ Contacts created');

  // ===== PIPELINE STAGES =====
  const stages = await Promise.all([
    db.pipelineStage.create({ data: { name: 'Lead', order: 1, color: '#94A3B8', isDefault: true } }),
    db.pipelineStage.create({ data: { name: 'Qualified', order: 2, color: '#60A5FA' } }),
    db.pipelineStage.create({ data: { name: 'Proposal', order: 3, color: '#F3D840' } }),
    db.pipelineStage.create({ data: { name: 'Negotiation', order: 4, color: '#FB923C' } }),
    db.pipelineStage.create({ data: { name: 'Won', order: 5, color: '#4ADE80' } }),
    db.pipelineStage.create({ data: { name: 'Lost', order: 6, color: '#F87171' } }),
  ]);

  console.log('✅ Pipeline stages created');

  // ===== DEALS =====
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const twoWeeksAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
  const oneWeekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const inTwoWeeks = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  const inOneMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const inTwoMonths = new Date(now.getFullYear(), now.getMonth() + 2, 1);

  const deals = await Promise.all([
    // Won deals
    db.deal.create({ data: { title: 'GreenTech Solar Installation', value: 45000, currency: 'EUR', probability: 100, stageId: stages[4].id, contactId: contacts[0].id, companyId: companies[0].id, assigneeId: agent1.id, creatorId: admin.id, closeDate: threeMonthsAgo, createdAt: threeMonthsAgo, description: 'Commercial solar panel installation for GreenTech office building.' } }),
    db.deal.create({ data: { title: 'Atlantic Energy Audit Contract', value: 12000, currency: 'EUR', probability: 100, stageId: stages[4].id, contactId: contacts[5].id, companyId: companies[4].id, assigneeId: agent2.id, creatorId: admin.id, closeDate: twoMonthsAgo, createdAt: twoMonthsAgo, description: 'Annual energy audit and consulting contract.' } }),
    db.deal.create({ data: { title: 'BioGreen Marketing Retainer', value: 30000, currency: 'EUR', probability: 100, stageId: stages[4].id, contactId: contacts[6].id, companyId: companies[5].id, assigneeId: agent1.id, creatorId: admin.id, closeDate: oneMonthAgo, createdAt: twoMonthsAgo, description: 'Digital marketing and SEO retainer for BioGreen Fuels.' } }),

    // Active pipeline
    db.deal.create({ data: { title: 'EcoWind Website Redesign', value: 25000, currency: 'EUR', probability: 70, stageId: stages[2].id, contactId: contacts[2].id, companyId: companies[1].id, assigneeId: agent1.id, creatorId: agent1.id, closeDate: inOneMonth, createdAt: twoWeeksAgo, description: 'Full website redesign with lead generation focus.' } }),
    db.deal.create({ data: { title: 'Sustainable Homes SEO', value: 18000, currency: 'EUR', probability: 60, stageId: stages[2].id, contactId: contacts[3].id, companyId: companies[2].id, assigneeId: agent2.id, creatorId: admin.id, closeDate: inOneMonth, createdAt: oneWeekAgo, description: '6-month SEO campaign for sustainable construction company.' } }),
    db.deal.create({ data: { title: 'CleanHeat Digital Strategy', value: 22000, currency: 'EUR', probability: 50, stageId: stages[1].id, contactId: contacts[4].id, companyId: companies[3].id, assigneeId: agent1.id, creatorId: agent1.id, closeDate: inTwoMonths, createdAt: oneWeekAgo, description: 'Comprehensive digital marketing strategy.' } }),
    db.deal.create({ data: { title: 'SolarStream Partnership', value: 50000, currency: 'EUR', probability: 40, stageId: stages[1].id, contactId: contacts[7].id, companyId: companies[6].id, assigneeId: admin.id, creatorId: admin.id, closeDate: inTwoMonths, createdAt: twoWeeksAgo, description: 'Strategic partnership for content marketing and lead gen.' } }),
    db.deal.create({ data: { title: 'EV Charge Network Launch', value: 35000, currency: 'EUR', probability: 30, stageId: stages[0].id, contactId: contacts[8].id, companyId: companies[7].id, assigneeId: agent2.id, creatorId: agent2.id, closeDate: inTwoMonths, createdAt: twoWeeksAgo, description: 'Brand launch campaign and website for new EV charging company.' } }),
    db.deal.create({ data: { title: 'Lisa Chen Residential Solar', value: 8500, currency: 'EUR', probability: 55, stageId: stages[2].id, contactId: contacts[9].id, assigneeId: agent2.id, creatorId: agent2.id, closeDate: inTwoWeeks, createdAt: oneWeekAgo, description: 'Lead generation campaign for residential solar installation.' } }),

    // Recently lost
    db.deal.create({ data: { title: 'FarmTech Agricultural Solar', value: 40000, currency: 'EUR', probability: 0, stageId: stages[5].id, contactId: contacts[10].id, assigneeId: agent1.id, creatorId: agent1.id, closeDate: oneWeekAgo, createdAt: oneMonthAgo, lostReason: 'Budget constraints - postponed to next quarter.' } }),
  ]);

  console.log('✅ Deals created');

  // ===== TAGS =====
  const tags = await Promise.all([
    db.tag.create({ data: { name: 'Hot Lead', color: '#EF4444' } }),
    db.tag.create({ data: { name: 'VIP', color: '#F59E0B' } }),
    db.tag.create({ data: { name: 'Renewable Energy', color: '#22C55E' } }),
    db.tag.create({ data: { name: 'Construction', color: '#8B5CF6' } }),
    db.tag.create({ data: { name: 'Startup', color: '#06B6D4' } }),
    db.tag.create({ data: { name: 'Enterprise', color: '#3B82F6' } }),
    db.tag.create({ data: { name: 'Follow-up Required', color: '#F97316' } }),
    db.tag.create({ data: { name: 'Long-term Contract', color: '#10B981' } }),
  ]);

  // Contact tags
  await Promise.all([
    db.contactTag.create({ data: { contactId: contacts[0].id, tagId: tags[0].id } }),
    db.contactTag.create({ data: { contactId: contacts[0].id, tagId: tags[1].id } }),
    db.contactTag.create({ data: { contactId: contacts[0].id, tagId: tags[2].id } }),
    db.contactTag.create({ data: { contactId: contacts[1].id, tagId: tags[2].id } }),
    db.contactTag.create({ data: { contactId: contacts[2].id, tagId: tags[2].id } }),
    db.contactTag.create({ data: { contactId: contacts[2].id, tagId: tags[5].id } }),
    db.contactTag.create({ data: { contactId: contacts[3].id, tagId: tags[3].id } }),
    db.contactTag.create({ data: { contactId: contacts[3].id, tagId: tags[6].id } }),
    db.contactTag.create({ data: { contactId: contacts[4].id, tagId: tags[4].id } }),
    db.contactTag.create({ data: { contactId: contacts[7].id, tagId: tags[5].id } }),
    db.contactTag.create({ data: { contactId: contacts[7].id, tagId: tags[2].id } }),
    db.contactTag.create({ data: { contactId: contacts[9].id, tagId: tags[6].id } }),
  ]);

  // Deal tags
  await Promise.all([
    db.dealTag.create({ data: { dealId: deals[3].id, tagId: tags[1].id } }),
    db.dealTag.create({ data: { dealId: deals[3].id, tagId: tags[7].id } }),
    db.dealTag.create({ data: { dealId: deals[6].id, tagId: tags[5].id } }),
    db.dealTag.create({ data: { dealId: deals[6].id, tagId: tags[1].id } }),
  ]);

  console.log('✅ Tags created');

  // ===== ACTIVITIES =====
  const activities = await Promise.all([
    db.activity.create({ data: { type: 'call', subject: 'Discovery call with Patrick', description: 'Discussed requirements for upcoming project. Very interested in expanding scope.', duration: 45, status: 'completed', contactId: contacts[0].id, companyId: companies[0].id, userId: agent1.id, createdAt: new Date('2026-04-10T10:00:00'), completedAt: new Date('2026-04-10T10:45:00') } }),
    db.activity.create({ data: { type: 'email', subject: 'Proposal sent to Ciara', description: 'Sent updated proposal for Phase 2 of the marketing campaign.', status: 'completed', contactId: contacts[1].id, companyId: companies[0].id, userId: agent1.id, createdAt: new Date('2026-04-08T14:30:00'), completedAt: new Date('2026-04-08T14:30:00') } }),
    db.activity.create({ data: { type: 'meeting', subject: 'EcoWind requirements workshop', description: 'Full-day workshop to define website redesign requirements.', duration: 480, status: 'completed', contactId: contacts[2].id, companyId: companies[1].id, userId: agent1.id, createdAt: new Date('2026-04-05T09:00:00'), completedAt: new Date('2026-04-05T17:00:00') } }),
    db.activity.create({ data: { type: 'call', subject: 'Follow-up with Aoife', description: 'Left voicemail about scheduling SEO kickoff meeting.', duration: 3, status: 'completed', contactId: contacts[3].id, companyId: companies[2].id, userId: agent2.id, createdAt: new Date('2026-04-11T11:00:00'), completedAt: new Date('2026-04-11T11:03:00') } }),
    db.activity.create({ data: { type: 'email', subject: 'SolarStream partnership intro', description: 'Sent introductory email with case studies and partnership proposal.', status: 'completed', contactId: contacts[7].id, companyId: companies[6].id, userId: admin.id, createdAt: new Date('2026-04-06T09:00:00'), completedAt: new Date('2026-04-06T09:00:00') } }),
    db.activity.create({ data: { type: 'meeting', subject: 'Proposal review with Rachel', description: 'Reviewing partnership proposal and discussing KPIs.', duration: 60, status: 'scheduled', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 10, 0), contactId: contacts[7].id, companyId: companies[6].id, userId: admin.id, createdAt: new Date('2026-04-11T15:00:00') } }),
    db.activity.create({ data: { type: 'call', subject: 'Eoin initial discovery', description: 'First call to understand EV Charge Network requirements.', duration: 30, status: 'completed', contactId: contacts[8].id, companyId: companies[7].id, userId: agent2.id, createdAt: new Date('2026-04-04T14:00:00'), completedAt: new Date('2026-04-04T14:30:00') } }),
    db.activity.create({ data: { type: 'note', subject: 'Lisa needs quick turnaround', description: 'Lisa mentioned she has a tight deadline - needs decision within 2 weeks. Prioritize.', contactId: contacts[9].id, userId: agent2.id, createdAt: new Date('2026-04-09T16:00:00') } }),
    db.activity.create({ data: { type: 'email', subject: 'Niamh monthly report sent', description: 'Sent March performance report showing 23% increase in organic traffic.', status: 'completed', contactId: contacts[5].id, companyId: companies[4].id, userId: agent2.id, createdAt: new Date('2026-04-09T10:00:00'), completedAt: new Date('2026-04-09T10:00:00') } }),
    db.activity.create({ data: { type: 'meeting', subject: 'Declan demo - CleanHeat strategy', description: 'Demo of our digital strategy framework and tools.', duration: 90, status: 'scheduled', scheduledAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 14, 0), contactId: contacts[4].id, companyId: companies[3].id, userId: agent1.id, createdAt: new Date('2026-04-10T11:00:00') } }),
  ]);

  console.log('✅ Activities created');

  // ===== TASKS =====
  const tasks = await Promise.all([
    db.task.create({ data: { title: 'Send EcoWind proposal by Friday', description: 'Complete and send website redesign proposal including timeline and pricing.', priority: 'high', status: 'in_progress', dueDate: inOneMonth, contactId: contacts[2].id, dealId: deals[3].id, assigneeId: agent1.id } }),
    db.task.create({ data: { title: 'Prepare Sustainable Homes SEO audit', description: 'Run technical SEO audit and prepare report for kickoff meeting.', priority: 'high', status: 'todo', dueDate: inTwoWeeks, contactId: contacts[3].id, dealId: deals[4].id, assigneeId: agent2.id } }),
    db.task.create({ data: { title: 'Update BioGreen campaign report', description: 'Compile Q1 campaign performance metrics and recommendations.', priority: 'medium', status: 'todo', dueDate: inTwoWeeks, contactId: contacts[6].id, dealId: deals[2].id, assigneeId: agent1.id } }),
    db.task.create({ data: { title: 'Research EV charging market trends', description: 'Gather market data for EV Charge Network proposal.', priority: 'medium', status: 'in_progress', contactId: contacts[8].id, dealId: deals[7].id, assigneeId: agent2.id } }),
    db.task.create({ data: { title: 'Follow up with Aoife on kickoff date', description: 'Need to schedule the SEO campaign kickoff meeting.', priority: 'high', status: 'todo', dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), contactId: contacts[3].id, dealId: deals[4].id, assigneeId: agent2.id } }),
    db.task.create({ data: { title: 'Review SolarStream case studies', description: 'Update our case study portfolio with recent results.', priority: 'low', status: 'todo', dueDate: inOneMonth, assigneeId: admin.id } }),
    db.task.create({ data: { title: 'Prepare partnership deck for Rachel', description: 'Create partnership presentation with ROI projections.', priority: 'urgent', status: 'in_progress', dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2), contactId: contacts[7].id, dealId: deals[6].id, assigneeId: admin.id } }),
    db.task.create({ data: { title: 'Clean up CRM data', description: 'Review and merge duplicate contacts, update stale information.', priority: 'low', status: 'todo', dueDate: inOneMonth, assigneeId: agent1.id } }),
  ]);

  console.log('✅ Tasks created');

  // ===== NOTES =====
  const notes = await Promise.all([
    db.note.create({ data: { content: 'Patrick is very keen on expanding the digital presence. Mentioned they want to target the UK market as well next year. Budget is flexible for the right proposal.', contactId: contacts[0].id, companyId: companies[0].id, userId: agent1.id, createdAt: new Date('2026-04-10T11:00:00') } }),
    db.note.create({ data: { content: 'EcoWind has a very clear vision for their website. Michael wants a modern, clean design with strong lead gen forms. They have in-house content writers.', contactId: contacts[2].id, companyId: companies[1].id, userId: agent1.id, createdAt: new Date('2026-04-05T17:30:00') } }),
    db.note.create({ data: { content: 'Aoife seems interested but has been hard to reach. She mentioned they are comparing 3 agencies. Need to differentiate on renewable energy expertise.', contactId: contacts[3].id, companyId: companies[2].id, userId: agent2.id, createdAt: new Date('2026-04-11T11:15:00') } }),
    db.note.create({ data: { content: 'SolarStream is a major opportunity - they manufacture panels for all of Ireland. Partnership could bring in 5-10 referral deals per year. Rachel is the key decision maker.', contactId: contacts[7].id, companyId: companies[6].id, userId: admin.id, createdAt: new Date('2026-04-06T10:00:00') } }),
    db.note.create({ data: { content: 'Declan is a no-nonsense business owner. Prefers straightforward communication. Show results, not promises. Best approach is a demo of actual campaigns we have run.', contactId: contacts[4].id, companyId: companies[3].id, userId: agent1.id, createdAt: new Date('2026-04-03T16:00:00') } }),
    db.note.create({ data: { content: 'Lisa is ready to move quickly. She has received quotes from 2 other solar installers and wants us to help her generate more leads for her installation business. Decision expected this week.', contactId: contacts[9].id, userId: agent2.id, createdAt: new Date('2026-04-09T16:30:00') } }),
  ]);

  console.log('✅ Notes created');

  // ===== PROPOSAL TEMPLATES =====
  const templates = await Promise.all([
    db.proposalTemplate.create({
      data: {
        name: 'Website Redesign Package',
        description: 'Standard website redesign with SEO, content strategy, and lead generation.',
        lineItems: JSON.stringify([
          { name: 'Website Design & Development', description: 'Custom responsive design with up to 15 pages', quantity: 1, unitPrice: 12000, total: 12000, sortOrder: 0 },
          { name: 'SEO Audit & Strategy', description: 'Full technical audit and 6-month SEO roadmap', quantity: 1, unitPrice: 3000, total: 3000, sortOrder: 1 },
          { name: 'Content Strategy', description: 'Content calendar and copywriting for 10 pages', quantity: 1, unitPrice: 2500, total: 2500, sortOrder: 2 },
          { name: 'Monthly Maintenance', description: 'Hosting, security updates, and performance monitoring', quantity: 12, unitPrice: 500, total: 6000, sortOrder: 3 },
        ]),
      },
    }),
    db.proposalTemplate.create({
      data: {
        name: 'Digital Marketing Retainer',
        description: 'Monthly digital marketing retainer including PPC, social media, and analytics.',
        lineItems: JSON.stringify([
          { name: 'PPC Campaign Management', description: 'Google Ads and social media advertising', quantity: 1, unitPrice: 2000, total: 2000, sortOrder: 0 },
          { name: 'Social Media Management', description: 'Content creation and posting across 3 platforms', quantity: 1, unitPrice: 1500, total: 1500, sortOrder: 1 },
          { name: 'Analytics & Reporting', description: 'Monthly performance reports and insights', quantity: 1, unitPrice: 500, total: 500, sortOrder: 2 },
        ]),
      },
    }),
  ]);

  console.log('✅ Proposal templates created');

  // ===== PROPOSALS =====
  const tenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10);
  const eightDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8);
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const fiveDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5);
  const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
  const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
  const proposalInOneMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const proposalInTwoWeeks = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  const proposalInThreeWeeks = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 21);

  const proposal1 = await db.proposal.create({
    data: {
      title: 'EcoWind Website Redesign Proposal',
      status: 'accepted',
      totalAmount: 23500,
      validUntil: proposalInThreeWeeks,
      sentAt: tenDaysAgo,
      viewedAt: eightDaysAgo,
      acceptedAt: fiveDaysAgo,
      contactId: contacts[2].id,
      companyId: companies[1].id,
      dealId: deals[3].id,
      templateId: templates[0].id,
      notes: 'Client approved the proposal with minor revisions to the timeline. We agreed on a 3-month delivery schedule.',
      lineItems: {
        create: [
          { name: 'Website Design & Development', description: 'Custom responsive design with up to 20 pages including blog and resource section', quantity: 1, unitPrice: 12000, total: 12000, sortOrder: 0 },
          { name: 'SEO Audit & Strategy', description: 'Full technical audit and 6-month SEO roadmap for renewable energy keywords', quantity: 1, unitPrice: 3000, total: 3000, sortOrder: 1 },
          { name: 'Content Strategy & Copywriting', description: 'Content calendar, brand voice guide, and copywriting for 15 pages', quantity: 1, unitPrice: 3500, total: 3500, sortOrder: 2 },
          { name: 'Lead Generation Integration', description: 'Contact forms, newsletter signup, and CRM integration', quantity: 1, unitPrice: 2500, total: 2500, sortOrder: 3 },
          { name: 'Training & Handover', description: '2-day CMS training for in-house team', quantity: 1, unitPrice: 2500, total: 2500, sortOrder: 4 },
        ],
      },
    },
  });

  const proposal2 = await db.proposal.create({
    data: {
      title: 'Sustainable Homes SEO Campaign',
      status: 'sent',
      totalAmount: 18000,
      validUntil: proposalInTwoWeeks,
      sentAt: threeDaysAgo,
      contactId: contacts[3].id,
      companyId: companies[2].id,
      dealId: deals[4].id,
      templateId: templates[1].id,
      notes: '6-month SEO campaign focused on sustainable construction and green building keywords in Ireland.',
      lineItems: {
        create: [
          { name: 'Technical SEO Audit', description: 'Full website audit with prioritized recommendations', quantity: 1, unitPrice: 2500, total: 2500, sortOrder: 0 },
          { name: 'Monthly SEO Management', description: 'On-page, off-page, and technical SEO optimization', quantity: 6, unitPrice: 2000, total: 12000, sortOrder: 1 },
          { name: 'Content Creation', description: '8 blog posts per month targeting sustainable construction topics', quantity: 6, unitPrice: 400, total: 2400, sortOrder: 2 },
          { name: 'Monthly Reporting', description: 'Detailed analytics reports with actionable insights', quantity: 6, unitPrice: 183.33, total: 1100, sortOrder: 3 },
        ],
      },
    },
  });

  const proposal3 = await db.proposal.create({
    data: {
      title: 'SolarStream Partnership Marketing',
      status: 'viewed',
      totalAmount: 50000,
      validUntil: proposalInOneMonth,
      sentAt: sevenDaysAgo,
      viewedAt: twoDaysAgo,
      contactId: contacts[7].id,
      companyId: companies[6].id,
      dealId: deals[6].id,
      notes: 'Strategic partnership proposal for content marketing and lead generation. Rachel mentioned they need to see ROI projections before final approval.',
      lineItems: {
        create: [
          { name: 'Brand Strategy Development', description: 'Comprehensive brand positioning for the Irish solar market', quantity: 1, unitPrice: 8000, total: 8000, sortOrder: 0 },
          { name: 'Content Marketing Platform', description: 'Blog, case studies, and whitepapers for lead generation', quantity: 12, unitPrice: 2500, total: 30000, sortOrder: 1 },
          { name: 'PPC Campaign Management', description: 'Google Ads for solar installation leads', quantity: 12, unitPrice: 800, total: 9600, sortOrder: 2 },
          { name: 'Analytics & Attribution', description: 'Multi-touch attribution and ROI tracking', quantity: 12, unitPrice: 200, total: 2400, sortOrder: 3 },
        ],
      },
    },
  });

  const proposal4 = await db.proposal.create({
    data: {
      title: 'CleanHeat Digital Strategy Proposal',
      status: 'draft',
      totalAmount: 22000,
      validUntil: proposalInTwoWeeks,
      contactId: contacts[4].id,
      companyId: companies[3].id,
      dealId: deals[5].id,
      notes: 'Still preparing the final pricing. Declan prefers a straightforward proposal without too much jargon. Include case study references from similar HVAC companies.',
      lineItems: {
        create: [
          { name: 'Digital Strategy Workshop', description: 'Half-day workshop to define digital marketing priorities', quantity: 1, unitPrice: 3000, total: 3000, sortOrder: 0 },
          { name: 'Website Optimization', description: 'Performance improvements and conversion rate optimization', quantity: 1, unitPrice: 5000, total: 5000, sortOrder: 1 },
          { name: 'Google Ads Campaign', description: '3-month PPC campaign targeting heat pump installers', quantity: 3, unitPrice: 3000, total: 9000, sortOrder: 2 },
          { name: 'Review Management', description: 'Google My Business and Trustpilot review strategy', quantity: 12, unitPrice: 416.67, total: 5000, sortOrder: 3 },
        ],
      },
    },
  });

  const proposal5 = await db.proposal.create({
    data: {
      title: 'Lisa Chen - Residential Solar Lead Gen',
      status: 'rejected',
      totalAmount: 8500,
      validUntil: proposalInOneMonth,
      sentAt: tenDaysAgo,
      viewedAt: eightDaysAgo,
      rejectedAt: fiveDaysAgo,
      contactId: contacts[9].id,
      dealId: deals[8].id,
      notes: 'Lisa decided to go with a competitor who offered a lower price. She mentioned she might reconsider next quarter when her budget refreshes.',
      lineItems: {
        create: [
          { name: 'Landing Page Design', description: 'Dedicated landing page for residential solar installation', quantity: 1, unitPrice: 2000, total: 2000, sortOrder: 0 },
          { name: 'Google Ads Setup', description: 'Campaign creation for solar installation keywords', quantity: 1, unitPrice: 1500, total: 1500, sortOrder: 1 },
          { name: '3-Month Ad Management', description: 'Ongoing optimization and management', quantity: 3, unitPrice: 1500, total: 4500, sortOrder: 2 },
          { name: 'Analytics Setup', description: 'Conversion tracking and reporting dashboard', quantity: 1, unitPrice: 500, total: 500, sortOrder: 3 },
        ],
      },
    },
  });

  console.log('✅ Proposals created');

  // ===== MEETINGS =====
  const mThreeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3);
  const mTwoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
  const mOneDayAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const mToday9am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
  const mToday11am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30);
  const mToday2pm = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 0);
  const mTomorrow10am = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0);
  const mTomorrow3pm = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 15, 0);
  const mInThreeDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 11, 0);
  const mInOneWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 30);

  const followUpTask1 = await db.task.create({
    data: {
      title: `Follow-up: ${contacts[0].firstName} quarterly review`,
      description: `Send meeting notes and action items from the quarterly review with Patrick O'Sullivan.`,
      priority: 'high',
      status: 'todo',
      dueDate: mOneDayAgo,
      contactId: contacts[0].id,
      dealId: deals[0].id,
      assigneeId: agent1.id,
    },
  });

  const meetings = await Promise.all([
    // Completed (past)
    db.meeting.create({
      data: {
        title: 'Quarterly Business Review',
        description: 'Review Q1 results and discuss Q2 targets with Patrick.',
        date: mThreeDaysAgo,
        endDate: new Date(mThreeDaysAgo.getTime() + 60 * 60 * 1000),
        location: '+353 1 555 1001',
        meetingType: 'call',
        status: 'completed',
        contactId: contacts[0].id,
        dealId: deals[0].id,
        companyId: companies[0].id,
        assignedTo: agent1.id,
        notes: 'Great meeting. Patrick wants to expand the scope of the campaign. Budget increase of 20% discussed.',
        followUpTaskId: followUpTask1.id,
      },
    }),
    db.meeting.create({
      data: {
        title: 'Sustainable Homes Site Visit',
        description: 'Visit Aoife\'s construction site to understand their sustainable building methods for SEO content.',
        date: mTwoDaysAgo,
        endDate: new Date(mTwoDaysAgo.getTime() + 3 * 60 * 60 * 1000),
        location: '42 Galway Business Park, Galway, Ireland',
        meetingType: 'in_person',
        status: 'completed',
        contactId: contacts[3].id,
        dealId: deals[4].id,
        companyId: companies[2].id,
        assignedTo: agent2.id,
        notes: 'Visited the showhouse site. Great sustainable features to highlight in content: solar tiles, rainwater harvesting, passive house design.',
      },
    }),
    db.meeting.create({
      data: {
        title: 'EcoWind Strategy Workshop',
        description: 'Full workshop to finalize the digital strategy and website requirements.',
        date: mOneDayAgo,
        endDate: new Date(mOneDayAgo.getTime() + 2 * 60 * 60 * 1000),
        location: 'https://meet.google.com/abc-defg-hij',
        meetingType: 'video',
        status: 'completed',
        contactId: contacts[2].id,
        dealId: deals[3].id,
        companyId: companies[1].id,
        assignedTo: agent1.id,
        notes: 'Michael and his team were very prepared. Clear requirements gathered. Need to prepare proposal by end of week.',
      },
    }),

    // Today
    db.meeting.create({
      data: {
        title: 'Morning standup with Emma',
        description: 'Quick sync on pipeline tasks and priorities for the week.',
        date: mToday9am,
        endDate: new Date(mToday9am.getTime() + 30 * 60 * 1000),
        meetingType: 'video',
        status: 'scheduled',
        assignedTo: admin.id,
        location: 'https://zoom.us/j/1234567890',
        notes: 'Discuss GreenTech renewal and SolarStream partnership progress.',
      },
    }),
    db.meeting.create({
      data: {
        title: 'Proposal review with Rachel McCarthy',
        description: 'Review and finalize the SolarStream partnership marketing proposal.',
        date: mToday11am,
        endDate: new Date(mToday11am.getTime() + 60 * 60 * 1000),
        location: 'SolarStream Manufacturing, Kildare, Ireland',
        meetingType: 'in_person',
        status: 'scheduled',
        contactId: contacts[7].id,
        dealId: deals[6].id,
        companyId: companies[6].id,
        assignedTo: admin.id,
      },
    }),

    // Today (later)
    db.meeting.create({
      data: {
        title: 'CleanHeat Discovery Call',
        description: 'Initial discovery call with Declan about their digital marketing needs.',
        date: mToday2pm,
        endDate: new Date(mToday2pm.getTime() + 45 * 60 * 1000),
        location: '+353 61 555 4001',
        meetingType: 'call',
        status: 'scheduled',
        contactId: contacts[4].id,
        dealId: deals[5].id,
        companyId: companies[3].id,
        assignedTo: agent1.id,
      },
    }),

    // Tomorrow
    db.meeting.create({
      data: {
        title: 'Lisa Chen - Solar Quote Discussion',
        description: 'Discuss Lisa\'s requirements for the residential solar lead generation campaign.',
        date: mTomorrow10am,
        endDate: new Date(mTomorrow10am.getTime() + 60 * 60 * 1000),
        location: 'https://meet.google.com/xyz-uvw-rst',
        meetingType: 'video',
        status: 'scheduled',
        contactId: contacts[9].id,
        dealId: deals[8].id,
        assignedTo: agent2.id,
      },
    }),
    db.meeting.create({
      data: {
        title: 'EV Charge Network Kickoff',
        description: 'Kickoff meeting for the brand launch campaign.',
        date: mTomorrow3pm,
        endDate: new Date(mTomorrow3pm.getTime() + 90 * 60 * 1000),
        location: '23 Grand Canal Dock, Dublin, Ireland',
        meetingType: 'in_person',
        status: 'scheduled',
        contactId: contacts[8].id,
        dealId: deals[7].id,
        companyId: companies[7].id,
        assignedTo: agent2.id,
      },
    }),

    // Next week
    db.meeting.create({
      data: {
        title: 'BioGreen Marketing Review',
        description: 'Monthly performance review call.',
        date: mInOneWeek,
        endDate: new Date(mInOneWeek.getTime() + 45 * 60 * 1000),
        location: '+353 51 555 6001',
        meetingType: 'call',
        status: 'scheduled',
        contactId: contacts[6].id,
        dealId: deals[2].id,
        companyId: companies[5].id,
        assignedTo: agent1.id,
      },
    }),

    // In 3 days
    db.meeting.create({
      data: {
        title: 'Atlantic Energy Audit Follow-up',
        description: 'Follow-up on the annual energy audit results and next steps.',
        date: mInThreeDays,
        endDate: new Date(mInThreeDays.getTime() + 60 * 60 * 1000),
        location: 'https://zoom.us/j/9876543210',
        meetingType: 'video',
        status: 'scheduled',
        contactId: contacts[5].id,
        dealId: deals[1].id,
        companyId: companies[4].id,
        assignedTo: agent2.id,
      },
    }),
  ]);

  console.log('✅ Meetings created');

  // ===== WORKFLOW RULES =====
  const wfNow = new Date();
  const wfFiveDaysAgo = new Date(wfNow.getFullYear(), wfNow.getMonth(), wfNow.getDate() - 5);
  const wfThreeDaysAgo = new Date(wfNow.getFullYear(), wfNow.getMonth(), wfNow.getDate() - 3);
  const wfOneDayAgo = new Date(wfNow.getFullYear(), wfNow.getMonth(), wfNow.getDate() - 1);

  const workflowRule1 = await db.workflowRule.create({
    data: {
      name: 'Auto-follow up cold deals',
      description: 'When a deal has been in the Qualified stage for 7+ days, automatically create a follow-up task for the assigned agent.',
      isActive: true,
      triggerType: 'deal_stage_change',
      triggerConfig: JSON.stringify({ stage: 'Qualified' }),
      actions: JSON.stringify([
        { type: 'create_task', config: { title: 'Follow up on qualified deal', priority: 'high', description: 'This deal has been in Qualified stage for 7+ days. Reach out to the contact to move the deal forward.' } },
        { type: 'notify', config: { user: 'deal_owner', message: 'A deal has been in Qualified stage for 7+ days. Consider reaching out.' } },
      ]),
      executionCount: 12,
      lastExecutedAt: wfOneDayAgo,
    },
  });

  const workflowRule2 = await db.workflowRule.create({
    data: {
      name: 'Welcome new contacts',
      description: 'When a new contact is created in the CRM, automatically create an introduction task to ensure timely outreach.',
      isActive: true,
      triggerType: 'new_contact',
      triggerConfig: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'create_task', config: { title: 'Send welcome email to new contact', priority: 'medium', description: 'Reach out to the new contact within 24 hours to introduce our services.' } },
      ]),
      executionCount: 8,
      lastExecutedAt: wfThreeDaysAgo,
    },
  });

  const workflowRule3 = await db.workflowRule.create({
    data: {
      name: 'Proposal follow up',
      description: 'When a proposal has been sent for 3+ days without being viewed or accepted, create a reminder task.',
      isActive: true,
      triggerType: 'proposal_status_change',
      triggerConfig: JSON.stringify({ status: 'sent' }),
      actions: JSON.stringify([
        { type: 'create_task', config: { title: 'Follow up on sent proposal', priority: 'high', description: 'Proposal has been sent for 3+ days. Follow up with the contact to check if they have reviewed it.' } },
        { type: 'add_note', config: { text: 'Automated reminder: Proposal sent 3+ days ago. Needs follow-up.' } },
      ]),
      executionCount: 5,
      lastExecutedAt: wfFiveDaysAgo,
    },
  });

  const workflowRule4 = await db.workflowRule.create({
    data: {
      name: 'Escalate overdue tasks',
      description: 'When a task is overdue by 2+ days, create an escalation note and notify the admin.',
      isActive: true,
      triggerType: 'task_overdue',
      triggerConfig: JSON.stringify({ days: 2 }),
      actions: JSON.stringify([
        { type: 'notify', config: { user: 'admin', message: 'A task is overdue by 2+ days. Please review and take action.' } },
        { type: 'add_note', config: { text: '⚠️ Automated escalation: This task is overdue by 2+ days.' } },
      ]),
      executionCount: 3,
      lastExecutedAt: wfOneDayAgo,
    },
  });

  const workflowRule5 = await db.workflowRule.create({
    data: {
      name: 'Won deal cleanup',
      description: 'When a deal moves to Won stage, create a celebration note and set up a follow-up task for account management.',
      isActive: true,
      triggerType: 'deal_stage_change',
      triggerConfig: JSON.stringify({ stage: 'Won' }),
      actions: JSON.stringify([
        { type: 'create_task', config: { title: 'Schedule account review meeting', priority: 'medium', description: 'Deal won! Schedule a kickoff meeting with the client to discuss next steps and deliverables.' } },
        { type: 'add_note', config: { text: '🎉 Congratulations! Deal won. Time to celebrate and plan the next steps.' } },
        { type: 'notify', config: { user: 'all', message: 'Great news! A deal has been won. Check the deal details for more information.' } },
      ]),
      executionCount: 7,
      lastExecutedAt: wfThreeDaysAgo,
    },
  });

  const workflowRule6 = await db.workflowRule.create({
    data: {
      name: 'Auto-meeting for new deals',
      description: 'Automatically schedule a discovery call when a new deal is created in the pipeline.',
      isActive: true,
      triggerType: 'deal_created',
      triggerConfig: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'create_meeting', config: { title: 'Discovery Call - New Deal', meetingType: 'call', duration: 30 } },
      ]),
      executionCount: 12,
      lastExecutedAt: wfTwoDaysAgo,
    },
  });

  const workflowRule7 = await db.workflowRule.create({
    data: {
      name: 'Invoice overdue follow-up',
      description: 'When an invoice becomes 7+ days overdue, automatically create a follow-up task for the assigned agent.',
      isActive: true,
      triggerType: 'invoice_overdue',
      triggerConfig: JSON.stringify({ days: 7 }),
      actions: JSON.stringify([
        { type: 'create_task', config: { title: 'Follow up on overdue invoice', priority: 'high', description: 'Invoice has been overdue for 7+ days. Contact the client to discuss payment options and potential payment plan.' } },
      ]),
      executionCount: 5,
      lastExecutedAt: wfOneDayAgo,
    },
  });

  const workflowRule8 = await db.workflowRule.create({
    data: {
      name: 'Payment received log',
      description: 'When a payment is received, automatically log a note on the associated deal and notify the admin.',
      isActive: true,
      triggerType: 'payment_received',
      triggerConfig: JSON.stringify({}),
      actions: JSON.stringify([
        { type: 'create_note', config: { text: 'Payment received! Record the payment details and update financial records.' } },
        { type: 'notify', config: { user: 'admin', message: 'Payment received for an invoice. Check the invoice for the amount and client details.' } },
      ]),
      executionCount: 8,
      lastExecutedAt: wfFiveDaysAgo,
    },
  });

  console.log('✅ Workflow rules created');

  // ===== WORKFLOW EXECUTIONS (demo history) =====
  await db.workflowExecution.createMany({
    data: [
      { ruleId: workflowRule1.id, triggerType: 'deal_stage_change', entityType: 'deal', entityId: 'demo-deal-1', actionType: 'create_task', actionConfig: JSON.stringify({ title: 'Follow up on qualified deal', priority: 'high' }), status: 'success', result: 'Task "Follow up on qualified deal" would be created with priority high', executedAt: wfOneDayAgo },
      { ruleId: workflowRule1.id, triggerType: 'deal_stage_change', entityType: 'deal', entityId: 'demo-deal-1', actionType: 'notify', actionConfig: JSON.stringify({ user: 'deal_owner', message: 'Deal has been in Qualified stage for 7+ days.' }), status: 'success', result: 'Notification sent to deal_owner', executedAt: wfOneDayAgo },
      { ruleId: workflowRule2.id, triggerType: 'new_contact', entityType: 'contact', entityId: 'demo-contact-1', actionType: 'create_task', actionConfig: JSON.stringify({ title: 'Send welcome email', priority: 'medium' }), status: 'success', result: 'Task "Send welcome email" would be created with priority medium', executedAt: wfThreeDaysAgo },
      { ruleId: workflowRule3.id, triggerType: 'proposal_status_change', entityType: 'proposal', entityId: 'demo-proposal-1', actionType: 'create_task', actionConfig: JSON.stringify({ title: 'Follow up on sent proposal', priority: 'high' }), status: 'success', result: 'Task created successfully', executedAt: wfFiveDaysAgo },
      { ruleId: workflowRule4.id, triggerType: 'task_overdue', entityType: 'task', entityId: 'demo-task-1', actionType: 'notify', actionConfig: JSON.stringify({ user: 'admin', message: 'Task overdue' }), status: 'success', result: 'Notification sent to admin', executedAt: wfOneDayAgo },
      { ruleId: workflowRule5.id, triggerType: 'deal_stage_change', entityType: 'deal', entityId: 'demo-deal-2', actionType: 'create_task', actionConfig: JSON.stringify({ title: 'Schedule account review meeting' }), status: 'success', result: 'Task created', executedAt: wfThreeDaysAgo },
      { ruleId: workflowRule5.id, triggerType: 'deal_stage_change', entityType: 'deal', entityId: 'demo-deal-2', actionType: 'add_note', actionConfig: JSON.stringify({ text: 'Deal won!' }), status: 'success', result: 'Note added', executedAt: wfThreeDaysAgo },
      { ruleId: workflowRule5.id, triggerType: 'deal_stage_change', entityType: 'deal', entityId: 'demo-deal-2', actionType: 'notify', actionConfig: JSON.stringify({ user: 'all', message: 'Deal won!' }), status: 'failed', result: 'Failed to notify all team members: notification service unavailable', executedAt: wfThreeDaysAgo },
      { ruleId: workflowRule6.id, triggerType: 'deal_created', entityType: 'deal', entityId: 'demo-deal-3', actionType: 'create_meeting', actionConfig: JSON.stringify({ title: 'Discovery Call - New Deal' }), status: 'success', result: 'Meeting created successfully', executedAt: wfTwoDaysAgo },
      { ruleId: workflowRule7.id, triggerType: 'invoice_overdue', entityType: 'invoice', entityId: 'demo-invoice-1', actionType: 'create_task', actionConfig: JSON.stringify({ title: 'Follow up on overdue invoice', priority: 'high' }), status: 'success', result: 'Task created for overdue follow-up', executedAt: wfOneDayAgo },
      { ruleId: workflowRule8.id, triggerType: 'payment_received', entityType: 'invoice', entityId: 'demo-invoice-2', actionType: 'create_note', actionConfig: JSON.stringify({ text: 'Payment received!' }), status: 'success', result: 'Note logged on deal', executedAt: wfFiveDaysAgo },
      { ruleId: workflowRule8.id, triggerType: 'payment_received', entityType: 'invoice', entityId: 'demo-invoice-2', actionType: 'notify', actionConfig: JSON.stringify({ user: 'admin', message: 'Payment received!' }), status: 'success', result: 'Admin notified', executedAt: wfFiveDaysAgo },
    ],
  });

  console.log('✅ Workflow executions created');

  // ===== SAVED REPORTS =====
  await db.report.create({
    data: {
      name: 'Q2 Revenue Forecast',
      description: 'Quarterly revenue forecast with confidence intervals and pipeline analysis.',
      type: 'forecast',
      config: JSON.stringify({ dateRange: 'thisQuarter', sections: ['revenueForecast', 'pipelineMetrics', 'conversionFunnel', 'topPerformers'] }),
    },
  });

  await db.report.create({
    data: {
      name: 'Pipeline Health Report',
      description: 'Weekly pipeline analysis with deal velocity and bottleneck detection.',
      type: 'pipeline',
      config: JSON.stringify({ dateRange: 'thisMonth', sections: ['pipelineMetrics', 'dealVelocity', 'conversionFunnel', 'proposalMetrics'] }),
    },
  });

  await db.report.create({
    data: {
      name: 'Team Activity Summary',
      description: 'Activity metrics breakdown by type and team member.',
      type: 'activity',
      config: JSON.stringify({ dateRange: 'thisMonth', sections: ['activityMetrics', 'meetingMetrics', 'topPerformers'] }),
    },
  });

  console.log('✅ Saved reports created');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Admin: admin@renewably.ie / admin123');
  console.log('  Agent: james@renewably.ie / agent123');
  console.log('         emma@renewably.ie / agent123');
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
