# Database Design (MongoDB)

## Collections Overview

```
buildings
users
units
expenses
expense_shares        (per-unit breakdown of each expense)
payments
projects
announcements
notifications
```

## Schema Definitions

### 1. Building
```javascript
{
  _id: ObjectId,
  name: "Sunrise Residences",
  address: {
    street: "123 Main St",
    city: "Istanbul",
    district: "Kadikoy",
    postalCode: "34710"
  },
  totalUnits: 24,
  currency: "TRY",
  settings: {
    paymentGateway: "nestpay",
    defaultPaymentFrequency: "monthly",    // monthly | bimonthly | quarterly | biannual | annual
    lateFeePercentage: 0,                   // 0 = no late fees
    fiscalYearStart: 1                      // month number (1 = January)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. User
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,              // FK → Building (for future multi-building)
  email: "sara@example.com",
  phone: "+905551234567",
  passwordHash: "bcrypt...",
  firstName: "Sara",
  lastName: "Yilmaz",
  role: "resident",                  // "admin" | "resident"
  unitIds: [ObjectId],               // FK → Unit[] (a user can own multiple units)
  paymentFrequency: "monthly",       // their chosen payment plan
  isActive: true,
  fcmTokens: ["token1", "token2"],   // for push notifications (multiple devices)
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { email: 1 } unique, { buildingId: 1, role: 1 }, { buildingId: 1, isActive: 1 }
```

### 3. Unit (Apartment)
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  unitNumber: "3A",                  // display label
  floor: 3,
  shareCoefficient: 1.0,            // expense distribution ratio (larger units pay more)
  residentId: ObjectId | null,       // FK → User (current occupant)
  type: "apartment",                 // "apartment" | "commercial" | "parking"
  area: 120,                         // square meters (used for coefficient calc)
  isOccupied: true,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { buildingId: 1, unitNumber: 1 } unique, { buildingId: 1, residentId: 1 }
```

### 4. Expense
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  title: "Monthly Cleaning Service",
  description: "Professional cleaning of common areas",
  category: "fixed",                 // "fixed" | "maintenance" | "elevator" | "project" | "emergency"
  amount: 5000.00,                   // total expense amount
  currency: "TRY",
  isRecurring: true,
  recurrence: {
    frequency: "monthly",            // "monthly" | "quarterly" | "annual"
    dayOfMonth: 1,                   // when to generate
    startDate: Date,
    endDate: Date | null             // null = ongoing
  },
  projectId: ObjectId | null,        // FK → Project (if category is "project")
  attachments: [{
    filename: "invoice_jan.pdf",
    url: "s3://...",
    uploadedAt: Date
  }],
  status: "active",                  // "active" | "cancelled"
  createdBy: ObjectId,               // FK → User (admin)
  date: Date,                        // expense date
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { buildingId: 1, category: 1 }, { buildingId: 1, date: -1 }, { buildingId: 1, isRecurring: 1 }
```

### 5. ExpenseShare (Per-Unit Breakdown)
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  expenseId: ObjectId,               // FK → Expense
  unitId: ObjectId,                  // FK → Unit
  residentId: ObjectId,              // FK → User (denormalized for query speed)
  amount: 208.33,                    // this unit's share (expense.amount * unit.shareCoefficient / totalCoefficients)
  period: "2026-04",                 // YYYY-MM format
  dueDate: Date,
  status: "unpaid",                  // "unpaid" | "partial" | "paid"
  paidAmount: 0,
  createdAt: Date,
  updatedAt: Date
}
// Indexes:
// { buildingId: 1, residentId: 1, period: 1 }
// { buildingId: 1, unitId: 1, status: 1 }
// { buildingId: 1, expenseId: 1 }
// { buildingId: 1, dueDate: 1, status: 1 }
```

### 6. Payment
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  residentId: ObjectId,              // FK → User
  unitId: ObjectId,                  // FK → Unit
  amount: 1500.00,
  currency: "TRY",
  method: "online",                  // "cash" | "online" | "bank_transfer"
  status: "completed",               // "pending" | "completed" | "failed" | "refunded"

  // Which expense shares this payment covers
  appliedTo: [{
    expenseShareId: ObjectId,
    amount: 750.00
  }],

  // Online payment details
  gateway: {
    provider: "nestpay",
    transactionId: "NP-123456",
    authCode: "AUTH789",
    responseCode: "00",
    raw: {}                          // full gateway response (encrypted at rest)
  },

  // Cash payment details
  cash: {
    recordedBy: ObjectId,            // FK → User (admin who recorded it)
    receiptNumber: "R-2026-0042"
  },

  notes: "Paid for Jan-Mar 2026",
  paymentDate: Date,
  createdAt: Date,
  updatedAt: Date
}
// Indexes:
// { buildingId: 1, residentId: 1, paymentDate: -1 }
// { buildingId: 1, status: 1 }
// { "gateway.transactionId": 1 } sparse
```

### 7. Project
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  title: "Elevator Modernization",
  description: "Replace elevator control panel and cabin interior",
  estimatedCost: 150000.00,
  actualCost: 0,
  status: "planned",                 // "planned" | "in_progress" | "completed" | "cancelled"
  startDate: Date,
  endDate: Date | null,
  expenseIds: [ObjectId],            // FK → Expense[] (linked expenses)
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { buildingId: 1, status: 1 }
```

### 8. Announcement
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  title: "Water Outage This Weekend",
  body: "City water maintenance scheduled for Saturday 9am-5pm",
  priority: "normal",               // "low" | "normal" | "urgent"
  createdBy: ObjectId,
  targetAudience: "all",             // "all" | "specific"
  targetUnitIds: [],                 // if targetAudience is "specific"
  readBy: [{ userId: ObjectId, readAt: Date }],
  createdAt: Date,
  updatedAt: Date
}
// Indexes: { buildingId: 1, createdAt: -1 }
```

### 9. Notification
```javascript
{
  _id: ObjectId,
  buildingId: ObjectId,
  userId: ObjectId,                  // FK → User (recipient)
  type: "payment_reminder",         // "payment_reminder" | "payment_confirmed" | "new_expense" | "announcement" | "project_update"
  title: "Payment Reminder",
  body: "You have 2,500 TRY due by April 15",
  data: {                           // navigation deep-link data
    screen: "PaymentDetail",
    params: { expenseShareId: "..." }
  },
  isRead: false,
  sentVia: ["push", "in_app"],      // "push" | "in_app" | "sms"
  createdAt: Date
}
// Indexes: { userId: 1, isRead: 1, createdAt: -1 }, { buildingId: 1, type: 1 }
```

## Entity Relationship Diagram

```
Building 1──* Unit 1──1 User (resident)
Building 1──* User
Building 1──* Expense 1──* ExpenseShare *──1 Unit
Building 1──* Payment *──1 User, *──1 Unit
Building 1──* Project 1──* Expense
Building 1──* Announcement
User 1──* Notification
Payment *──* ExpenseShare (via appliedTo array)
```

## Data Isolation Strategy

- **Between residents**: All queries for resident role filter by `residentId` from JWT. No endpoint returns another resident's payment or balance data.
- **Between buildings (future)**: All queries filter by `buildingId` extracted from JWT. A database middleware enforces this automatically.
- **Aggregated views**: Building-level expense views use MongoDB aggregation pipelines that sum totals without exposing per-resident data.
