# Payment Integration, Notifications & Reporting

## 1. Payment Integration (Nestpay / Generic Gateway)

### Payment Flow
```
┌──────────┐    1. Initiate     ┌──────────┐    2. Create session    ┌──────────┐
│  Mobile   │ ─────────────────→│  Backend  │ ──────────────────────→│ Nestpay  │
│   App     │                   │  (NestJS) │                        │ Gateway  │
└──────────┘                    └──────────┘                         └──────────┘
     │                               │                                    │
     │ 3. Receive payment URL        │                                    │
     │←──────────────────────────────│                                    │
     │                               │                                    │
     │ 4. Open WebView with URL      │                                    │
     │──────────────────────────────────────────────────────────────────→ │
     │                               │                                    │
     │ 5. User completes payment     │    6. Callback (server-to-server)  │
     │                               │←───────────────────────────────────│
     │                               │                                    │
     │ 7. Confirm + update balance   │                                    │
     │←──────────────────────────────│                                    │
```

### Implementation Details

**Step 1: Initiate Payment (Mobile → Backend)**
```
POST /api/v1/payments/initiate
{
  "amount": 2500.00,
  "expenseShareIds": ["id1", "id2"],
  "returnUrl": "buildingexpenses://payment-result"
}
```

**Step 2: Backend Creates Gateway Session**
- Generates unique orderId
- Creates Payment record with status "pending"
- Sends request to Nestpay API with amount, orderId, callback URL
- Returns payment page URL to mobile

**Step 3: Mobile Opens WebView**
- React Native WebView loads the payment page
- User enters card details on Nestpay's hosted page (PCI compliant — we never touch card data)

**Step 4: Gateway Callback (Server-to-Server)**
```
POST /api/v1/payments/callback  (called by Nestpay)
- Verify HMAC signature
- Update Payment status to "completed" or "failed"
- If completed: update ExpenseShare statuses and paidAmounts
- Send push notification to resident
```

**Step 5: Mobile Receives Result**
- WebView redirects to deep link `buildingexpenses://payment-result?orderId=xxx`
- App queries backend for payment status
- Shows success/failure screen

### Cash Payment Flow
```
Admin App → POST /api/v1/admin/payments/cash
- Creates Payment record with method: "cash"
- Generates receipt number
- Updates ExpenseShare statuses
- Sends notification to resident: "Payment of X recorded"
```

### Payment Allocation Logic
When a payment comes in, it's applied to expense shares in order:
1. Oldest unpaid first (FIFO)
2. If payment exceeds one share, overflow goes to next share
3. Partial payments update `paidAmount` and set status to "partial"

---

## 2. Notification System

### Channels
| Channel | Technology | Use Case |
|---------|-----------|----------|
| Push | Firebase Cloud Messaging (FCM) | Payment reminders, confirmations, announcements |
| In-App | Notification collection + polling | Persistent record of all notifications |

### Notification Types
| Type | Trigger | Audience |
|------|---------|----------|
| `payment_reminder` | Cron job: 3 days before due date | Residents with unpaid shares |
| `payment_confirmed` | After successful payment | Paying resident |
| `new_expense` | Admin creates expense | All residents |
| `announcement` | Admin creates announcement | Targeted or all residents |
| `project_update` | Admin updates project status | All residents |
| `overdue` | Cron job: 1 day after due date | Residents with overdue shares |

### Implementation
```
Backend (NestJS)
  └── NotificationService
       ├── send(userId, type, title, body, data)
       │    ├── Create Notification document
       │    └── Send via FCM to user's fcmTokens[]
       │
       └── Cron Jobs (via @nestjs/schedule)
            ├── Daily 9:00 AM: Check for upcoming dues → send reminders
            └── Daily 10:00 AM: Check for overdue → send overdue notices
```

### FCM Integration
- Mobile app registers FCM token on login and stores in User.fcmTokens[]
- Backend uses `firebase-admin` SDK to send push notifications
- Token refresh handled automatically by Expo notifications

---

## 3. Reporting System

### Report Types

#### Monthly Financial Report
```
GET /api/v1/admin/reports/monthly?month=2026-04
Response:
{
  "period": "2026-04",
  "expenses": {
    "fixed": 12000.00,
    "maintenance": 3500.00,
    "elevator": 2000.00,
    "project": 0,
    "emergency": 1500.00,
    "total": 19000.00
  },
  "collections": {
    "expected": 19000.00,
    "collected": 14250.00,
    "collectionRate": 75.0,
    "byMethod": {
      "online": 9000.00,
      "cash": 5250.00
    }
  },
  "outstanding": {
    "total": 4750.00,
    "residentCount": 6
  }
}
```

#### Collection Status Report
```
GET /api/v1/admin/reports/collection?month=2026-04
Response:
{
  "residents": [
    {
      "residentId": "...",
      "name": "Sara Yilmaz",
      "unit": "3A",
      "totalDue": 750.00,
      "totalPaid": 750.00,
      "status": "paid"
    },
    {
      "residentId": "...",
      "name": "Karim Demir",
      "unit": "5B",
      "totalDue": 750.00,
      "totalPaid": 375.00,
      "status": "partial"
    }
  ],
  "summary": {
    "paid": 18,
    "partial": 3,
    "unpaid": 3,
    "total": 24
  }
}
```

#### Admin Dashboard Analytics
- Total balance outstanding across all residents
- Month-over-month collection trend (last 6 months)
- Expense breakdown by category (pie chart data)
- Top 5 overdue residents (for follow-up)

### Report Generation
- Reports computed via MongoDB aggregation pipelines
- Cached in Redis for 1 hour (dashboard) or until invalidated (monthly reports)
- PDF export via `pdfkit` for downloadable reports
