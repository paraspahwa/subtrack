# SubTrack — Subscription Tracker

Stop losing money to forgotten subscriptions. SubTrack lets you track all your subscriptions in one place, visualize your true monthly spend, catch price increases, and stay on top of upcoming renewals — with a gamification layer that makes managing finances engaging.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) |
| Backend (primary) | InsForge SDK (`@insforge/sdk`) |
| Backend (fallback) | FastAPI (Python) |
| Database | InsForge Postgres (with Row Level Security) |
| Edge Functions | Deno / TypeScript (deployed on InsForge) |
| Payments | Razorpay |
| Auth | InsForge Auth (JWT, email OTP verification) |

---

## Screens

| Screen | Description |
|---|---|
| Landing | Marketing/onboarding entry point |
| Auth | Sign up, log in, email verification, password reset |
| Dashboard | Subscription list, analytics panel, action center, price alerts |
| Pricing | Plan comparison and Razorpay payment flow |
| Settings | Profile, theme, mailbox discovery, notification preferences |
| Calendar |  Monthly billing calendar view of upcoming charges |
| BossBattle |  Gamification — defeat subscription "bosses" by cancelling unused services |

---

## Features

- **Subscription Tracking**: Add, edit, and delete subscriptions with billing cycle, currency, category, usage rating, and shared member count.
- **Analytics**: Real-time monthly/yearly spend totals, spend-by-category breakdown, and upcoming renewal list — currency-converted to your home currency.
- **Price Alerts**: Automatic detection of amount changes on subscriptions; dismissible per-subscription alerts.
- **Billing Calendar**:  Visual monthly calendar showing when each subscription renews.
- **Action Center**: Flags subscriptions due within 7 or 30 days and subscriptions with a low usage rating (1–2 out of 5).
- **Mailbox Discovery**: Connect a Gmail/email account to automatically detect subscription candidates from receipts. Accept, reject, or mark as false positive.
- **Payments / Plan Upgrade**: Razorpay-powered upgrade flow for Pro and premium tiers.
- **Gamification — Boss Battle**:  XP, levels, achievements, and boss battles tied to cancelling low-value subscriptions and hitting savings milestones.
- **Multi-Currency**: Subscriptions stored in their native currency and converted to your home currency (USD, INR, EUR, GBP supported) for all totals.
- **Themes**: Light/dark and custom theme support via ThemeContext.

---

## Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Link InsForge Project

```bash
npx @insforge/cli link --project-id 2a8ec6eb-db15-462d-b557-88b207b3bb5d
```

### 2. Run Database Migrations

Apply migrations from `insforge/migrations/` in order:

```
insforge/migrations/01_schema.sql   # Tables: profiles, subscriptions, payments, mailbox_connections, discovery_candidates
insforge/migrations/02_triggers.sql # Auto-creates profile row on new user signup
```

### 3. Deploy Edge Functions

Edge functions live in `insforge/functions/`. Deploy each via the InsForge CLI or dashboard:

- `getanalytics` — spend analytics with currency conversion
- `razorpay-order` — creates a Razorpay order and stores a pending payment record
- `razorpay-verify` — verifies Razorpay signature and upgrades user plan
- `accept-candidate` — converts a discovery candidate into a tracked subscription

### 4. Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Open on web (Expo default port `19006`), Android emulator (press `a`), or iOS simulator (press `i`).

The InsForge base URL and anon key are configured in `frontend/src/config.js`.

---

## Project Structure

```
subtrack/
  App.js                         # Root navigator (React Navigation)
  frontend/
    src/
      api.js                     # All API calls (InsForge SDK)
      config.js                  # InsForge baseUrl + anonKey
      theme.js                   # Design tokens and category definitions
      ThemeContext.js             # Theme provider
      screens/
        LandingScreen.js
        AuthScreen.js
        DashboardScreen.js
        PricingScreen.js
        SettingsScreen.js
      components/
        SubCard.js
        SubModal.js
        AnalyticsPanel.js
        StaggerReveal.js
        BrandShapes.js
        InteractiveButton.js
  insforge/
    migrations/
      01_schema.sql
      02_triggers.sql
    functions/
      getanalytics/
      razorpay-order/
      razorpay-verify/
      accept-candidate/
      admin-create-user/
```

---

## Support

For enterprise setups or custom integrations, contact the SubTrack dev team.
