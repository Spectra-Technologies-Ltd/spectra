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
      id: 'seed-admin-user',
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
      id: 'seed-client-chevron',
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
      id: 'seed-client-pinnacle',
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

  // 3. Create Sites
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
      emergencyContacts: '[{"name":"Security Control Room","phone":"+2349011112222"},{"name":"Police Division","phone":"+2349022223333"}]',
      assets: '[{"name":"Barrier Gate","type":"INFRASTRUCTURE"},{"name":"CCTV System","type":"ELECTRONICS"}]',
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
      emergencyContacts: '[{"name":"Estate Security Desk","phone":"+2349033334444"},{"name":"Rapid Response Unit","phone":"+2349044445555"}]',
      assets: '[{"name":"Perimeter Fence","type":"INFRASTRUCTURE"},{"name":"Guard Booth","type":"STRUCTURE"},{"name":"Floodlights","type":"EQUIPMENT"}]',
    },
  });
  console.log('Created Sites');

  // 4. Create Guards (8 total: 6 ACTIVE [3 DAY, 3 NIGHT], 1 ON_LEAVE, 1 SUSPENDED)
  const guardsData = [
    // Guard 1 - ACTIVE DAY at site1
    {
      id: 'seed-guard-001',
      fullName: 'Adamu Ibrahim',
      phone: '+2348010000001',
      address: '15 Ahmadu Bello Way, Lagos',
      emergencyContact: '+2348010000101',
      nin: 'NIN12345678901',
      status: 'ACTIVE',
      shift: 'DAY',
      siteId: site1.id,
      bvn: 'BVN1000000001',
      trainingRecords: JSON.stringify([
        { course: 'Fire Safety Training', date: '2024-01-15', expiry: '2025-01-15' },
        { course: 'First Aid Certification', date: '2024-03-20', expiry: '2026-03-20' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2023-06-01', issuer: 'Nigeria Security Council' },
        { name: 'Armed Response Certification', issued: '2024-02-15', issuer: 'Private Security Authority' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'VERIFIED', date: '2023-05-20' }),
      disciplinaryHistory: '[]',
      employmentDate: new Date('2022-05-15'),
      performanceScore: 95,
    },
    // Guard 2 - ACTIVE NIGHT at site1
    {
      id: 'seed-guard-002',
      fullName: 'Musa Abdullahi',
      phone: '+2348010000002',
      address: '22 Herbert Macaulay Way, Lagos',
      emergencyContact: '+2348010000102',
      nin: 'NIN12345678902',
      status: 'ACTIVE',
      shift: 'NIGHT',
      siteId: site1.id,
      bvn: 'BVN1000000002',
      trainingRecords: JSON.stringify([
        { course: 'Night Patrol Procedures', date: '2024-02-10', expiry: '2025-02-10' },
        { course: 'Defensive Tactics', date: '2024-06-05', expiry: '2025-06-05' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2023-08-01', issuer: 'Nigeria Security Council' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'VERIFIED', date: '2023-07-15' }),
      disciplinaryHistory: JSON.stringify([
        { incident: 'Late to shift 3 times', date: '2024-08-15', action: 'Verbal warning' },
        { incident: 'Unauthorized absence', date: '2024-11-01', action: 'One day suspension' },
      ]),
      employmentDate: new Date('2022-08-01'),
      performanceScore: 72,
    },
    // Guard 3 - ACTIVE DAY at site2
    {
      id: 'seed-guard-003',
      fullName: 'Chukwudi Okafor',
      phone: '+2348010000003',
      address: '7 Awolowo Road, Ikoyi, Lagos',
      emergencyContact: '+2348010000103',
      nin: 'NIN12345678903',
      status: 'ACTIVE',
      shift: 'DAY',
      siteId: site2.id,
      bvn: null,
      trainingRecords: JSON.stringify([
        { course: 'CCTV Monitoring Certification', date: '2024-04-12', expiry: '2026-04-12' },
        { course: 'Fire Safety Training', date: '2024-01-15', expiry: '2025-01-15' },
        { course: 'First Aid Certification', date: '2024-03-20', expiry: '2026-03-20' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2023-03-01', issuer: 'Nigeria Security Council' },
        { name: 'CCTV Operations Certificate', issued: '2024-04-12', issuer: 'TechSafe Nigeria' },
        { name: 'Advanced Patrol Training', issued: '2024-09-01', issuer: 'Private Security Authority' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'VERIFIED', date: '2023-02-28' }),
      disciplinaryHistory: '[]',
      employmentDate: new Date('2023-01-10'),
      performanceScore: 98,
    },
    // Guard 4 - ACTIVE NIGHT at site2
    {
      id: 'seed-guard-004',
      fullName: 'Oluwaseun Adeyemi',
      phone: '+2348010000004',
      address: '30 Admiralty Way, Lekki, Lagos',
      emergencyContact: '+2348010000104',
      nin: 'NIN12345678904',
      status: 'ACTIVE',
      shift: 'NIGHT',
      siteId: site2.id,
      bvn: 'BVN1000000004',
      trainingRecords: JSON.stringify([
        { course: 'Night Patrol Procedures', date: '2024-02-10', expiry: '2025-02-10' },
        { course: 'Emergency Response Training', date: '2024-07-18', expiry: '2025-07-18' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2023-11-01', issuer: 'Nigeria Security Council' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'VERIFIED', date: '2023-10-20' }),
      disciplinaryHistory: '[]',
      employmentDate: new Date('2023-09-15'),
      performanceScore: 85,
    },
    // Guard 5 - ACTIVE DAY at site1
    {
      id: 'seed-guard-005',
      fullName: 'Ngozi Eze',
      phone: '+2348010000005',
      address: '8 Bode Thomas Street, Surulere, Lagos',
      emergencyContact: '+2348010000105',
      nin: 'NIN12345678905',
      status: 'ACTIVE',
      shift: 'DAY',
      siteId: site1.id,
      bvn: 'BVN1000000005',
      trainingRecords: JSON.stringify([
        { course: 'Fire Safety Training', date: '2024-01-15', expiry: '2025-01-15' },
        { course: 'Conflict Resolution', date: '2024-05-22', expiry: '2025-05-22' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2024-01-01', issuer: 'Nigeria Security Council' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'PENDING' }),
      disciplinaryHistory: '[]',
      employmentDate: new Date('2024-01-05'),
      performanceScore: 88,
    },
    // Guard 6 - ACTIVE NIGHT at site2
    {
      id: 'seed-guard-006',
      fullName: 'Fatima Bello',
      phone: '+2348010000006',
      address: '12 Obi Street, Onitsha, Anambra',
      emergencyContact: '+2348010000106',
      nin: 'NIN12345678906',
      status: 'ACTIVE',
      shift: 'NIGHT',
      siteId: site2.id,
      bvn: 'BVN1000000006',
      trainingRecords: JSON.stringify([
        { course: 'Night Patrol Procedures', date: '2024-02-10', expiry: '2025-02-10' },
        { course: 'First Aid Certification', date: '2024-03-20', expiry: '2026-03-20' },
        { course: 'Radio Communication Protocols', date: '2024-08-01', expiry: '2025-08-01' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2023-09-01', issuer: 'Nigeria Security Council' },
        { name: 'Advanced First Aid', issued: '2024-03-20', issuer: 'Red Cross Nigeria' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'VERIFIED', date: '2023-08-10' }),
      disciplinaryHistory: '[]',
      employmentDate: new Date('2023-07-20'),
      performanceScore: 91,
    },
    // Guard 7 - ON_LEAVE at site1
    {
      id: 'seed-guard-007',
      fullName: 'Emeka Nwachukwu',
      phone: '+2348010000007',
      address: '25 Ebitu Ukiwe Street, Abuja',
      emergencyContact: '+2348010000107',
      nin: 'NIN12345678907',
      status: 'ON_LEAVE',
      shift: 'OFF',
      siteId: site1.id,
      bvn: null,
      trainingRecords: JSON.stringify([
        { course: 'Fire Safety Training', date: '2024-01-15', expiry: '2025-01-15' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2023-12-01', issuer: 'Nigeria Security Council' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'VERIFIED', date: '2023-11-15' }),
      disciplinaryHistory: '[]',
      employmentDate: new Date('2023-11-01'),
      performanceScore: 80,
    },
    // Guard 8 - SUSPENDED at site2
    {
      id: 'seed-guard-008',
      fullName: 'Babatunde Lawal',
      phone: '+2348010000008',
      address: '5 Olu Holloway Street, Ikeja, Lagos',
      emergencyContact: '+2348010000108',
      nin: 'NIN12345678908',
      status: 'SUSPENDED',
      shift: 'OFF',
      siteId: site2.id,
      bvn: 'BVN1000000008',
      trainingRecords: JSON.stringify([
        { course: 'Fire Safety Training', date: '2024-01-15', expiry: '2025-01-15' },
      ]),
      certificates: JSON.stringify([
        { name: 'Security Guard License', issued: '2024-02-01', issuer: 'Nigeria Security Council' },
      ]),
      backgroundVerification: JSON.stringify({ status: 'PENDING' }),
      disciplinaryHistory: JSON.stringify([
        { incident: 'Physical altercation with colleague', date: '2024-10-20', action: '14-day suspension pending investigation' },
        { incident: 'Gross insubordination to supervisor', date: '2024-12-05', action: 'Final written warning + suspension' },
      ]),
      employmentDate: new Date('2024-02-15'),
      performanceScore: 45,
    },
  ];

  const createdGuards: string[] = [];
  for (const g of guardsData) {
    const guard = await prisma.guard.upsert({
      where: { nin: g.nin },
      update: {},
      create: {
        id: g.id,
        fullName: g.fullName,
        organizationId: organization.id,
        photoUrl: '',
        phone: g.phone,
        address: g.address,
        emergencyContact: g.emergencyContact,
        nin: g.nin,
        bvn: g.bvn,
        guarantorDetails: 'Mr. Guarantor',
        employmentDate: g.employmentDate,
        status: g.status,
        currentShift: g.shift,
        assignedSiteId: g.siteId,
        trainingRecords: g.trainingRecords,
        certificates: g.certificates,
        backgroundVerification: g.backgroundVerification,
        disciplinaryHistory: g.disciplinaryHistory,
        performanceScore: g.performanceScore,
      },
    });
    createdGuards.push(guard.id);
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

  // 7. Create Patrol Routes (one per site)
  const patrolRoute1 = await prisma.patrolRoute.upsert({
    where: { id: 'seed-route-001' },
    update: {},
    create: {
      id: 'seed-route-001',
      name: 'Chevron Main Gate Perimeter Patrol',
      siteId: site1.id,
      assignedGuardId: createdGuards[0], // Adamu Ibrahim
      scheduledStart: new Date('2024-01-01T06:00:00Z'),
      scheduledEnd: new Date('2024-12-31T18:00:00Z'),
      frequency: 'DAILY',
      isActive: true,
    },
  });

  const patrolRoute2 = await prisma.patrolRoute.upsert({
    where: { id: 'seed-route-002' },
    update: {},
    create: {
      id: 'seed-route-002',
      name: 'Banana Island Alpha Perimeter Sweep',
      siteId: site2.id,
      assignedGuardId: createdGuards[2], // Chukwudi Okafor
      scheduledStart: new Date('2024-01-01T06:00:00Z'),
      scheduledEnd: new Date('2024-12-31T18:00:00Z'),
      frequency: 'DAILY',
      isActive: true,
    },
  });
  console.log('Created 2 Patrol Routes');

  // 8. Create Checkpoints for each route
  const checkpointsData = [
    // Route 1 checkpoints
    {
      id: 'seed-cp-001',
      patrolRouteId: patrolRoute1.id,
      name: 'East Gate Entry Point',
      qrCodeToken: 'qr-chevron-east-gate',
      sequenceOrder: 1,
      expectedLatitude: 6.4385,
      expectedLongitude: 3.5352,
    },
    {
      id: 'seed-cp-002',
      patrolRouteId: patrolRoute1.id,
      name: 'South Perimeter Fence',
      qrCodeToken: 'qr-chevron-south-fence',
      sequenceOrder: 2,
      expectedLatitude: 6.4370,
      expectedLongitude: 3.5350,
    },
    {
      id: 'seed-cp-003',
      patrolRouteId: patrolRoute1.id,
      name: 'West Service Gate',
      qrCodeToken: 'qr-chevron-west-gate',
      sequenceOrder: 3,
      expectedLatitude: 6.4380,
      expectedLongitude: 3.5340,
    },
    {
      id: 'seed-cp-004',
      patrolRouteId: patrolRoute1.id,
      name: 'North Fuel Storage Area',
      qrCodeToken: 'qr-chevron-north-storage',
      sequenceOrder: 4,
      expectedLatitude: 6.4395,
      expectedLongitude: 3.5355,
    },
    // Route 2 checkpoints
    {
      id: 'seed-cp-005',
      patrolRouteId: patrolRoute2.id,
      name: 'Main Entrance Gate',
      qrCodeToken: 'qr-banana-main-gate',
      sequenceOrder: 1,
      expectedLatitude: 6.4531,
      expectedLongitude: 3.4447,
    },
    {
      id: 'seed-cp-006',
      patrolRouteId: patrolRoute2.id,
      name: 'Waterfront Boundary',
      qrCodeToken: 'qr-banana-waterfront',
      sequenceOrder: 2,
      expectedLatitude: 6.4520,
      expectedLongitude: 3.4455,
    },
    {
      id: 'seed-cp-007',
      patrolRouteId: patrolRoute2.id,
      name: 'Clubhouse Security Point',
      qrCodeToken: 'qr-banana-clubhouse',
      sequenceOrder: 3,
      expectedLatitude: 6.4540,
      expectedLongitude: 3.4440,
    },
  ];

  for (const cp of checkpointsData) {
    await prisma.patrolCheckpoint.upsert({
      where: { id: cp.id },
      update: {},
      create: cp,
    });
  }
  console.log(`Created ${checkpointsData.length} Checkpoints`);

  // 9. Create Patrol Records (2-3 with completion data)
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const patrolRecordsData = [
    {
      id: 'seed-patrol-record-001',
      routeId: patrolRoute1.id,
      guardId: createdGuards[0],
      startTime: new Date(yesterday.getTime() + 8 * 3600000), // 08:00
      endTime: new Date(yesterday.getTime() + 8.75 * 3600000), // 08:45
      status: 'COMPLETED',
      scannedCheckpoints: JSON.stringify(['seed-cp-001', 'seed-cp-002', 'seed-cp-003', 'seed-cp-004']),
      missedCheckpoints: '[]',
      completionPercentage: 100,
      generalNotes: 'All checkpoints clear. No irregularities found.',
    },
    {
      id: 'seed-patrol-record-002',
      routeId: patrolRoute2.id,
      guardId: createdGuards[2],
      startTime: new Date(yesterday.getTime() + 10 * 3600000), // 10:00
      endTime: new Date(yesterday.getTime() + 10.5 * 3600000), // 10:30
      status: 'COMPLETED',
      scannedCheckpoints: JSON.stringify(['seed-cp-005', 'seed-cp-006']),
      missedCheckpoints: JSON.stringify(['seed-cp-007']),
      completionPercentage: 66,
      generalNotes: 'Clubhouse checkpoint area was under renovation; access restricted.',
    },
    {
      id: 'seed-patrol-record-003',
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
