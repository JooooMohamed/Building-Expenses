# Authentication, Authorization & API Design

## Authentication Strategy

### JWT-Based Auth
- **Access Token**: Short-lived (15 minutes), stored in memory on mobile
- **Refresh Token**: Long-lived (30 days), stored in `expo-secure-store`
- **Password**: Hashed with bcrypt (12 rounds)

### Auth Flow
```
1. POST /api/v1/auth/login { email, password }
   → Returns { accessToken, refreshToken, user }

2. All subsequent requests include:
   Authorization: Bearer <accessToken>

3. When access token expires:
   POST /api/v1/auth/refresh { refreshToken }
   → Returns new { accessToken, refreshToken }

4. POST /api/v1/auth/logout { refreshToken }
   → Invalidates refresh token
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| `admin` | Full CRUD on all resources. Can see all residents' data. Can record payments. |
| `resident` | Read own payment data, read aggregated expenses, make online payments. |

Implemented via NestJS Guards:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('all-payments')
getAllPayments() { ... }
```

## API Design

### Base URL: `/api/v1`

### Auth Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | None | Login |
| POST | `/auth/refresh` | None | Refresh token |
| POST | `/auth/logout` | User | Invalidate refresh token |
| POST | `/auth/change-password` | User | Change own password |

### Resident Endpoints (Role: resident)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/me/dashboard` | Get dashboard summary (dues, paid, balance) |
| GET | `/me/payments` | Get own payment history |
| GET | `/me/expense-shares` | Get own expense shares with status |
| GET | `/me/notifications` | Get own notifications |
| PATCH | `/me/notifications/:id/read` | Mark notification as read |
| PATCH | `/me/payment-frequency` | Update payment plan preference |
| GET | `/building/expenses` | Get aggregated building expenses |
| GET | `/building/announcements` | Get announcements |
| POST | `/payments/initiate` | Start online payment |
| POST | `/payments/callback` | Payment gateway callback (webhook) |

### Admin Endpoints (Role: admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/residents` | List all residents |
| POST | `/admin/residents` | Create resident + assign unit |
| PATCH | `/admin/residents/:id` | Update resident |
| DELETE | `/admin/residents/:id` | Deactivate resident |
| GET | `/admin/units` | List all units |
| POST | `/admin/units` | Create unit |
| PATCH | `/admin/units/:id` | Update unit |
| POST | `/admin/expenses` | Create expense |
| PATCH | `/admin/expenses/:id` | Update expense |
| DELETE | `/admin/expenses/:id` | Cancel expense |
| POST | `/admin/payments/cash` | Record cash payment |
| GET | `/admin/payments` | List all payments (filterable) |
| GET | `/admin/payment-status` | Get all residents' payment status |
| POST | `/admin/projects` | Create project |
| PATCH | `/admin/projects/:id` | Update project |
| POST | `/admin/announcements` | Create announcement |
| GET | `/admin/reports/monthly` | Monthly financial report |
| GET | `/admin/reports/collection` | Collection rate report |

### Example Request/Response

#### GET `/api/v1/me/dashboard`
```json
// Response 200
{
  "resident": {
    "name": "Sara Yilmaz",
    "unitNumber": "3A"
  },
  "summary": {
    "totalDue": 7500.00,
    "totalPaid": 5000.00,
    "remainingBalance": 2500.00,
    "currency": "TRY"
  },
  "currentMonthDues": [
    {
      "expenseShareId": "665a...",
      "expenseTitle": "Monthly Cleaning",
      "category": "fixed",
      "amount": 208.33,
      "status": "unpaid",
      "dueDate": "2026-04-15"
    }
  ],
  "recentPayments": [
    {
      "paymentId": "665b...",
      "amount": 2500.00,
      "method": "online",
      "date": "2026-03-01",
      "status": "completed"
    }
  ]
}
```

#### POST `/api/v1/admin/payments/cash`
```json
// Request
{
  "residentId": "665a...",
  "unitId": "664b...",
  "amount": 1500.00,
  "paymentDate": "2026-04-05",
  "expenseShareIds": ["665c...", "665d..."],
  "notes": "Paid in cash at office"
}

// Response 201
{
  "paymentId": "665e...",
  "receiptNumber": "R-2026-0042",
  "status": "completed",
  "appliedTo": [
    { "expenseShareId": "665c...", "amount": 750.00, "newStatus": "paid" },
    { "expenseShareId": "665d...", "amount": 750.00, "newStatus": "paid" }
  ]
}
```

## Security Best Practices

1. **Rate limiting**: 100 requests/minute per IP, 20/minute for auth endpoints
2. **Input validation**: All DTOs validated with class-validator before hitting service layer
3. **Helmet**: Security headers on all responses
4. **CORS**: Whitelist only mobile app origins
5. **Refresh token rotation**: Each refresh invalidates the old token
6. **Password policy**: Minimum 8 chars, must include letter + number
7. **Sensitive data**: Payment gateway responses encrypted at rest
8. **Audit logging**: All admin actions logged with userId and timestamp
