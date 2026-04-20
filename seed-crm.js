const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.lead.count();
  if (existing > 0) { console.log(existing + ' leads already exist'); return; }
  
  const userId = 'cmo0gqtb30000rw8smp5h80fk';
  const leads = [
    { firstName: 'Aoife', lastName: 'Murphy', email: 'aoife@example.com', phone: '0871234567', status: 'new', source: 'website', value: 8500, eircode: 'D02AB12' },
    { firstName: 'Declan', lastName: 'Byrne', email: 'declan@example.com', phone: '0859876543', status: 'contacted', source: 'referral', value: 12000, eircode: 'A94XY89' },
    { firstName: 'Sinead', lastName: 'OBrien', email: 'sinead@example.com', phone: '0831112233', status: 'qualified', source: 'facebook', value: 15000, eircode: 'C15FK22' },
    { firstName: 'Patrick', lastName: 'Kelly', email: 'pat@example.com', phone: '0865556677', status: 'proposal', source: 'google', value: 18000, eircode: 'T12DW56' },
    { firstName: 'Emma', lastName: 'Walsh', email: 'emma@example.com', phone: '0879998877', status: 'won', source: 'website', value: 9200, eircode: 'D18AB34' },
    { firstName: 'Liam', lastName: 'Doherty', email: 'liam@example.com', phone: '0854443322', status: 'new', source: 'referral', value: 14000, eircode: 'F28CK67' },
    { firstName: 'Grainne', lastName: 'Fitzgerald', email: 'grainne@example.com', phone: '0837778899', status: 'contacted', source: 'facebook', value: 11000, eircode: 'W23EH01' },
    { firstName: 'Michael', lastName: 'OConnor', email: 'michael@example.com', phone: '0862223344', status: 'qualified', source: 'google', value: 16500, eircode: 'K34NW56' },
    { firstName: 'Cliona', lastName: 'Ryan', email: 'cliona@example.com', phone: '0871110022', status: 'new', source: 'website', value: 7800, eircode: 'P32YE78' },
    { firstName: 'Sean', lastName: 'Gallagher', email: 'sean@example.com', phone: '0853334455', status: 'lost', source: 'referral', value: 10000, eircode: 'G56TQ12' },
    { firstName: 'Niamh', lastName: 'Carthy', email: 'niamh@example.com', phone: '0835556677', status: 'contacted', source: 'website', value: 13500, eircode: 'E32RX90' },
    { firstName: 'Darragh', lastName: 'Lynch', email: 'darragh@example.com', phone: '0868889900', status: 'proposal', source: 'google', value: 19500, eircode: 'H91VK45' },
    { firstName: 'Orla', lastName: 'Brennan', email: 'orla@example.com', phone: '0872223344', status: 'won', source: 'facebook', value: 11200, eircode: 'R14PW78' },
    { firstName: 'Cian', lastName: 'Murray', email: 'cian@example.com', phone: '0856667788', status: 'new', source: 'website', value: 8900, eircode: 'L42BX11' },
    { firstName: 'Mairead', lastName: 'Quinn', email: 'mairead@example.com', phone: '0839990011', status: 'qualified', source: 'referral', value: 14800, eircode: 'N91HJ23' },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        ...lead,
        assignedToId: userId,
      }
    });
  }
  
  console.log('Created ' + leads.length + ' leads');

  const activityTypes = [
    { type: 'call', title: 'Initial enquiry call' },
    { type: 'email', title: 'Sent proposal PDF' },
    { type: 'note', title: 'Customer interested in 6kW system' },
    { type: 'meeting', title: 'Site assessment scheduled' },
    { type: 'call', title: 'Follow-up call' },
    { type: 'email', title: 'SEAI grant info sent' },
  ];

  const allLeads = await prisma.lead.findMany({ select: { id: true } });
  for (let i = 0; i < activityTypes.length && i < allLeads.length; i++) {
    await prisma.activity.create({
      data: {
        ...activityTypes[i],
        leadId: allLeads[i].id,
        userId,
      }
    });
  }
  console.log('Created ' + Math.min(activityTypes.length, allLeads.length) + ' activities');

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
