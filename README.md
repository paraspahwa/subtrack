# SubTrack — Subscription Tracker

> Stop losing money to forgotten subscriptions. Track all your subscriptions in one place, see your true monthly spend, and catch renewals before they hit.

---

## Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Mobile App     | React Native + Expo SDK 51          |
| Navigation     | React Navigation (Native Stack)     |
| Backend        | FastAPI (Python 3.11) + Uvicorn     |
| ORM            | SQLAlchemy + PostgreSQL 15          |
| Auth           | JWT (PyJWT) + bcrypt                |
| Payments       | Razorpay (Pro plan upgrade)         |
| Web (Docker)   | Expo web export → Nginx             |
| Infra          | Docker + Docker Compose             |

---

## Running the Mobile App

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- For iOS: Xcode (macOS only)
- For Android: Android Studio + emulator, or a physical device with **Expo Go** app

### Quick Start (Mobile)

```bash
cd frontend
npm install --legacy-peer-deps
npm start          # Opens Expo dev menu
```

Then:
- **Android emulator** — press `a` in the terminal
- **iOS simulator** — press `i` in the terminal (macOS only)
- **Physical device** — scan the QR code with the **Expo Go** app (iOS/Android)

### Configure API URL

Edit `frontend/src/config.js`:

```js
// iOS Simulator
const API_URL = "http://localhost:8000";

// Android Emulator
const API_URL = "http://10.0.2.2:8000";

// Physical device (replace with your machine's local IP)
const API_URL = "http://192.168.1.x:8000";
```

---

## Running the Backend

### Option A — Docker (Recommended)

```bash
# Copy and configure env
cp .env.example .env
# Edit .env — set SECRET_KEY at minimum

# Start backend + database
docker compose up --build

# Backend API: http://localhost:8000
# API docs:    http://localhost:8000/docs
# Web app:     http://localhost:3000  (Expo web build)
```

### Option B — Local

```bash
cd backend
pip install -r requirements.txt
# Set DATABASE_URL env var
uvicorn main:app --reload --port 8000
```

---

## Building for Production (APK / IPA)

Uses [EAS Build](https://docs.expo.dev/build/introduction/) from Expo:

```bash
npm install -g eas-cli
eas login
eas build --platform android    # → .apk / .aab
eas build --platform ios        # → .ipa (requires Apple Developer account)
```

---

## Features

### Free Plan (forever free)
- Track up to 10 subscriptions
- Monthly & yearly spend totals
- Category organization
- Renewal date tracking
- Basic analytics

### Pro Plan ($9/month)
- Unlimited subscriptions
- Full analytics dashboard
- Renewal alerts (30-day view)
- Spend by category charts
- Most expensive breakdown
- Priority support

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/subscriptions` | List subscriptions |
| POST | `/api/subscriptions` | Add subscription |
| PUT | `/api/subscriptions/{id}` | Update subscription |
| DELETE | `/api/subscriptions/{id}` | Delete subscription |
| GET | `/api/analytics` | Spend analytics |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify payment |

Full interactive docs at `http://localhost:8000/docs`.

---

## Market

- **$1.8 trillion** global subscription market
- **12+** average subscriptions per person
- **$89/month** wasted on forgotten subscriptions
- **Target**: Remote workers, households, freelancers, finance-conscious millennials/Gen Z

## Environment Variables

See `.env.example`. Minimum required:
- `DATABASE_URL` — PostgreSQL connection string
- `SECRET_KEY` — JWT signing key (32+ chars)

Optional (payments):
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
