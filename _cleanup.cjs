const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function cleanup() {
  const emails = ['qa-full@test.com','qa-test@renewably.ie','qa2@test.com','qa3@test.com'];
  const userIds = (await p.user.findMany({ where: { email: { in: emails }, select: { id: true } })).map(u => u.id);
  const companyIds = (await p.company.findMany({ where: { name: { in: ['Full QA Test Ltd','QA Solar Installers Ltd','QA2 Solar','QA3 Solar'] } }, select: { id: true } })).map(c => c.id);
  const installerIds = (await p.installerProfile.findMany({ where: { companyName: { in: ['Full QA Test Ltd','QA Solar Installers Ltd','QA2 Solar','QA3 Solar'] } }, select: { id: true } })).map(i => i.id);
  const dealIds = (await p.deal.findMany({ where: { companyId: { in: companyIds } }, select: { id: true } })).map(d => d.id);
  
  await p.activity.deleteMany({ where: { userId: { in: userIds } } });
  await p.dealActivity.deleteMany({ where: { dealId: { in: dealIds } } });
  await p.installerDocument.deleteMany({ where: { installerId: { in: installerIds } } });
  await p.subscription.deleteMany({ where: { companyId: { in: companyIds } });
  await p.onboarding.deleteMany({ where: { companyId: { in: companyIds } });
  await p.installerProfile.deleteMany({ where: { id: { in: installerIds } } });
  await p.onboardingSubmission.deleteMany({ where: { email: { in: emails } });
  await p.contact.deleteMany({ where: { email: { in: emails } });
  await p.session.deleteMany({ where: { userId: { in: userIds } });
  await p.user.deleteMany({ where: { id: { in: userIds } } });
  await p.company.deleteMany({ where: { id: { in: companyIds } } });
  
  console.log('Cleanup done');
  await p.$disconnect();
}

cleanup().catch(e => { console.error(e.message); process.exit(1); });
