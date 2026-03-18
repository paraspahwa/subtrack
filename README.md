# SubTrack — Subscription Tracker

> Stop losing money to forgotten subscriptions. Track all your subscriptions in one place, see your true monthly spend, and catch renewals before they hit.

---

## 🚀 One-Click Setup (GitHub Codespaces)

1. Click **Code** -> **Codespaces** -> **Create codespace on main**.
2. Once the container starts, the backend and frontend dependencies will auto-install (if configured) or run:
   ```bash
   # Terminal 1: Backend
   cd backend && pip install -r requirements.txt && uvicorn main:app --reload
   # Terminal 2: Frontend
   cd frontend && npm install && npm start
   ```
3. Use the **Ports** tab to open the frontend (default `19006` for web).

---

## 💻 Local Machine Setup

### Prerequisites
- **Node.js 18+** & **npm**
- **Python 3.11+**
- **Docker** (Optional, but recommended for Database)

### 1. Backend & Database
```bash
cd backend
cp .env.example .env  # Configure DATABASE_URL and SECRET_KEY
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*Note: If using Docker, just run `docker compose up` from the root.*

### 2. Frontend (Mobile & Web)
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

---

## 📱 Mobile Development (Emulators & Devices)

### Android Emulator (Android Studio)
1. Open **Android Studio** -> **Device Manager** -> Start your Pixel/Nexus emulator.
2. In the terminal where `npm start` is running, press `a`.
3. Set `API_URL = "http://10.0.2.2:8000"` in `frontend/src/config.js`.

### iOS Simulator (Xcode - macOS Only)
1. Install **Xcode**.
2. In the terminal where `npm start` is running, press `i`.
3. Set `API_URL = "http://localhost:8000"` in `frontend/src/config.js`.

### Physical Device (Expo Go)
1. Install **Expo Go** from App Store/Play Store.
2. Scan the QR code shown in your terminal.
3. Use your computer's local IP (e.g., `192.168.1.x`) for `API_URL`.

---

## ☁️ AWS Server Deployment (EC2/Production)

### Recommended: Docker Compose
1. **Provision EC2**: Use Ubuntu 22.04 LTS.
2. **Install Docker**:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose -y
   ```
3. **Deploy**:
   ```bash
   git clone https://github.com/your-username/subtrack.git
   cd subtrack
   cp .env.example .env # Set production values
   docker-compose up -d --build
   ```
4. **Security Groups**: Ensure ports `80` (Web), `8000` (API), and `5432` (DB - internal only) are configured.

---

## 🛠 Features

### Premium Subscriptions
- **Multi-Currency**: Automatic conversion to your Home Currency (USD, INR, EUR, etc.).
- **Shared Tracking**: Split costs with roommates or family members.
- **Waste Detection**: AI-powered usage rating to find subscriptions you don't need.
- **Spending Forecast**: Visual charts for upcoming 12-month spend.

---

## 📜 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Full spend breakdown (Currency-aware) |
| POST | `/api/subscriptions` | Create new sub (Supports `num_members`) |
| GET | `/api/auth/me` | User profile & `home_currency` settings |

Full docs: `http://localhost:8000/docs`

---

## 🤝 Support
For enterprise setups or custom integrations, contact the SubTrack dev team.
