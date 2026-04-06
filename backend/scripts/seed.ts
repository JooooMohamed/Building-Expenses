/**
 * Seed script: Creates a building, admin user, sample units, residents, and expenses
 * Run with: npx ts-node scripts/seed.ts
 */
import mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/building-expenses';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db!;

  // Clean existing data
  const collections = ['buildings', 'users', 'units', 'expenses', 'expenseshares', 'payments'];
  for (const col of collections) {
    try { await db.collection(col).drop(); } catch { /* ignore if doesn't exist */ }
  }

  // 1. Create Building
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
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const buildingId = buildingResult.insertedId;

  // 2. Create Admin
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

  // 3. Create Residents & Units
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

  for (const r of residents) {
    const userResult = await db.collection('users').insertOne({
      buildingId,
      email: `${r.first.toLowerCase()}@residents.com`,
      phone: `+9055510000${residents.indexOf(r) + 2}`,
      passwordHash: residentHash,
      firstName: r.first,
      lastName: r.last,
      role: 'resident',
      unitIds: [],
      paymentFrequency: 'monthly',
      isActive: true,
      fcmTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const userId = userResult.insertedId;

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

    // Update user with unitId
    await db.collection('users').updateOne(
      { _id: userId },
      { $set: { unitIds: [unitResult.insertedId] } },
    );
  }

  // 4. Create sample expenses
  const expenseData = [
    { title: 'Monthly Cleaning Service', category: 'fixed', amount: 4000, recurring: true },
    { title: 'Security Guard Service', category: 'fixed', amount: 6000, recurring: true },
    { title: 'Common Area Electricity', category: 'fixed', amount: 1200, recurring: true },
    { title: 'Elevator Maintenance (Q1)', category: 'elevator', amount: 3000, recurring: false },
    { title: 'Water Pump Repair', category: 'emergency', amount: 2500, recurring: false },
  ];

  for (const exp of expenseData) {
    await db.collection('expenses').insertOne({
      buildingId,
      title: exp.title,
      description: '',
      category: exp.category,
      amount: exp.amount,
      currency: 'TRY',
      isRecurring: exp.recurring,
      status: 'active',
      createdBy: adminResult.insertedId,
      date: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log('Seed completed successfully!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Admin:    admin@building.com / admin123');
  console.log('  Resident: sara@residents.com / resident123');
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
