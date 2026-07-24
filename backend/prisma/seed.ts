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
  console.log(`Created ${createdGuards.length} Guards`);

  // 5. Create Attendance Records for the last 7 days (at least 20 records)
  const now = new Date();
  const activeGuards = [createdGuards[0], createdGuards[1], createdGuards[2], createdGuards[3], createdGuards[4], createdGuards[5]];
  const dayGuardIndices = [0, 2, 4]; // ACTIVE DAY guards
  const nightGuardIndices = [1, 3, 5]; // ACTIVE NIGHT guards

  let attendanceCount = 0;
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    date.setHours(0, 0, 0, 0);

    // DAY shift check-in (06:00 - 07:00)
    for (const idx of dayGuardIndices) {
      const guardId = activeGuards[idx];
      const siteId = guardsData[idx].siteId;
      const checkInHour = 6 + Math.floor(Math.random() * 2);
      const checkInMin = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMin);

      // Check-out after 12 hours (18:00 - 19:00)
      const checkOutHour = 18 + Math.floor(Math.random() * 2);
      const checkOutMin = Math.floor(Math.random() * 60);
      const checkOut = new Date(date);
      checkOut.setHours(checkOutHour, checkOutMin);

      await prisma.attendance.upsert({
        where: { id: `seed-att-day-${dayOffset}-${idx}` },
        update: {},
        create: {
          id: `seed-att-day-${dayOffset}-${idx}`,
          guardId,
          siteId,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          checkInLatitude: siteId === site1.id ? 6.4385 : 6.4531,
          checkInLongitude: siteId === site1.id ? 3.5352 : 3.4447,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkInMethod: 'GPS',
          checkOutMethod: 'GPS',
          checkInLocation: siteId === site1.id ? 'Chevron Main Gate' : 'Banana Island Alpha Zone',
          status: checkInMin <= 15 ? 'ON_TIME' : 'LATE',
          isLate: checkInMin > 15,
          isAbsent: false,
          verifiedStatus: true,
        },
      });
      attendanceCount++;
    }

    // NIGHT shift check-in (18:00 - 19:00)
    for (const idx of nightGuardIndices) {
      const guardId = activeGuards[idx];
      const siteId = guardsData[idx].siteId;
      const checkInHour = 18 + Math.floor(Math.random() * 2);
      const checkInMin = Math.floor(Math.random() * 60);
      const checkIn = new Date(date);
      checkIn.setHours(checkInHour, checkInMin);

      // Check-out after 12 hours (06:00 - 07:00 next day)
      const checkOutDate = new Date(date);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      const checkOutHour = 6 + Math.floor(Math.random() * 2);
      const checkOutMin = Math.floor(Math.random() * 60);
      const checkOut = new Date(checkOutDate);
      checkOut.setHours(checkOutHour, checkOutMin);

      await prisma.attendance.upsert({
        where: { id: `seed-att-night-${dayOffset}-${idx}` },
        update: {},
        create: {
          id: `seed-att-night-${dayOffset}-${idx}`,
          guardId,
          siteId,
          checkInTime: checkIn,
          checkOutTime: checkOut,
          checkInLatitude: siteId === site1.id ? 6.4385 : 6.4531,
          checkInLongitude: siteId === site1.id ? 3.5352 : 3.4447,
          checkOutLatitude: null,
          checkOutLongitude: null,
          checkInMethod: 'GPS',
          checkOutMethod: 'GPS',
          checkInLocation: siteId === site1.id ? 'Chevron Main Gate' : 'Banana Island Alpha Zone',
          status: checkInMin <= 15 ? 'ON_TIME' : 'LATE',
          isLate: checkInMin > 15,
          isAbsent: false,
          verifiedStatus: true,
        },
      });
      attendanceCount++;
    }
  }
  console.log(`Created ${attendanceCount} Attendance Records`);

  // 6. Create Sample Incidents (3-4 with varying severity)
  const incidentsData = [
    {
      id: 'seed-incident-001',
      title: 'Unauthorized Vehicle Breach at Main Gate',
      incidentType: 'TRESPASS',
      occurrenceTime: new Date('2024-12-10T14:30:00Z'),
      status: 'RESOLVED',
      siteId: site1.id,
      reporterId: adminUser.id,
      guardsInvolved: JSON.stringify(['Adamu Ibrahim', 'Ngozi Eze']),
      description:
        'An unauthorized vehicle attempted to gain entry through the Chevron Main Gate at approximately 14:30hrs. The driver claimed to be a delivery personnel but had no valid clearance documents. Guards on duty immediately flagged the vehicle and denied entry. The vehicle was noted to have sped off after being turned away.',
      severity: 'HIGH',
      photos: '[]',
      videos: '[]',
      voiceNotes: '[]',
      witnesses: JSON.stringify([{ name: 'Mr. Olamide', role: 'Client Representative', phone: '+2348012345678' }]),
      actionsTaken:
        'Deployed additional security personnel to the gate. Logged vehicle plate number with local authorities. Briefed all shift guards on heightened vigilance.',
      investigationStatus: 'RESOLVED',
      resolutionNotes: 'No further incidents reported. Enhanced verification procedures implemented.',
    },
    {
      id: 'seed-incident-002',
      title: 'Suspicious Package Found Near Perimeter Fence',
      incidentType: 'OTHER',
      occurrenceTime: new Date('2024-12-15T06:15:00Z'),
      status: 'OPEN',
      siteId: site2.id,
      reporterId: adminUser.id,
      guardsInvolved: JSON.stringify(['Chukwudi Okafor']),
      description:
        'During morning patrol, Guard Chukwudi Okafor discovered a small unmarked package near the eastern perimeter fence of Banana Island Alpha Zone. The package was wrapped in black plastic and appeared to have been discarded overnight. Area was immediately cordoned off.',
      severity: 'CRITICAL',
      photos: '[]',
      videos: '[]',
      voiceNotes: '[]',
      witnesses: JSON.stringify([]),
      actionsTaken:
        'Cordoned off the area. Contacted estate security coordinator and local police. Awaiting bomb disposal unit assessment.',
      investigationStatus: 'UNDER_INVESTIGATION',
      resolutionNotes: null,
    },
    {
      id: 'seed-incident-003',
      title: 'Minor Fire Outbreak in Generator Room',
      incidentType: 'FIRE',
      occurrenceTime: new Date('2024-11-22T22:45:00Z'),
      status: 'RESOLVED',
      siteId: site1.id,
      reporterId: adminUser.id,
      guardsInvolved: JSON.stringify(['Musa Abdullahi']),
      description:
        'A small fire broke out in the generator room adjacent to the Chevron Main Gate guard house at approximately 22:45hrs. Night shift guard Musa Abdullahi noticed smoke and immediately activated the fire extinguisher. The fire was contained within 5 minutes with no injuries or significant property damage.',
      severity: 'MEDIUM',
      photos: '[]',
      videos: '[]',
      voiceNotes: '[]',
      witnesses: JSON.stringify([{ name: 'Security Control Room', role: 'Monitoring Team' }]),
      actionsTaken:
        'Fire extinguished using portable extinguisher. Generator room inspected by maintenance team. Faulty fuel line identified and replaced. Fire extinguisher replaced and incident logged.',
      investigationStatus: 'RESOLVED',
      resolutionNotes: 'Root cause identified as a leaking fuel line from the generator. Maintenance team completed repairs. All guards reminded of fire drill procedures.',
    },
    {
      id: 'seed-incident-004',
      title: 'Medical Emergency - Contractor Collapsed at Work',
      incidentType: 'MEDICAL',
      occurrenceTime: new Date('2024-12-18T10:20:00Z'),
      status: 'CLOSED',
      siteId: site2.id,
      reporterId: adminUser.id,
      guardsInvolved: JSON.stringify(['Oluwaseun Adeyemi']),
      description:
        'A contractor working on the Banana Island Alpha Zone premises collapsed at approximately 10:20hrs, complaining of severe chest pains and shortness of breath. Guard Oluwaseun Adeyemi provided immediate first aid and called for emergency medical services.',
      severity: 'LOW',
      photos: '[]',
      videos: '[]',
      voiceNotes: '[]',
      witnesses: JSON.stringify([
        { name: 'Site Engineer', role: 'Site Staff' },
        { name: 'Project Manager', role: 'Contractor Lead' },
      ]),
      actionsTaken:
        'Administered first aid. Called emergency services (ambulance arrived within 8 minutes). Contractor transported to Lagoon Hospital. Incident reported to estate management.',
      investigationStatus: 'CLOSED',
      resolutionNotes: 'Contractor was diagnosed with heat exhaustion and high blood pressure. Made full recovery. Advisory issued on hydration breaks and heat stress prevention.',
    },
  ];

  for (const inc of incidentsData) {
    await prisma.incident.upsert({
      where: { id: inc.id },
      update: {},
      create: inc,
    });
  }
  console.log(`Created ${incidentsData.length} Incidents`);

  // 7. Create Patrol Routes (2 per site)
  const patrolRoute1 = await prisma.patrolRoute.upsert({
    where: { id: 'seed-route-001' },
    update: {},
    create: {
      id: 'seed-route-001',
      name: 'Chevron Main Gate Perimeter Patrol',
      siteId: site1.id,
      assignedGuardId: createdGuards[0],
      scheduledStart: new Date(new Date().setHours(6, 0, 0, 0)),
      scheduledEnd: new Date(new Date().setHours(18, 0, 0, 0)),
      frequency: 'HOURLY',
      isActive: true,
    },
  });

  const patrolRoute2 = await prisma.patrolRoute.upsert({
    where: { id: 'seed-route-002' },
    update: {},
    create: {
      id: 'seed-route-002',
      name: 'Banana Island Alpha Night Patrol',
      siteId: site2.id,
      assignedGuardId: createdGuards[1],
      scheduledStart: new Date(new Date().setHours(18, 0, 0, 0)),
      scheduledEnd: new Date(new Date().setHours(6, 0, 0, 0)),
      frequency: 'HOURLY',
      isActive: true,
    },
  });

  // 8. Create Checkpoints for each patrol route (3-4 per route)
  const checkpointsData = [
    {
      id: 'seed-cp-001',
      patrolRouteId: patrolRoute1.id,
      name: 'Chevron Main Gate - Entrance Checkpoint',
      qrCodeToken: 'QR-CHEVRON-MAIN-001',
      sequenceOrder: 1,
      expectedLatitude: 6.4385,
      expectedLongitude: 3.5352,
    },
    {
      id: 'seed-cp-002',
      patrolRouteId: patrolRoute1.id,
      name: 'Chevron Main Gate - East Perimeter',
      qrCodeToken: 'QR-CHEVRON-EAST-002',
      sequenceOrder: 2,
      expectedLatitude: 6.439,
      expectedLongitude: 3.536,
    },
    {
      id: 'seed-cp-003',
      patrolRouteId: patrolRoute1.id,
      name: 'Chevron Main Gate - West Perimeter',
      qrCodeToken: 'QR-CHEVRON-WEST-003',
      sequenceOrder: 3,
      expectedLatitude: 6.438,
      expectedLongitude: 3.5345,
    },
    {
      id: 'seed-cp-004',
      patrolRouteId: patrolRoute1.id,
      name: 'Chevron Main Gate - Guard Tower',
      qrCodeToken: 'QR-CHEVRON-TOWER-004',
      sequenceOrder: 4,
      expectedLatitude: 6.4387,
      expectedLongitude: 3.535,
    },
    {
      id: 'seed-cp-005',
      patrolRouteId: patrolRoute2.id,
      name: 'Banana Island - North Entrance',
      qrCodeToken: 'QR-BANANA-NORTH-001',
      sequenceOrder: 1,
      expectedLatitude: 6.4531,
      expectedLongitude: 3.4447,
    },
    {
      id: 'seed-cp-006',
      patrolRouteId: patrolRoute2.id,
      name: 'Banana Island - East Fence Line',
      qrCodeToken: 'QR-BANANA-EAST-002',
      sequenceOrder: 2,
      expectedLatitude: 6.4535,
      expectedLongitude: 3.445,
    },
    {
      id: 'seed-cp-007',
      patrolRouteId: patrolRoute2.id,
      name: 'Banana Island - Waterfront Post',
      qrCodeToken: 'QR-BANANA-WATER-003',
      sequenceOrder: 3,
      expectedLatitude: 6.4528,
      expectedLongitude: 3.4443,
    },
  ];

  for (const cp of checkpointsData) {
    await prisma.checkpoint.upsert({
      where: { id: cp.id },
      update: {},
      create: cp,
    });
  }
  console.log(`Created ${checkpointsData.length} Checkpoints`);

  // 9. Create Patrol Records for yesterday (3 records - 2 completed, 1 in-progress)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const patrolRecordsData = [
    {
      id: 'seed-pr-001',
      routeId: patrolRoute1.id,
      guardId: createdGuards[0],
      startTime: new Date(yesterday.getTime() + 6 * 3600000), // 06:00
      endTime: new Date(yesterday.getTime() + 6.5 * 3600000), // 06:30
      status: 'COMPLETED',
      scannedCheckpoints: JSON.stringify(['seed-cp-001', 'seed-cp-002', 'seed-cp-004']),
      missedCheckpoints: JSON.stringify(['seed-cp-003']),
      completionPercentage: 75,
      generalNotes: 'West perimeter checkpoint was inaccessible due to construction.',
    },
    {
      id: 'seed-pr-002',
      routeId: patrolRoute2.id,
      guardId: createdGuards[1],
      startTime: new Date(yesterday.getTime() + 20 * 3600000), // 20:00
      endTime: new Date(yesterday.getTime() + 20.5 * 3600000), // 20:30
      status: 'IN_PROGRESS',
      scannedCheckpoints: JSON.stringify(['seed-cp-005']),
      missedCheckpoints: '[]',
      completionPercentage: 33,
      generalNotes: 'Night patrol in progress. All clear so far.',
    },
    {
      id: 'seed-pr-003',
      routeId: patrolRoute1.id,
      guardId: createdGuards[0],
      startTime: new Date(yesterday.getTime() + 14 * 3600000), // 14:00
      endTime: new Date(yesterday.getTime() + 14.66 * 3600000), // 14:40
      status: 'COMPLETED',
      scannedCheckpoints: JSON.stringify(['seed-cp-001', 'seed-cp-002', 'seed-cp-003', 'seed-cp-004']),
      missedCheckpoints: '[]',
      completionPercentage: 100,
      generalNotes: 'Routine afternoon patrol. All secure.',
    },
  ];

  for (const pr of patrolRecordsData) {
    await prisma.patrolRecord.upsert({
      where: { id: pr.id },
      update: {},
      create: pr,
    });
  }
  console.log(`Created ${patrolRecordsData.length} Patrol Records`);

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
