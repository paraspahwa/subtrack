# SubTrack Launch - Day 3 CRUD and Schema Test Evidence

Date: 2026-03-15
Owner: Engineering + QA
Gate: CRUD + schema round-trip
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
| C1 | Create subscription with valid payload | Record created and appears in list/detail views | Pending | Pending | TBD | Includes API response and UI confirmation |
| C2 | Read subscriptions after app restart | Persisted records reload without schema mismatch | Pending | Pending | TBD | Verify cold-start data hydration |
| C3 | Update subscription fields | Changes persist and reflect consistently across UI/API | Pending | Pending | TBD | Validate changed amount, cycle, and category |
| C4 | Delete subscription | Record removed and no stale references remain | Pending | Pending | TBD | Confirm list and detail state cleanup |
| C5 | Invalid create payload | API rejects invalid data and UI surfaces clear error | Pending | Pending | TBD | Contract validation and UX handling |
| C6 | Concurrent edit conflict simulation | Latest valid state preserved with no corruption | Pending | Pending | TBD | Manual race-condition style check |
| C7 | DB round-trip integrity check | Stored values match submitted values exactly | Pending | Pending | TBD | Includes decimal/date fields verification |
| C8 | Cross-platform parity check | Android and iOS show identical final data state | Pending | Pending | TBD | Compare API output + UI on both platforms |

## Scenario Execution Checklist

### C1
- Run: create a new subscription from app UI with valid values
- Record: success toast/screen + API entity payload screenshot/log

### C2
- Run: force-close and relaunch app
- Record: previously created subscription present and correct

### C3
- Run: edit existing subscription fields (amount, frequency, category)
- Record: updated values visible in list/detail + API response

### C4
- Run: delete subscription from UI
- Record: removed from list and detail path no longer resolves

### C5
- Run: submit invalid payload (missing required field or malformed value)
- Record: API rejection + user-visible validation/error state

### C6
- Run: perform rapid sequential edits from multiple app states (or duplicate client instances)
- Record: resulting state is valid with no partial corruption

### C7
- Run: compare submitted values vs database/API returned values
- Record: no schema drift (type, precision, required fields)

### C8
- Run: execute same CRUD flow on Android and iOS and compare outputs
- Record: parity confirmation snapshot/log set

## Evidence Naming Rule
- Format: `C<id>-<platform>-<result>-<timestamp>`
- Example: `C2-ios-pass-20260315-1112.png`

## 11:00 Checkpoint
- Summary: Day 3 kickoff started. CRUD matrix execution in progress.
- Pass count: 0 (C1-C8 pending)
- Fail count: 0
- P0/P1 defects opened: 0

## Preflight API Results
- `/api/subscriptions` create with valid payload -> HTTP 201 (record created)
- `/api/subscriptions` create with invalid payload -> HTTP 422 (validation errors returned)
- `/api/subscriptions` read list after create/delete -> HTTP 200 (count transitioned 1 -> 0)
- `/api/subscriptions/{id}` update endpoint -> HTTP 200 (amount updated to 12.49)
- `/api/subscriptions/{id}` delete endpoint -> HTTP 204 (record removed)

## 15:00 Checkpoint
- Summary: API CRUD preflight completed successfully (create/read/update/delete plus invalid payload validation). Android and iOS UI matrix C1-C8 is still in progress.
- Pass count: 0/8 UI scenarios completed (API preflight pass recorded)
- Fail count: 0
- P0/P1 defects remaining: 0

## Automation Evidence (Terminal)
- Login using QA account -> HTTP 200
- Create with valid payload -> HTTP 201 (id: 3)
- Invalid payload -> HTTP 422 (missing required field + invalid float type)
- Update lifecycle -> HTTP 200 with persisted updated amount (12.49)
- Delete lifecycle -> HTTP 204 and post-delete list count returned to 0
- Schema round-trip quick check -> PASS (required response fields present)

## 17:45 Decision Rubric
- Pass if all C1-C8 scenarios are marked Pass on Android and iOS.
- Pass if no open P0 and no critical-path P1 defects remain in `defect-log.md`.
- Pass if C7 round-trip checks show no type drift, precision loss, or required field loss.
- Pass if cross-platform parity (C8) confirms equivalent final API and UI state.
- Hold if any scenario is Fail/Blocked or evidence links are missing for either platform.

## 17:45 EOD Gate Decision
- Gate status: Pending
- Criteria met:
  - [ ] No open P0 CRUD defects
  - [ ] No critical-path P1 CRUD defects
  - [ ] Android CRUD smoke pass complete
  - [ ] iOS CRUD smoke pass complete
  - [ ] Schema round-trip validation complete
- Decision: Pending
- Signoff:
  - Engineering: Pending
  - QA: Pending

## 17:45 Ready Templates

### Option A: Pass
- Gate status: Passed
- Criteria met:
  - [x] No open P0 CRUD defects
  - [x] No critical-path P1 CRUD defects
  - [x] Android CRUD smoke pass complete
  - [x] iOS CRUD smoke pass complete
  - [x] Schema round-trip validation complete
- Decision: Proceed to Day 4
- Signoff:
  - Engineering: Approved
  - QA: Approved

### Option B: Hold
- Gate status: Hold
- Criteria met:
  - [ ] No open P0 CRUD defects
  - [ ] No critical-path P1 CRUD defects
  - [ ] Android CRUD smoke pass complete
  - [ ] iOS CRUD smoke pass complete
  - [ ] Schema round-trip validation complete
- Decision: Do not proceed to Day 4 until blocking defects are closed and validation is re-run.
- Signoff:
  - Engineering: Pending
  - QA: Pending
