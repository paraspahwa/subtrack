# SubTrack — Architecture

## System Diagram

```
+---------------------------------------------------------------+
|                        React Native App                        |
|  (Expo / React Navigation)                                    |
|                                                               |
|  LandingScreen  AuthScreen  DashboardScreen  PricingScreen   |
|  SettingsScreen  [CalendarScreen]  [BossBattleScreen]         |
|                        |                                      |
|              frontend/src/api.js                              |
|          (InsForge SDK — @insforge/sdk)                       |
+---------------------------+-----------------------------------+
                            |
            +---------------+---------------+
            |                               |
   +--------+--------+           +---------+---------+
   |  InsForge Auth  |           | InsForge Database  |
   |  (JWT / OTP)    |           | (Postgres + RLS)   |
   +-----------------+           +-------------------+
                                         |
                            +-----------+-----------+
                            |   Edge Functions       |
                            |   (Deno / TypeScript)  |
                            |                        |
                            |  getanalytics          |
                            |  razorpay-order        |
                            |  razorpay-verify       |
                            |  accept-candidate      |
                            +------------------------+
                                         |
                                 +-------+-------+
                                 |   Razorpay    |
                                 |  (Payments)   |
                                 +---------------+
```

---

## Frontend Layer

### Navigation

Defined in `App.js` using `@react-navigation/native-stack`. Session state is checked on startup via `insforge.auth.getCurrentSession()` to route users to Dashboard (authenticated) or Landing (unauthenticated).

| Screen | Route Name | Purpose |
|---|---|---|
| LandingScreen | `Landing` | Onboarding, marketing, entry to Auth |
| AuthScreen | `Auth` | Sign up, log in, email OTP verification, password reset |
| DashboardScreen | `Dashboard` | Core screen: subscription list, analytics, action center, price alerts |
| PricingScreen | `Pricing` | Plan selection and Razorpay payment flow |
| SettingsScreen | `Settings` | Profile, theme picker, mailbox discovery, notification toggle |
| CalendarScreen | `Calendar` | Monthly billing calendar |
| BossBattleScreen | `BossBattle` | Gamification battles |

### Key Components

| Component | Description |
|---|---|
| `SubCard` | Renders a single subscription card with actions |
| `SubModal` | Create/edit subscription modal form |
| `AnalyticsPanel` | Spend summary, category breakdown, upcoming renewals |
| `StaggerReveal` | Animated staggered list reveal |
| `BrandShapes` | Decorative background shapes |
| `InteractiveButton` | Pressable button with feedback states |

### State Management

No global store (Redux/Zustand). Each screen manages its own state via `useState`/`useCallback`/`useEffect`. Theme is shared via `ThemeContext` (React Context).

---

## Backend Layer

### Primary: InsForge SDK

All data operations go through `@insforge/sdk` initialized in `frontend/src/api.js`:

- `insforge.auth.*` — authentication (sign up, sign in, session, OTP, password reset)
- `insforge.database.from(table).*` — Postgres queries with automatic JWT injection
- `insforge.functions.invoke(name)` — call Deno edge functions

Row Level Security (RLS) is enforced at the database level: every table policy uses `auth.uid()` to ensure users can only access their own rows.

### Fallback: FastAPI

A Python FastAPI backend exists as a fallback/legacy layer. It is not the primary data path for the current InsForge-SDK-based frontend.

### Edge Functions

Deployed as Deno TypeScript functions on InsForge. Each function:
1. Reads the `Authorization: Bearer <token>` header
2. Validates the session via `client.auth.getCurrentSession()`
3. Performs database operations with the user's identity

| Function | Trigger | What it does |
|---|---|---|
| `getanalytics` | `GET` (no body) | Computes monthly/yearly totals, category breakdown, upcoming renewals, and waste detection with currency conversion |
| `razorpay-order` | `POST { amount, currency, plan_type }` | Creates a Razorpay order and inserts a `pending` payment record |
| `razorpay-verify` | `POST { razorpay_order_id, razorpay_payment_id, razorpay_signature }` | Verifies HMAC-SHA256 signature, marks payment `success`, upgrades user profile plan |
| `accept-candidate` | `POST { id }` | Creates a subscription from a discovery candidate and marks the candidate `accepted` |

---

## Database Schema

All tables are in `public` schema with Row Level Security enabled. See `insforge/migrations/01_schema.sql`.

### `profiles`
Extension of `auth.users`. Auto-created on signup via trigger in `02_triggers.sql`.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | References `auth.users(id)` |
| `full_name` | TEXT | |
| `plan` | TEXT | `free`, `pro`, etc. |
| `home_currency` | TEXT | Default `USD` |
| `subscription_active` | BOOLEAN | Default `true` |
| `subscription_end_date` | TIMESTAMPTZ | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

### `subscriptions`
Core table for tracked subscriptions.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | References `auth.users(id)` |
| `name` | TEXT | Service name |
| `category` | TEXT | Default `Other` |
| `amount` | DOUBLE PRECISION | |
| `last_amount` | DOUBLE PRECISION | Previous amount for change detection |
| `amount_change_pct` | DOUBLE PRECISION | Percentage change |
| `amount_alert_dismissed` | BOOLEAN | Default `false` |
| `currency` | TEXT | Default `USD` |
| `billing_cycle` | TEXT | `monthly`, `yearly`, `weekly` |
| `next_billing_date` | TIMESTAMPTZ | |
| `start_date` | TIMESTAMPTZ | |
| `is_active` | BOOLEAN | Default `true` |
| `usage_rating` | INTEGER | 1–5 scale |
| `cancel_url` | TEXT | Direct cancellation link |
| `cancellation_outcome` | TEXT | Outcome after cancellation action |
| `color` | TEXT | Display color |
| `num_members` | INTEGER | Shared members; cost is divided by this |
| `notes` | TEXT | |

### `payments`
Records Razorpay payment attempts.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `razorpay_order_id` | TEXT UNIQUE | |
| `razorpay_payment_id` | TEXT | Set after success |
| `razorpay_signature` | TEXT | HMAC signature for verification |
| `plan` | TEXT | Plan being purchased |
| `amount` | DOUBLE PRECISION | In major units (e.g. INR) |
| `currency` | TEXT | Default `INR` |
| `status` | TEXT | `pending`, `success`, `failed` |

### `mailbox_connections`
Stores connected email accounts for subscription discovery.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `provider` | TEXT | e.g. `gmail` |
| `email` | TEXT | Connected email address |
| `access_token_encrypted` | TEXT | |
| `refresh_token_encrypted` | TEXT | |
| `scopes` | TEXT | |
| `status` | TEXT | Default `connected` |
| `last_synced_at` | TIMESTAMPTZ | |

### `discovery_candidates`
Subscription candidates detected from email receipts.

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `source_connection_id` | UUID FK | References `mailbox_connections(id)` |
| `merchant_name` | TEXT | |
| `amount` | DOUBLE PRECISION | |
| `currency` | TEXT | Default `USD` |
| `billing_cycle_guess` | TEXT | |
| `next_billing_date_guess` | TIMESTAMPTZ | |
| `confidence` | DOUBLE PRECISION | 0.0–1.0 detection confidence |
| `source_type` | TEXT | Default `email_receipt` |
| `raw_excerpt` | TEXT | Email snippet |
| `status` | TEXT | `pending`, `accepted`, `rejected`, `false_positive` |
| `accepted_subscription_id` | UUID FK | Set when candidate is accepted |

---

## Gamification System (Planned)

The BossBattle system is the gamification layer of SubTrack. The intended design:

- **XP (Experience Points)**: Earned by adding subscriptions, reviewing usage ratings, and cancelling low-value subscriptions.
- **Levels**: Users level up as XP accumulates, unlocking visual rewards and dashboard cosmetics.
- **Achievements**: Milestones such as "First cancellation", "Saved $100/year", "Inbox Zero" (no pending candidates).
- **Boss Battles**: Low-usage subscriptions (usage rating 1–2) become "bosses". The user defeats a boss by cancelling or downgrading the subscription. Boss difficulty scales with the subscription's monthly cost.
- **Rewards**: Boss defeats yield XP bursts and achievement badges displayed on the Dashboard.

This system is intended to motivate users to actively manage and prune their subscriptions rather than passively observing spend.

---

## File Structure

```
subtrack/
  App.js                             # Root: navigation + session check
  frontend/
    src/
      api.js                         # InsForge SDK wrapper — all API calls
      config.js                      # baseUrl + anonKey
      theme.js                       # Colors, typography, category list
      ThemeContext.js                 # React Context for theme switching
      notifications.js               # Expo notification helpers
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
    babel.config.js
    tailwind.config.js               # (unused in RN; kept for web tooling)
  insforge/
    migrations/
      01_schema.sql                  # All table definitions + RLS policies
      02_triggers.sql                # handle_new_user trigger
    functions/
      getanalytics/index.ts
      razorpay-order/index.ts
      razorpay-verify/index.ts
      accept-candidate/index.ts
      admin-create-user/index.ts
```
