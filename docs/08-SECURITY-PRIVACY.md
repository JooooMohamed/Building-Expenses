# Security & Privacy

## Data Isolation Between Residents

1. **Query-level isolation**: Every resident-facing endpoint filters by `residentId` extracted from the JWT token. No endpoint accepts a user-supplied `residentId` for resident-role requests.

2. **Aggregated-only building data**: The `/building/expenses` endpoint uses MongoDB aggregation to return category totals only — no per-resident amounts are ever included.

3. **Admin-only routes**: All endpoints under `/admin/*` are protected by the `RolesGuard` which checks `role === 'admin'` from the JWT payload.

## Payment Data Protection

1. **PCI Compliance**: We never store, process, or transmit credit card numbers. Payment is handled entirely on the gateway's hosted page via WebView. Only transaction IDs and auth codes are stored.

2. **Gateway callbacks**: Verified via HMAC signature before processing. The callback endpoint validates the signature against the shared secret before updating any payment status.

3. **Encrypted at rest**: MongoDB Atlas supports encryption at rest. Gateway response objects should be stored in encrypted fields if using custom hosting.

## API Security

| Protection | Implementation |
|-----------|---------------|
| Authentication | JWT with 15-min expiry + refresh token rotation |
| Authorization | Role-based guards on all endpoints |
| Rate limiting | `@nestjs/throttler` — 100 req/min general, 20 req/min on auth |
| Input validation | `class-validator` whitelist mode — rejects unknown fields |
| HTTP headers | `helmet` middleware (HSTS, CSP, X-Frame-Options, etc.) |
| CORS | Whitelist origins only |
| Password storage | bcrypt with 12 rounds |
| Token storage (mobile) | `expo-secure-store` (Keychain on iOS, Keystore on Android) |

## Best Practices Checklist

- [ ] Use HTTPS everywhere (enforce via Nginx redirect)
- [ ] Set `Secure` and `HttpOnly` flags on any cookies
- [ ] Implement refresh token rotation (each refresh invalidates the old token)
- [ ] Log all admin actions (expense creation, payment recording, user changes)
- [ ] Sanitize all user input before database queries
- [ ] Use parameterized queries (Mongoose handles this by default)
- [ ] Implement request logging with correlation IDs for audit trail
- [ ] Set MongoDB connection with `authSource=admin` and strong credentials
- [ ] Disable MongoDB shell access in production
- [ ] Regular dependency audits with `npm audit`
