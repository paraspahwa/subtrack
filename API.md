# SubTrack — API Reference

All frontend API calls are defined in `frontend/src/api.js` and route through the InsForge SDK (`@insforge/sdk`). Edge functions run as Deno TypeScript on InsForge infrastructure.

---

## InsForge Client

```js
import { createClient } from "@insforge/sdk";

const insforge = createClient({
  baseUrl: "https://si2r3edb.ap-southeast.insforge.app",
  anonKey: "ik_65e9bf64b6e8d6240373a7f4ce8602f2",
});
```

The client is exported from `api.js` as `insforge` for direct use where needed (e.g. `insforge.auth.signOut()`).

---

## Authentication

All auth methods wrap `insforge.auth.*`. Successful responses are normalized through `mapLegacyAuth()` which returns:

```js
{
  access_token: string,
  user_id: string,
  email: string,
  full_name: string,
  plan: "free" | "pro" | ...,
  requireEmailVerification: boolean
}
```

### `api.register({ email, password, full_name })`
Creates a new user account. Returns normalized auth object. May set `requireEmailVerification: true`.

### `api.verifyEmail(email, otp)`
Verifies the email OTP sent on registration. Returns normalized auth object with session.

### `api.resendVerification(email)`
Resends the email verification OTP.

### `api.login({ email, password })`
Signs in an existing user. Returns normalized auth object with session token.

### `api.me()`
Returns the current user's auth data merged with their `profiles` row.

```js
// Returns combined object:
{
  id, email, full_name, plan, home_currency,
  subscription_active, subscription_end_date, ...
}
```

### `api.updateMe(body)`
Updates the authenticated user's `profiles` row. `body` can include any profile column (e.g. `{ home_currency: "INR" }`).

### `api.forgotPassword(email)`
Sends a password reset email.

### `api.resetPassword(token, newPassword)`
Resets the password using the OTP token from the reset email.

### `api.deleteAccount()`
Signs out the current session. (Full account deletion is not yet implemented.)

---

## Subscriptions

All subscription queries use `insforge.database.from("subscriptions")`. Row Level Security ensures users only see their own rows.

### `api.listSubs()`
Returns all subscriptions for the current user, ordered by `next_billing_date` ascending.

```js
// Returns: Subscription[]
```

### `api.createSub(body)`
Inserts a new subscription. `user_id` is injected automatically from the current session.

```js
// body shape:
{
  name: string,
  category?: string,          // Default: "Other"
  amount: number,
  currency?: string,          // Default: "USD"
  billing_cycle?: string,     // "monthly" | "yearly" | "weekly"
  next_billing_date: string,  // ISO 8601
  start_date?: string,
  notes?: string,
  usage_rating?: number,      // 1–5
  cancel_url?: string,
  color?: string,
  num_members?: number        // Default: 1
}
```

### `api.updateSub(id, body)`
Updates a subscription by `id`. `body` is a partial subscription object.

### `api.deleteSub(id)`
Deletes a subscription by `id`.

---

## Analytics

### `api.analytics()`
Invokes the `getanalytics` edge function. Returns a spend summary object.

```js
// Returns:
{
  monthly_total: number,
  yearly_total: number,
  home_currency: string,
  active_count: number,
  by_category: { [category: string]: number },
  upcoming_renewals: Subscription[],   // next 5 renewals within 30 days
  waste_subs: Subscription[],          // usage_rating <= 2
  waste_monthly: number,
  potential_yearly_savings: number
}
```

### `api.reminderCandidates(days = 30)`
Returns subscriptions with `next_billing_date` within the next `days` days.

### `api.actionCenterRisk(days = 30)`
Alias for `reminderCandidates`. Used to populate the Dashboard action center with due-soon and low-usage subscriptions.

### `api.priceAnomalies()`
Returns subscriptions where `amount_alert_dismissed = false` and `amount_change_pct` is not null (i.e. a price change was detected).

### `api.dismissAmountAlert(id)`
Sets `amount_alert_dismissed = true` on the given subscription.

### `api.setCancellationOutcome(id, outcome)`
Records the result of a cancellation attempt.

```js
// outcome: string (e.g. "cancelled", "retained", "no_action")
```

---

## Subscription Discovery

Discovery lets users connect an email account to automatically detect subscription receipts.

### `api.discoveryMailbox()`
Returns the user's connected `mailbox_connections` row(s).

### `api.connectDiscoveryMailbox(provider, email)`
Inserts a new mailbox connection record.

```js
// provider: string (e.g. "gmail")
// email: string
```

### `api.disconnectDiscoveryMailbox()`
Deletes all mailbox connections for the current user.

### `api.discoveryCandidates(status = "pending")`
Returns discovery candidates filtered by status.

```js
// status: "pending" | "accepted" | "rejected" | "false_positive"
```

### `api.acceptDiscoveryCandidate(id)`
Invokes the `accept-candidate` edge function. Creates a subscription from the candidate and marks it `accepted`.

### `api.rejectDiscoveryCandidate(id)`
Sets candidate status to `"rejected"`.

### `api.falsePositiveDiscoveryCandidate(id)`
Sets candidate status to `"false_positive"`.

### `api.seedDiscoveryDemoCandidates()`
Inserts three demo candidates (Netflix, Spotify, Adobe Creative Cloud) for development/demo purposes.

---

## Payments

### `api.createOrder(body)`
Invokes the `razorpay-order` edge function to create a Razorpay payment order.

```js
// body:
{ amount: number, currency: string, plan_type: string }

// Returns:
{
  razorpay_order_id: string,
  key_id: string,
  amount: number,
  currency: string,
  email: string
}
```

### `api.verifyPayment(body)`
Invokes the `razorpay-verify` edge function to confirm payment and upgrade the user's plan.

```js
// body:
{
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
}

// Returns: { success: true }
```

### `api.upgradeToPro(planType = "pro")`
Directly updates the `profiles.plan` field. Used as a fallback or for manual upgrades.

---

## Edge Functions

Edge functions are deployed to InsForge and called via `insforge.functions.invoke()`. All functions require a valid `Authorization: Bearer <token>` header and validate the session before proceeding.

### `getanalytics`

- **Method**: GET (no body required)
- **Auth**: Required
- **Description**: Queries the user's active subscriptions, calculates monthly and yearly totals with currency conversion, identifies upcoming renewals (next 30 days), and detects waste subscriptions (usage rating 1–2).
- **Currency support**: USD, INR, EUR, GBP (via static exchange rate table)
- **Response**: See `api.analytics()` above.

### `razorpay-order`

- **Method**: POST
- **Auth**: Required
- **Body**: `{ amount: number (paise), currency: string, plan_type: string }`
- **Description**: Creates a Razorpay order via the Razorpay API and stores a `pending` payment record in the `payments` table.
- **Env vars required**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `APP_URL`

### `razorpay-verify`

- **Method**: POST
- **Auth**: Required
- **Body**: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
- **Description**: Verifies the payment signature using HMAC-SHA256 (`order_id|payment_id` signed with `RAZORPAY_KEY_SECRET`). On success, marks the payment `success` and upgrades the user's `profiles.plan`.
- **Env vars required**: `RAZORPAY_KEY_SECRET`, `APP_URL`

### `accept-candidate`

- **Method**: POST
- **Auth**: Required
- **Body**: `{ id: string }` (discovery candidate UUID)
- **Description**: Fetches the discovery candidate, creates a subscription from it, and updates the candidate's status to `accepted` with a reference to the new subscription.

---

## Database Tables

For full column definitions, see `insforge/migrations/01_schema.sql`.

| Table | Description |
|---|---|
| `profiles` | User profile extending `auth.users`; stores plan, home currency |
| `subscriptions` | All tracked subscriptions with billing, amount, usage metadata |
| `payments` | Razorpay payment records (order creation through verification) |
| `mailbox_connections` | Connected email accounts for subscription discovery |
| `discovery_candidates` | Detected subscription candidates from email receipts |

All tables have Row Level Security enabled. Users can only read/write their own rows (`auth.uid() = user_id`).

### Triggers

`02_triggers.sql` defines `on_auth_user_created`: after a new row in `auth.users`, a corresponding `profiles` row is automatically inserted with `plan = 'free'` and `home_currency = 'USD'`.
