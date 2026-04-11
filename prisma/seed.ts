import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

const db = new PrismaClient();

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🌱 Seeding CRM database...');

  // Clean existing data
  await db.dealTag.deleteMany();
  await db.contactTag.deleteMany();
  await db.tag.deleteMany();
  await db.task.deleteMany();
  await db.note.deleteMany();
  await db.activity.deleteMany();
  await db.deal.deleteMany();
  await db.pipelineStage.deleteMany();
  await db.contact.deleteMany();
  await db.company.deleteMany();
  await db.user.deleteMany();

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
