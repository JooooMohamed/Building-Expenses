# System Architecture

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   MOBILE CLIENTS                     │
│  ┌──────────────┐          ┌──────────────────┐     │
│  │ Resident App │          │   Admin App      │     │
│  │ (React Native)│         │ (React Native)   │     │
│  └──────┬───────┘          └────────┬─────────┘     │
│         │                           │                │
└─────────┼───────────────────────────┼────────────────┘
          │         HTTPS/TLS         │
          ▼                           ▼
┌─────────────────────────────────────────────────────┐
│                 API GATEWAY / LOAD BALANCER           │
│                    (Nginx / AWS ALB)                  │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│               BACKEND (NestJS on Node.js)            │
│                                                      │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ Auth Module │ │ Expense    │ │ Payment Module  │  │
│  │ (JWT+RBAC) │ │ Module     │ │ (Nestpay integ) │  │
│  └────────────┘ └────────────┘ └─────────────────┘  │
│  ┌────────────┐ ┌────────────┐ ┌─────────────────┐  │
│  │ Resident   │ │ Project    │ │ Notification    │  │
│  │ Module     │ │ Module     │ │ Module (FCM)    │  │
│  └────────────┘ └────────────┘ └─────────────────┘  │
│  ┌────────────┐ ┌────────────┐                       │
│  │ Report     │ │ Unit       │                       │
│  │ Module     │ │ Module     │                       │
│  └────────────┘ └────────────┘                       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                    DATA LAYER                        │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ MongoDB  │  │  Redis   │  │ File Storage      │  │
│  │ (Primary)│  │ (Cache & │  │ (S3 / local for   │  │
│  │          │  │  Sessions)│  │  receipts)        │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## 2. Single-Building Now, Multi-Building Later

### Current Design (MVP - Single Building)
- Every document includes an optional `buildingId` field
- For MVP, a single building document is created at setup time
- All queries implicitly scope to this one building
- No tenant isolation middleware needed yet

### Future Multi-Building Expansion
- `buildingId` becomes a required indexed field on all collections
- Add a `Building` collection with subscription/plan info
- Add middleware that extracts `buildingId` from JWT and injects it into all queries
- Database strategy options:
  - **Same DB, filtered by buildingId** (simplest, works up to ~100 buildings)
  - **Separate databases per building** (better isolation, more ops overhead)
  - **Sharded by buildingId** (enterprise scale)

### Key Design Decisions for Future-Proofing
1. All schemas include `buildingId` from day one
2. All service methods accept `buildingId` as parameter
3. API routes are structured as `/api/v1/...` (building derived from auth context)
4. No hardcoded single-building assumptions in business logic

## 3. Communication Patterns

- **Client → Server**: REST API over HTTPS
- **Server → Client (real-time)**: Firebase Cloud Messaging (push notifications)
- **Server → Client (in-app)**: Polling with cache (MVP) → WebSocket (future)

## 4. Deployment Architecture (Production)

```
Client → CloudFlare CDN → Nginx → NestJS (PM2 cluster) → MongoDB Atlas
                                                        → Redis Cloud
                                                        → AWS S3 (files)
```

For MVP: Single VPS (DigitalOcean/Hetzner) with Docker Compose is sufficient.
