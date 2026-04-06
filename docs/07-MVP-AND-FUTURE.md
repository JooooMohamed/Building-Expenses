# MVP Plan & Future Enhancements

## MVP Definition (Phase 1)

### Core Features — Build First
1. **Auth**: Login/logout for admin and residents (JWT)
2. **Admin: Manage residents**: Create, edit, deactivate residents and assign to units
3. **Admin: Manage expenses**: Create fixed/recurring and one-time expenses
4. **Admin: Record cash payments**: Log when a resident pays in cash
5. **Resident: Dashboard**: Show total due, paid, remaining balance
6. **Resident: Payment history**: List of all past payments
7. **Resident: View building expenses**: Aggregated expense view (no per-resident data)
8. **Admin: Payment status overview**: See paid/unpaid/partial for each resident

### Deferred to Phase 2
- Online payment (Nestpay integration)
- Push notifications
- Reports & PDF export
- Projects module
- Announcements

### Deferred to Phase 3+
- Multi-building support
- Analytics dashboard
- AI predictions
- Document storage
- Complaint system

## Suggested Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| **Phase 1: Core MVP** | 6-8 weeks | Auth, resident CRUD, expense management, cash payments, resident dashboard, payment history |
| **Phase 2: Payments & Comms** | 4-6 weeks | Nestpay integration, push notifications, announcements, monthly reports |
| **Phase 3: Advanced** | 4-6 weeks | Projects module, PDF reports, admin analytics dashboard |
| **Phase 4: Scale** | 8-12 weeks | Multi-building support, SaaS billing, onboarding flow |

## Phase 1 Sprint Breakdown

| Week | Tasks |
|------|-------|
| 1-2 | Backend setup, MongoDB schemas, Auth module, Building/Unit CRUD |
| 3-4 | Expense module, ExpenseShare distribution logic, Admin payment recording |
| 5-6 | React Native setup, Auth screens, Resident dashboard, Payment history |
| 7-8 | Admin panel screens, Testing, Bug fixes, Deploy to staging |

---

## Future Enhancements

### Multi-Building SaaS
- Add Building collection with subscription plans
- Tenant isolation middleware on all routes
- Admin console for building registration
- Billing system for the platform itself

### Analytics Dashboard
- Revenue forecasting based on historical collection rates
- Expense trend analysis
- Seasonal expense patterns
- Cash flow projection

### AI Predictions
- Predict which residents are likely to be late (based on payment history)
- Suggest optimal payment reminder timing
- Anomaly detection on expenses

### Complaint System
- Residents submit maintenance complaints with photos
- Admin assigns and tracks resolution
- Status updates pushed to resident

### Document Storage
- Upload receipts and invoices for each expense
- Residents can download their payment receipts
- PDF statement generation (monthly/annual)

### Additional Features
- Multi-language support (Turkish, English, Arabic)
- SMS notifications as fallback
- Accounting software integration (e-Fatura for Turkey)
- Resident voting on proposed projects
- Community discussion board
