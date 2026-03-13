# SubTrack Test Environments

Date: 2026-03-14
Scope: Day 2 auth testing and launch-week validation

## Environment A: Local Docker Backend
- Purpose: API and auth regression checks
- Backend URL (host): http://localhost:8000
- Health check: GET /health -> status ok
- Database: PostgreSQL via docker compose service `db`
- Env file baseline: `backend/.env.test`

## Environment B: Android Emulator (Expo)
- Purpose: Android auth/session behavior
- API URL route: http://10.0.2.2:8000
- Device target: Android Emulator API 33+
- Env file baseline: `frontend/.env.test`
- Notes: Ensure Expo app can reach host backend through emulator bridge

## Environment C: iOS Simulator (Expo)
- Purpose: iOS auth/session behavior
- API URL route: http://localhost:8000
- Device target: iPhone 14 / iOS 17+
- Env file baseline: `frontend/.env.test`
- Notes: Validate cold start and relogin behavior

## Environment D: Physical Device (Optional)
- Purpose: Network and real-device reliability
- API URL route: http://<local-ip>:8000
- Device target: one Android phone and/or one iPhone
- Env override: set EXPO_PUBLIC_API_URL to local LAN IP
- Notes: Phone and dev machine must be on same network

## Test Accounts
- QA account: qa+subtrack@example.com / Test@12345
- Backup account: qa2+subtrack@example.com / Test@12345

## Day 2 Required Preconditions
- Backend running and healthy on port 8000
- Auth endpoints reachable from emulator/simulator
- Test account seeded and login enabled
- Defect logging file ready: `.github/launch/defect-log.md`

## Day 2 Evidence Targets
- `day2-auth-evidence.md` matrix A1-A8 completed for Android and iOS
- Zero open P0 and zero critical-path P1 before EOD gate

## Execution Commands (Day 2)

### 1) Start backend (Docker)
```bash
# Run from repo root: /workspaces/subtrack
docker compose up --build -d postgres backend
docker compose ps postgres backend
docker compose logs --no-color backend | tail -n 40
```
Expected:
- `subtrack_db` shows `healthy`
- `subtrack_backend` shows `Up` on port `8000`
- backend logs show normal startup (no crash loop)

### 2) Start Expo frontend
```bash
# Run from repo root: /workspaces/subtrack
cp frontend/.env.test frontend/.env
cd frontend
npm install --legacy-peer-deps
npm start
```
Expected: Expo dev server starts and app opens in emulator/simulator.

Note: Do not use `docker compose up` without service names for Day 2.
The `frontend` image currently requires additional web export dependencies and is not needed for auth gate execution.

### 3) Create test account (if needed)
```bash
docker compose exec -T backend python - <<'PY'
import json, urllib.request
data = json.dumps({
	"email": "qa+subtrack@example.com",
	"password": "Test@12345",
	"full_name": "QA User"
}).encode()
req = urllib.request.Request(
	"http://localhost:8000/api/auth/register",
	data=data,
	headers={"Content-Type": "application/json"},
	method="POST",
)
print(urllib.request.urlopen(req).read().decode())
PY
```
Expected: JSON with `access_token` and `user_id`.

### 4) Login API smoke
```bash
docker compose exec -T backend python - <<'PY'
import json, urllib.request
data = json.dumps({
	"email": "qa+subtrack@example.com",
	"password": "Test@12345"
}).encode()
req = urllib.request.Request(
	"http://localhost:8000/api/auth/login",
	data=data,
	headers={"Content-Type": "application/json"},
	method="POST",
)
print(urllib.request.urlopen(req).read().decode())
PY
```
Expected: JSON with `access_token`.

## A1-A8 Step Map

### A1 Login with valid credentials
- Action: Login from app UI using QA account.
- Evidence: screenshot of dashboard after login + token key present in app storage view/debug logs.

### A2 Cold start with valid token
- Action: Force close app and relaunch.
- Evidence: app lands on authenticated screen without re-login.

### A3 Logout flow
- Action: Trigger logout from app settings/menu.
- Evidence: app returns to auth screen and protected screen is inaccessible.

### A4 Re-login after logout
- Action: Login again with same account.
- Evidence: successful dashboard access with fresh session.

### A5 Expired token behavior
- Action: Use an expired/invalidated token state (manual token override or expiry wait in test build).
- Evidence: API returns 401 and app redirects/prompts for re-auth.

### A6 Invalid token behavior
- Action: Tamper stored token and reopen app or call protected route.
- Evidence: API returns 401, no silent success path.

### A7 Network drop during auth
- Action: disable network during login request.
- Evidence: visible error message and retry option works.

### A8 Restart around refresh window
- Action: restart app after session duration threshold scenario.
- Evidence: either valid restored session or clean re-auth prompt with no crash.

## Evidence Format Standard
- Use one screenshot/log artifact per scenario per platform.
- Name evidence artifacts as: `A<id>-<platform>-<result>-<timestamp>`
- Example: `A2-android-pass-20260314-1105.png`
