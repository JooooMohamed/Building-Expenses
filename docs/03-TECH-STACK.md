# Tech Stack Justification

## Core Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Mobile | React Native (Expo) | Cross-platform (iOS + Android) from single codebase. Expo simplifies builds, OTA updates, and push notifications. Large ecosystem. |
| Backend | NestJS (Node.js) | TypeScript-first, modular architecture with built-in DI, guards, pipes, and interceptors. Maps cleanly to our domain modules. Better structure than Express for a production app. |
| Database | MongoDB (Mongoose ODM) | Flexible schema fits our varied expense types. Embedded documents work well for payment records. Easy to add fields without migrations. MongoDB Atlas provides managed hosting. |
| Cache | Redis | Session store, rate limiting, caching frequently-read data (dashboard aggregations). |

## Recommended Libraries

### Backend (NestJS)
| Library | Purpose |
|---------|---------|
| `@nestjs/mongoose` | MongoDB integration |
| `@nestjs/jwt` + `@nestjs/passport` | JWT authentication |
| `bcryptjs` | Password hashing |
| `class-validator` + `class-transformer` | DTO validation |
| `helmet` | HTTP security headers |
| `@nestjs/throttler` | Rate limiting |
| `firebase-admin` | Push notifications via FCM |
| `dayjs` | Date manipulation |
| `pdfkit` or `@react-pdf/renderer` | Report generation |

### Mobile (React Native / Expo)
| Library | Purpose |
|---------|---------|
| `expo-router` | File-based navigation |
| `@tanstack/react-query` | Server state management + caching |
| `zustand` | Lightweight client state |
| `expo-secure-store` | Secure token storage |
| `expo-notifications` | Push notification handling |
| `react-native-paper` or `nativewind` | UI components / styling |
| `react-hook-form` + `zod` | Form management + validation |
| `axios` | HTTP client |
| `dayjs` | Date formatting |
| `react-native-webview` | Payment gateway redirect |

## Why NOT Alternatives

| Alternative | Why Not |
|------------|---------|
| Flutter | Team expertise is in JS/TS ecosystem. React Native + Expo has better JS interop. |
| Express (raw) | Lacks structure for a production app with 10+ modules. NestJS provides conventions. |
| PostgreSQL | MongoDB's flexible schema is better for varied expense types and evolving requirements. No complex joins needed — our data model is document-oriented. |
| Firebase/Supabase | We need full control over business logic, payment processing, and data isolation. BaaS limits customization. |
