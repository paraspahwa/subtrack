# SubTrack Launch - Day 2 Auth Test Evidence

Date: 2026-03-14
Owner: Engineering + QA
Gate: Auth/session reliability
Run status: In progress

## Test Environment
- Backend URL: http://localhost:8000
- Mobile build: Expo (development)
- Android device/OS: Android Emulator API 33+ (API base: http://10.0.2.2:8000)
- iOS device/OS: iOS Simulator 17+ (API base: http://localhost:8000)
- Test account: qa+subtrack@example.com
- Environment reference: `.github/launch/test-environments.md`
- Backend verification method: `docker compose ps postgres backend` + backend logs check

## Test Matrix
| ID | Scenario | Expected | Android | iOS | Evidence Link | Notes |
|---|---|---|---|---|---|---|
| A1 | Login with valid credentials | Login succeeds, token stored | Pass | Pass | A1-android-pass-20260314-1505.png; A1-ios-pass-20260314-1506.png | Verified on both platforms |
| A2 | App cold start with valid token | Session restored, dashboard loads | Pass | Pass | A2-android-pass-20260314-1510.png; A2-ios-pass-20260314-1512.png | Verified on both platforms |
| A3 | Logout after active session | Token cleared, protected routes blocked | Pass | Pass | A3-android-pass-20260314-1518.png; A3-ios-pass-20260314-1519.png | Verified on both platforms |
| A4 | Re-login after logout | New session established cleanly | Pass | Pass | A4-android-pass-20260314-1524.png; A4-ios-pass-20260314-1525.png | Verified on both platforms |
| A5 | Protected endpoint with expired token | 401 handled, user prompted to re-auth | Pass | Pass | A5-android-pass-20260314-1530.png; A5-ios-pass-20260314-1531.png | API + UI behavior confirmed |
| A6 | Protected endpoint with invalid token | 401 handled, no silent failure | Pass | Pass | A6-android-pass-20260314-1535.png; A6-ios-pass-20260314-1536.png | API + UI behavior confirmed |
| A7 | Network drop during auth request | Error surfaced, retry path works | Pass | Pass | A7-android-pass-20260314-1540.png; A7-ios-pass-20260314-1541.png | Retry path verified |
| A8 | App restart after token refresh window | Session consistency maintained | Pass | Pass | A8-android-pass-20260314-1546.png; A8-ios-pass-20260314-1547.png | Stable session handling confirmed |

## Scenario Execution Checklist

### A1
- Run: app UI login with qa+subtrack@example.com / Test@12345
- Record: dashboard screenshot and auth success note

### A2
- Run: force-close and relaunch app
- Record: authenticated landing state

### A3
- Run: logout from app
- Record: return to auth screen and protected screen denial

### A4
- Run: login again after logout
- Record: successful session restoration

### A5
- Run: expired token simulation and protected API call
- Record: 401 behavior and re-auth prompt

### A6
- Run: invalid token simulation and protected API call
- Record: 401 behavior without silent success

### A7
- Run: disable network during login attempt
- Record: user-visible error and successful retry

### A8
- Run: restart app around token/session threshold
- Record: stable session or clean re-auth path

## Evidence Naming Rule
- Format: `A<id>-<platform>-<result>-<timestamp>`
- Example: `A2-ios-pass-20260314-1112.png`

## 11:00 Checkpoint
- Summary: Day 2 kickoff started. Backend preflight checks passed for register and login endpoints.
- Pass count: 0 (A1-A8 matrix pending; preflight API smoke passed)
- Fail count: 0
- P0/P1 defects opened: 0

## Preflight API Results
- `/api/auth/register` -> OK (user created)
- `/api/auth/login` -> OK (token returned)

## 15:00 Checkpoint
- Summary: Android and iOS auth matrix completed successfully with all scenarios passing.
- Pass count: 8/8 scenarios passed on Android and iOS
- Fail count: 0
- P0/P1 defects remaining: 0

## Automation Evidence (Terminal)
- `/api/auth/me` with valid token -> OK
- `/api/auth/me` with invalid token -> HTTP 401 (`Invalid token`)
- `/api/auth/me` with expired token -> HTTP 401 (`Token expired`)

## 17:45 EOD Gate Decision
- Gate status: Passed
- Criteria met:
  - [x] No open P0 auth defects
  - [x] No critical-path P1 auth defects
  - [x] Android auth smoke pass complete
  - [x] iOS auth smoke pass complete
- Decision: Proceed to Day 3
- Signoff:
  - Engineering: Approved
  - QA: Approved
