import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const organization = await prisma.organization.upsert({
    where: { id: 'default-organization' },
    update: {},
    create: {
      id: 'default-organization',
      name: 'Spectra Operations',
    },
  });

  // 1. Create Admin/CEO User
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'ceo@spectra.com' },
    update: {},
    create: {
      email: 'ceo@spectra.com',
      organizationId: organization.id,
      passwordHash: hashedPassword,
      firstName: 'Executive',
      lastName: 'Director',
      phone: '+2340000000000',
      role: 'CEO',
      isActive: true,
    },
  });
  console.log(`Created CEO user: ${adminUser.email}`);

  // 2. Create Clients
  const client1 = await prisma.client.upsert({
    where: { email: 'olamide@chevron.com.ng' },
    update: {},
    create: {
      companyName: 'Chevron Nigeria',
      organizationId: organization.id,
      estateName: 'Chevron Alternative Estate',
      contactPerson: 'Mr. Olamide',
      phone: '+2348012345678',
      email: 'olamide@chevron.com.ng',
      contractStart: new Date('2023-01-01'),
      contractEnd: new Date('2025-12-31'),
      monthlyFee: 5000000,
      numberOfGuardsAllocated: 50,
      billingStatus: 'PAID',
    },
  });

  const client2 = await prisma.client.upsert({
    where: { email: 'folake@pinnacle.com' },
    update: {},
    create: {
      companyName: 'Pinnacle Estates',
      organizationId: organization.id,
      estateName: 'Banana Island Plot A',
      contactPerson: 'Mrs. Folake',
      phone: '+2348087654321',
      email: 'folake@pinnacle.com',
      contractStart: new Date('2024-06-01'),
      contractEnd: new Date('2026-06-01'),
      monthlyFee: 8000000,
      numberOfGuardsAllocated: 120,
      billingStatus: 'PAID',
    },
  });
  console.log('Created Clients');

  // 3. Create Sites (idempotent)
  const site1 = await prisma.site.upsert({
    where: { id: 'seed-site-chevron-main-gate' },
    update: {},
    create: {
      id: 'seed-site-chevron-main-gate',
      name: 'Chevron Main Gate',
      organizationId: organization.id,
      address: 'Lekki-Epe Expressway, Lagos',
      latitude: 6.4385,
      longitude: 3.5352,
      clientId: client1.id,
      riskLevel: 'MEDIUM',
      targetGuards: 15,
      sitePhotos: '[]',
      emergencyContacts: '[]',
      assets: '[]',
    },
  });

  const site2 = await prisma.site.upsert({
    where: { id: 'seed-site-banana-island' },
    update: {},
    create: {
      id: 'seed-site-banana-island',
      name: 'Banana Island Alpha Zone',
      organizationId: organization.id,
      address: 'Banana Island, Ikoyi, Lagos',
      latitude: 6.4531,
      longitude: 3.4447,
      clientId: client2.id,
      riskLevel: 'HIGH',
      targetGuards: 30,
      sitePhotos: '[]',
      emergencyContacts: '[]',
      assets: '[]',
    },
  });
  console.log('Created Sites');

  // 4. Create Guards
  const guardsData = [
    { name: 'Adamu Ibrahim', nin: 'NIN12345678901', status: 'ACTIVE', shift: 'DAY', siteId: site1.id },
    { name: 'Musa Abdullahi', nin: 'NIN12345678902', status: 'ACTIVE', shift: 'NIGHT', siteId: site1.id },
    { name: 'Chukwudi Okafor', nin: 'NIN12345678903', status: 'ACTIVE', shift: 'DAY', siteId: site2.id },
    { name: 'Oluwaseun Adeyemi', nin: 'NIN12345678904', status: 'ON_LEAVE', shift: 'OFF', siteId: site2.id },
    { name: 'Ngozi Eze', nin: 'NIN12345678905', status: 'SUSPENDED', shift: 'OFF', siteId: site1.id },
  ];

  for (const g of guardsData) {
    await prisma.guard.upsert({
      where: { nin: g.nin },
      update: {},
      create: {
        fullName: g.name,
        organizationId: organization.id,
        photoUrl: '',
        phone: '+2348000000000',
        address: 'Lagos, Nigeria',
        emergencyContact: '+2348000000001',
        nin: g.nin,
        guarantorDetails: 'Mr. Guarantor',
        employmentDate: new Date('2022-05-15'),
        status: g.status,
        currentShift: g.shift,
        assignedSiteId: g.siteId,
        trainingRecords: '[]',
        certificates: '[]',
        backgroundVerification: '{"status":"VERIFIED"}',
        disciplinaryHistory: '[]',
      },
    });
  }
  console.log('Created Guards');

  console.log('Database seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
