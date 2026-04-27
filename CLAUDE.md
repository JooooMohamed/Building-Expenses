# BuildingExpenses

Residential building financial management app for informal building managers in Egypt/MENA.
Stack: NestJS backend (MongoDB + Redis) + React Native mobile (iOS/Android).

## Development commands

```bash
# Backend
docker-compose up -d             # start MongoDB + Redis
cd backend && npm run start:dev  # start API server (port 3000, watch mode)
cd backend && npm test           # run unit tests
cd backend && npm run test:e2e   # run e2e tests

# Mobile
cd mobile && npm run start       # start Metro bundler
cd mobile && npm run android     # run on Android emulator/device
cd mobile && npm run ios         # run on iOS simulator
```

## Project structure

```
backend/src/
  auth/          # JWT auth, login, refresh
  buildings/     # Building management
  units/         # Unit management
  payments/      # Cash payment recording + receipt generation
  expenses/      # Expense tracking + per-unit allocation
  billing/       # Billing periods + resident charges
  notifications/ # FCM push notifications
  reports/       # Financial reports
  announcements/ # Building announcements
  audit/         # Audit log

mobile/src/
  screens/admin/    # Manager flows (CashPaymentScreen, expenses, billing, reports)
  screens/resident/ # Resident flows (dashboard, payment history, expenses)
  screens/auth/     # Login, forgot password
  api/              # API client (admin.ts, resident.ts, auth.ts)
  store/            # Zustand auth store
  navigation/       # AppNavigator (role-based: admin tabs vs resident tabs)
```

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. The
skill has multi-step workflows, checklists, and quality gates that produce better
results than an ad-hoc answer. When in doubt, invoke the skill. A false positive is
cheaper than a false negative.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke /office-hours
- Strategy, scope, "think bigger", "what should we build" → invoke /plan-ceo-review
- Architecture, "does this design make sense" → invoke /plan-eng-review
- Design system, brand, "how should this look" → invoke /design-consultation
- Design review of a plan → invoke /plan-design-review
- Developer experience of a plan → invoke /plan-devex-review
- "Review everything", full review pipeline → invoke /autoplan
- Bugs, errors, "why is this broken", "wtf", "this doesn't work" → invoke /investigate
- Test the site, find bugs, "does this work" → invoke /qa (or /qa-only for report only)
- Code review, check the diff, "look at my changes" → invoke /review
- Visual polish, design audit, "this looks off" → invoke /design-review
- Developer experience audit, try onboarding → invoke /devex-review
- Ship, deploy, create a PR, "send it" → invoke /ship
- Merge + deploy + verify → invoke /land-and-deploy
- Configure deployment → invoke /setup-deploy
- Post-deploy monitoring → invoke /canary
- Update docs after shipping → invoke /document-release
- Weekly retro, "how'd we do" → invoke /retro
- Second opinion, codex review → invoke /codex
- Safety mode, careful mode, lock it down → invoke /careful or /guard
- Restrict edits to a directory → invoke /freeze or /unfreeze
- Upgrade gstack → invoke /gstack-upgrade
- Save progress, "save my work" → invoke /context-save
- Resume, restore, "where was I" → invoke /context-restore
- Security audit, OWASP, "is this secure" → invoke /cso
- Make a PDF, document, publication → invoke /make-pdf
- Launch real browser for QA → invoke /open-gstack-browser
- Import cookies for authenticated testing → invoke /setup-browser-cookies
- Performance regression, page speed, benchmarks → invoke /benchmark
- Review what gstack has learned → invoke /learn
- Tune question sensitivity → invoke /plan-tune
- Code quality dashboard → invoke /health
