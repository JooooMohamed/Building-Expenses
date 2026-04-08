/**
 * Seed script: Creates a building, admin, residents, units, expenses, charges, payments, and announcements
 * Run with: npx ts-node scripts/seed.ts
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dayjs from 'dayjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/building-expenses';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  // Clean existing data
  const collections = [
    'buildings', 'users', 'units', 'expenses', 'expenseshares',
    'payments', 'billingperiods', 'residentcharges', 'paymentallocations',
    'announcements', 'notifications', 'auditlogs', 'projects',
  ];
  for (const col of collections) {
    try { await db.collection(col).drop(); } catch { /* ignore */ }
  }

  // ── 1. Building ──────────────────────────────────
  const buildingResult = await db.collection('buildings').insertOne({
    name: 'Sunrise Residences',
    address: { street: '123 Ataturk Cad.', city: 'Istanbul', district: 'Kadikoy', postalCode: '34710' },
    totalUnits: 8,
    currency: 'TRY',
    settings: {
      paymentGateway: 'nestpay',
      defaultPaymentFrequency: 'monthly',
      lateFeePercentage: 0,
      fiscalYearStart: 1,
      dueDayOfMonth: 25,
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const buildingId = buildingResult.insertedId;

  // ── 2. Admin ─────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 12);
  const adminResult = await db.collection('users').insertOne({
    buildingId,
    email: 'admin@building.com',
    phone: '+905551000001',
    passwordHash: adminHash,
    firstName: 'Ahmed',
    lastName: 'Yilmaz',
    role: 'admin',
    unitIds: [],
    paymentFrequency: 'monthly',
    isActive: true,
    fcmTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const adminId = adminResult.insertedId;

  // ── 3. Residents & Units ─────────────────────────
  const residents = [
    { first: 'Sara', last: 'Demir', unit: '1A', floor: 1, area: 100, coeff: 1.0 },
    { first: 'Karim', last: 'Ozturk', unit: '1B', floor: 1, area: 120, coeff: 1.2 },
    { first: 'Fatma', last: 'Kaya', unit: '2A', floor: 2, area: 100, coeff: 1.0 },
    { first: 'Mehmet', last: 'Celik', unit: '2B', floor: 2, area: 120, coeff: 1.2 },
    { first: 'Ayse', last: 'Sahin', unit: '3A', floor: 3, area: 110, coeff: 1.1 },
    { first: 'Ali', last: 'Yildiz', unit: '3B', floor: 3, area: 130, coeff: 1.3 },
    { first: 'Zeynep', last: 'Arslan', unit: '4A', floor: 4, area: 140, coeff: 1.4 },
    { first: 'Emre', last: 'Dogan', unit: '4B', floor: 4, area: 150, coeff: 1.5 },
  ];

  const residentHash = await bcrypt.hash('resident123', 12);
  const residentIds: Record<string, mongoose.Types.ObjectId> = {};
  const unitIds: Record<string, mongoose.Types.ObjectId> = {};

  for (let i = 0; i < residents.length; i++) {
    const r = residents[i];
    const userResult = await db.collection('users').insertOne({
      buildingId,
      email: `${r.first.toLowerCase()}@residents.com`,
      phone: `+90555100${String(i + 2).padStart(4, '0')}`,
      passwordHash: residentHash,
      firstName: r.first,
      lastName: r.last,
      role: 'resident',
      unitIds: [],
      paymentFrequency: i < 4 ? 'monthly' : i < 6 ? 'bimonthly' : 'quarterly',
      isActive: true,
      fcmTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userId = userResult.insertedId;
    residentIds[r.unit] = userId;

    const unitResult = await db.collection('units').insertOne({
      buildingId,
      unitNumber: r.unit,
      floor: r.floor,
      shareCoefficient: r.coeff,
      residentId: userId,
      type: 'apartment',
      area: r.area,
      isOccupied: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    unitIds[r.unit] = unitResult.insertedId;

    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { unitIds: [unitResult.insertedId] } },
    );
  }

  // ── 4. Expenses ──────────────────────────────────
  const expenseData = [
    { title: 'Monthly Cleaning Service', category: 'fixed', amount: 4000, recurring: true },
    { title: 'Security Guard Service', category: 'fixed', amount: 6000, recurring: true },
    { title: 'Common Area Electricity', category: 'fixed', amount: 1200, recurring: true },
    { title: 'Building Insurance', category: 'fixed', amount: 2000, recurring: true },
    { title: 'Elevator Maintenance (Q1)', category: 'elevator', amount: 3000, recurring: false },
    { title: 'Water Pump Repair', category: 'emergency', amount: 2500, recurring: false },
    { title: 'Garden Landscaping', category: 'maintenance', amount: 1800, recurring: false },
  ];

  const expenseIds: mongoose.Types.ObjectId[] = [];
  const currentMonth = dayjs().format('YYYY-MM');
  const lastMonth = dayjs().subtract(1, 'month').format('YYYY-MM');

  for (const exp of expenseData) {
    const result = await db.collection('expenses').insertOne({
      buildingId,
      title: exp.title,
      description: '',
      category: exp.category,
      amount: exp.amount,
      currency: 'TRY',
      isRecurring: exp.recurring,
      status: 'active',
      createdBy: adminId,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expenseIds.push(result.insertedId);
  }

  // ── 5. Expense Shares (current + last month) ────
  const totalCoeff = residents.reduce((sum, r) => sum + r.coeff, 0);
  const totalExpense = expenseData.reduce((sum, e) => sum + e.amount, 0);

  for (const period of [lastMonth, currentMonth]) {
    const dueDate = dayjs(period, 'YYYY-MM').date(25).toDate();

    for (const r of residents) {
      const unitShare = r.coeff / totalCoeff;

      for (let i = 0; i < expenseData.length; i++) {
        const exp = expenseData[i];
        const shareAmount = Math.round(exp.amount * unitShare * 100) / 100;

        await db.collection('expenseshares').insertOne({
          buildingId,
          expenseId: expenseIds[i],
          unitId: unitIds[r.unit],
          residentId: residentIds[r.unit],
          amount: shareAmount,
          period,
          dueDate,
          status: period === lastMonth ? 'paid' : 'unpaid',
          paidAmount: period === lastMonth ? shareAmount : 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Billing period
    const start = dayjs(period, 'YYYY-MM').startOf('month').toDate();
    const end = dayjs(period, 'YYYY-MM').endOf('month').toDate();
    const bpResult = await db.collection('billingperiods').insertOne({
      buildingId,
      period,
      startDate: start,
      endDate: end,
      dueDate: dayjs(period, 'YYYY-MM').date(25).toDate(),
      totalCharged: totalExpense,
      totalCollected: period === lastMonth ? totalExpense : 0,
      status: period === lastMonth ? 'closed' : 'open',
      generatedBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Resident charges
    for (const r of residents) {
      const unitShare = r.coeff / totalCoeff;
      const chargeAmount = Math.round(totalExpense * unitShare * 100) / 100;

      await db.collection('residentcharges').insertOne({
        buildingId,
        billingPeriodId: bpResult.insertedId,
        unitId: unitIds[r.unit],
        residentId: residentIds[r.unit],
        period,
        amount: chargeAmount,
        paidAmount: period === lastMonth ? chargeAmount : 0,
        status: period === lastMonth ? 'paid' : 'unpaid',
        dueDate: dayjs(period, 'YYYY-MM').date(25).toDate(),
        chargeType: 'recurring',
        description: `Monthly charges for ${period}`,
        relatedExpenseIds: expenseIds,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  // ── 6. Sample Payments (for last month) ──────────
  for (const r of residents) {
    const unitShare = r.coeff / totalCoeff;
    const payAmount = Math.round(totalExpense * unitShare * 100) / 100;

    await db.collection('payments').insertOne({
      buildingId,
      residentId: residentIds[r.unit],
      unitId: unitIds[r.unit],
      amount: payAmount,
      currency: 'TRY',
      method: Math.random() > 0.5 ? 'cash' : 'online',
      status: 'completed',
      paymentDate: dayjs().subtract(1, 'month').date(20).toDate(),
      notes: 'Monthly payment',
      cash: {
        recordedBy: adminId,
        receiptNumber: `R-${dayjs().year()}-${Date.now()}-${r.unit}`,
      },
      appliedTo: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // One partial payment for current month (Sara)
  const saraShare = Math.round(totalExpense * (1.0 / totalCoeff) * 100) / 100;
  await db.collection('payments').insertOne({
    buildingId,
    residentId: residentIds['1A'],
    unitId: unitIds['1A'],
    amount: Math.round(saraShare * 0.5),
    currency: 'TRY',
    method: 'cash',
    status: 'completed',
    paymentDate: new Date(),
    notes: 'Partial payment',
    cash: { recordedBy: adminId, receiptNumber: `R-${dayjs().year()}-partial-1A` },
    appliedTo: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update Sara's current month charges to partial
  const saraPartialPaid = Math.round(saraShare * 0.5);
  await db.collection('residentcharges').updateOne(
    { residentId: residentIds['1A'], period: currentMonth },
    { $set: { paidAmount: saraPartialPaid, status: 'partial' } },
  );

  // ── 7. Project ───────────────────────────────────
  await db.collection('projects').insertOne({
    buildingId,
    title: 'Lobby Renovation',
    description: 'Complete renovation of the lobby area including new flooring and lighting',
    estimatedCost: 50000,
    actualCost: 0,
    status: 'planned',
    startDate: dayjs().add(1, 'month').toDate(),
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.collection('projects').insertOne({
    buildingId,
    title: 'Elevator Modernization',
    description: 'Upgrade elevator system to energy-efficient model',
    estimatedCost: 120000,
    actualCost: 35000,
    status: 'in_progress',
    startDate: dayjs().subtract(2, 'month').toDate(),
    createdBy: adminId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // ── 8. Announcements ─────────────────────────────
  await db.collection('announcements').insertMany([
    {
      buildingId,
      title: 'Monthly Meeting',
      body: 'Building residents monthly meeting will be held this Saturday at 2:00 PM in the common area. All residents are encouraged to attend.',
      priority: 'normal',
      createdBy: adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      buildingId,
      title: 'Water Maintenance',
      body: 'Water supply will be temporarily interrupted on Monday between 09:00-12:00 for maintenance work. Please plan accordingly.',
      priority: 'urgent',
      createdBy: adminId,
      createdAt: dayjs().subtract(2, 'day').toDate(),
      updatedAt: dayjs().subtract(2, 'day').toDate(),
    },
    {
      buildingId,
      title: 'New Recycling Program',
      body: 'Starting next month, we will have separate recycling bins in the garage for paper, plastic, and glass.',
      priority: 'low',
      createdBy: adminId,
      createdAt: dayjs().subtract(5, 'day').toDate(),
      updatedAt: dayjs().subtract(5, 'day').toDate(),
    },
  ]);

  // ── 9. Sample Notifications ──────────────────────
  await db.collection('notifications').insertMany([
    {
      buildingId,
      userId: residentIds['1A'],
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      body: `Your payment of ${saraPartialPaid.toLocaleString()} TRY has been recorded.`,
      data: {},
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      buildingId,
      userId: residentIds['1A'],
      type: 'announcement',
      title: 'New Announcement: Monthly Meeting',
      body: 'Building residents monthly meeting this Saturday at 2:00 PM.',
      data: {},
      isRead: true,
      createdAt: dayjs().subtract(1, 'day').toDate(),
      updatedAt: dayjs().subtract(1, 'day').toDate(),
    },
    {
      buildingId,
      userId: residentIds['2A'],
      type: 'payment_reminder',
      title: 'Payment Due Soon',
      body: `Your monthly payment for ${currentMonth} is due on the 25th.`,
      data: {},
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  console.log('');
  console.log('Seed completed successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:    admin@building.com / admin123');
  console.log('  Resident: sara@residents.com / resident123');
  console.log('  Resident: karim@residents.com / resident123');
  console.log('  (all residents use password: resident123)');
  console.log('');
  console.log(`Building ID: ${buildingId}`);
  console.log(`Current month: ${currentMonth}`);
  console.log(`Last month (paid): ${lastMonth}`);
  console.log(`Total monthly expense: ${totalExpense} TRY`);
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
