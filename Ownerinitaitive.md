# Owner Initiative: Full Run Guide (Web, Android, iOS)

This document lists everything the project owner needs to do to run SubTrack end-to-end across:
- Web app
- Android app
- iOS app

## 0. 30-Minute Quick Launch Checklist

Use this for a fast owner smoke run before deep testing.

1. Copy environment file and set critical secrets.
2. Start stack with Docker.
3. Confirm web and API health URLs.
4. Start Expo and open Android app.
5. Verify login + add one subscription + analytics load.
6. On iPhone (Linux workflow), test via Expo Go using LAN API URL.
7. If release prep is needed, run EAS Android and iOS builds.

Quick commands:

```bash
# terminal 1 (repo root)
cp .env.example .env
docker compose up --build

# terminal 2
cd frontend
npm install --legacy-peer-deps
npx expo start
```

Quick pass criteria:
- `http://localhost:3000` opens web app
- `http://localhost:8000/health` returns healthy response
- Android app can register/login and create subscription
- Analytics screen loads without API errors

## 1. What You Need Installed

### Common
- Docker Engine + Docker Compose
- Node.js 18+
- npm
- Git

### Android
- Android Studio
- Android SDK + at least one emulator image/device
- Expo Go app on physical Android device (optional)

### iOS
- Physical iPhone + Expo Go for local testing from Linux
- Apple Developer account (required for signed iOS builds)
- macOS + Xcode only if you want iOS Simulator locally (not possible on Linux)

## 2. One-Time Project Setup

From repository root:

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:
- `DATABASE_URL`
- `SECRET_KEY` (generate with `openssl rand -hex 32`)

Optional but required for payment flows:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## 3. Choose Database Mode (Mandatory Decision)

You must choose one mode before running backend.

### Mode A: Local Postgres (fastest local setup)
- Keep `postgres` service in `docker-compose.yml`.
- Use local connection value in backend environment.

### Mode B: Supabase/Postgres Cloud (production-like)
- Put your real cloud DB URL in `.env` (`DATABASE_URL=...`).
- In `docker-compose.yml`, do not override `DATABASE_URL` with local postgres value.
- If using cloud DB only, do not run local `postgres` service.

## 4. Run Full Stack for Web

At repository root:

```bash
docker compose up --build
```

Expected endpoints:
- Web app: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

## 5. Run Mobile App (Expo)

Open another terminal:

```bash
cd frontend
npm install --legacy-peer-deps
npx expo start
```

Then use:
- `a` for Android emulator
- `i` for iOS simulator (works only on macOS)
- QR code scan for physical devices (Expo Go)

## 6. API URL Setup Rules (Critical for Mobile/Web)

Backend URL logic is in `frontend/src/config.js`:
- Android emulator uses `http://10.0.2.2:8000`
- iOS simulator and web dev use `http://localhost:8000`
- Production/devices can use `EXPO_PUBLIC_API_URL`

For physical phone testing, create `frontend/.env`:

```bash
EXPO_PUBLIC_API_URL=http://<your-local-ip>:8000
```

Use your machine LAN IP so phone can reach backend.

## 7. Android Verification Checklist

- Backend healthy at `http://localhost:8000/health`
- Expo server running in `frontend`
- Android app opens successfully (emulator or Expo Go)
- Register/login works
- Create/update/delete subscription works
- Analytics screen loads
- Payment flow tested with Razorpay test keys (if enabled)

## 8. iOS Verification Checklist

On Linux, local iOS Simulator is not available.

You have 2 practical paths:
- Path 1: Test on physical iPhone using Expo Go + LAN API URL
- Path 2: Build with EAS for iOS and install via TestFlight/internal distribution

Verification items:
- Auth flow works
- Subscription CRUD works
- Analytics works
- Network calls hit correct backend URL

## 9. Production Build Preparation

Install EAS CLI once:

```bash
npm install -g eas-cli
eas login
```

Build commands from `frontend`:

```bash
eas build --platform android
eas build --platform ios
```

Owner notes:
- Android: choose APK/AAB based on distribution target.
- iOS: requires Apple Developer setup and signing credentials.
- If EAS asks for missing config, complete prompts (it may generate required build config files).

## 10. Owner Action Checklist (Do This In Order)

1. Fill `.env` with secure `SECRET_KEY` and valid `DATABASE_URL`.
2. Decide local DB vs cloud DB and align `docker-compose.yml` behavior.
3. Start backend/web via `docker compose up --build`.
4. Validate API health and docs endpoints.
5. Start Expo app (`cd frontend && npx expo start`).
6. Verify Android app end-to-end.
7. Verify iOS on physical device (Linux) or simulator (macOS).
8. Configure Razorpay real/test keys and verify payment flow.
9. Run EAS Android and iOS builds for release.
10. Do final regression on auth, subscriptions, analytics, and payments.

## 11. Troubleshooting Quick Notes

- If Android emulator cannot hit backend, confirm URL is `10.0.2.2` and backend is on port `8000`.
- If physical device cannot hit backend, verify same Wi-Fi and use local IP in `EXPO_PUBLIC_API_URL`.
- If auth fails unexpectedly, verify `SECRET_KEY` is set and stable.
- If DB errors appear, verify `DATABASE_URL` format and database reachability.

## 12. Production Prerequisites

- Docker and Docker Compose on production host
- Public domain names:
	- Web: frontend site
	- API: backend service
- TLS certificates (recommended via reverse proxy)
- Managed PostgreSQL (recommended) or hardened self-hosted PostgreSQL
- Razorpay live account and live API keys
- Expo account with EAS access
- Apple Developer account (iOS release)
- Google Play Console account (Android release)

## 13. Mandatory Production Environment

Use production values only (no placeholders):

- `DATABASE_URL=postgresql://...`
- `SECRET_KEY=<strong random value>`
- `ACCESS_TOKEN_EXPIRE_SECONDS=86400` (or your policy)
- `RETURN_RESET_TOKEN=false`
- `RAZORPAY_KEY_ID=rzp_live_...`
- `RAZORPAY_KEY_SECRET=...`
- `RAZORPAY_WEBHOOK_SECRET=...`
- `ALLOWED_ORIGINS=https://your-web-domain,https://www.your-web-domain`

Security rules:
- Never keep default/example secrets.
- Never expose `.env` publicly.
- Rotate keys immediately if exposed.

## 14. Backend Production Deployment

1. Deploy with production env and production database URL.
2. Start backend container.
3. Verify health endpoint returns OK.
4. Restrict CORS with `ALLOWED_ORIGINS` (no wildcard in production).
5. Place backend behind TLS reverse proxy if API domain is public.

Checks:
- `/health` responds successfully
- `/docs` exposure matches your security model
- Register/login works
- Database writes and reads succeed

## 15. Web Production Deployment

Owner actions:
1. Build and deploy frontend container.
2. Route public web domain to frontend service.
3. Ensure API requests resolve to production API domain.
4. Validate SPA deep-link routing.

Validation:
- Landing page loads
- Register/login works
- Subscription CRUD works
- Analytics loads without API errors

## 16. Mobile API Targeting for Production

Set production API URL for mobile builds:

```bash
EXPO_PUBLIC_API_URL=https://your-api-domain
```

This ensures Android and iOS release apps call production backend.

## 17. Android Release Workflow

From `frontend`:

1. Install EAS CLI
2. Login to Expo
3. Run Android release build
4. Download artifact (`.aab` or `.apk`)
5. Upload `.aab` to Google Play Console
6. Complete store rollout

Release checks:
- Fresh install works
- Login works
- Subscription flow works
- Razorpay live payment success path works

## 18. iOS Release Workflow

From `frontend`:

1. Login to Expo
2. Run iOS release build with EAS
3. Configure signing with Apple Developer credentials
4. Upload build to App Store Connect
5. TestFlight rollout, then App Store release

Release checks:
- App launch and navigation
- Auth/session persistence
- Subscription CRUD and analytics
- Payment flow behavior matches iOS constraints

## 19. Payments Go-Live Checklist

- Switch Razorpay test keys to live keys
- Configure webhook secret in backend env
- Validate payment order creation
- Validate payment verification endpoint
- Confirm plan upgrade to pro after successful payment
- Monitor failed verification events

## 20. Operations and Monitoring

Minimum baseline:
- Container restart policies enabled
- Centralized logs for backend/frontend
- Uptime checks for web root and API health
- Database backups scheduled and tested
- Alerts for error spikes and downtime

## 21. Final Owner Launch Gate

Launch only when all are green:

1. Web domain over HTTPS is live.
2. API domain over HTTPS is live.
3. Database connectivity is stable.
4. Auth, subscriptions, analytics pass smoke tests.
5. Live payment flow is verified.
6. Android artifact accepted in Play Console.
7. iOS build accepted in App Store Connect/TestFlight.
8. Logging, backups, and alerts are active.

## 22. One-Page Go/No-Go Sign-Off Table

Use this as the final release approval sheet.

| Area | Check | Status (Pass/Fail) | Owner Notes |
|---|---|---|---|
| Environment | Production `.env` values are set and non-placeholder |  |  |
| Security | `SECRET_KEY` is strong and rotated policy exists |  |  |
| Security | `ALLOWED_ORIGINS` is restricted (no `*`) |  |  |
| Database | Production DB reachable and stable |  |  |
| Database | Backup and restore test completed |  |  |
| Backend | `https://<api-domain>/health` returns healthy |  |  |
| Backend | Auth register/login verified in production |  |  |
| Backend | Subscription CRUD verified in production |  |  |
| Backend | Analytics endpoint verified in production |  |  |
| Web | Web app loads over HTTPS |  |  |
| Web | Deep-link SPA routes load without 404 |  |  |
| Web | API calls from web hit production API domain |  |  |
| Android | Release build generated and install-tested |  |  |
| Android | Play Console submission accepted |  |  |
| iOS | Release build generated with correct signing |  |  |
| iOS | TestFlight/App Store Connect upload accepted |  |  |
| Payments | Razorpay live keys configured |  |  |
| Payments | Payment order + verify + plan upgrade works |  |  |
| Monitoring | Uptime checks and alerts enabled |  |  |
| Monitoring | Central logs visible for backend/frontend |  |  |

Final decision:
- `GO` if all checks are Pass and no critical known issues remain.
- `NO-GO` if any critical check fails (security, DB, auth, payment, or release acceptance).
