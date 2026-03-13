# SubTrack Launch Command Center (7-Day)

Date started: 2026-03-13

## RAG legend
- Green: on track
- Amber: at risk, mitigation active
- Red: blocked

## Global launch gates
| Gate | Owner | Status | Evidence |
|---|---|---|---|
| Auth/session reliability | Engineering | Green | Day 2 A1-A8 passed on Android and iOS; 17:45 signoff complete |
| CRUD + schema round-trip | Engineering + QA | Amber | Day 3 API preflight passed (create/read/update/delete + invalid payload validation); UI matrix C1-C8 in progress |
| Analytics fixture parity | Engineering + QA | Amber | Scheduled Day 4 validation |
| Free cap + Pro upgrade reliability | Engineering + Product | Amber | Scheduled Day 5 validation |
| RC device QA (no P0/P1) | QA + Engineering | Amber | Scheduled Day 6 validation |

## Daily control table
| Day | Theme | 11:00 | 15:00 | 17:45 EOD | RAG | Owner |
|---|---|---|---|---|---|---|
| Day 1 | Scope freeze | Complete | Complete | Signed off | Green | Product |
| Day 2 | Auth/session | Complete | Matrix passed | Signed off | Green | Engineering |
| Day 3 | CRUD/schema | In progress | API preflight passed; UI matrix in progress | Pending | Amber | Engineering + QA |
| Day 4 | Analytics | Pending | Pending | Pending | Amber | Engineering + QA |
| Day 5 | Monetization | Pending | Pending | Pending | Amber | Engineering + Product |
| Day 6 | RC + device QA | Pending | Pending | Pending | Amber | QA + Engineering |
| Day 7 | Go/No-Go | Pending | Pending | Pending | Amber | Product |

## Day 1 closure notes
- Scope freeze completed and signed.
- Must-pass gates approved.
- Triage policy active.
- Owners assigned.
- Rollback triggers documented.
- Day 2 checklist prepared.

## Day 2 kickoff checklist
- [x] Execute Day 2 matrix in `day2-auth-evidence.md`
- [x] Record Android and iOS results in `day2-auth-evidence.md`
- [x] Log all P0/P1 defects in `defect-log.md`
- [x] Resolve or escalate launch-blocking defects per SLA
- [x] Capture 11:00, 15:00, and 17:45 updates with signoff

## Day 2 working files
- Auth evidence tracker: `day2-auth-evidence.md`
- Live defect log: `defect-log.md`
- Test environments: `test-environments.md`

## Day 3 kickoff checklist
- [ ] Execute Day 3 matrix in `day3-crud-evidence.md`
- [ ] Validate create/read/update/delete flows on Android and iOS
- [ ] Verify DB schema round-trip integrity for subscriptions and related entities
- [ ] Log any P0/P1 defects in `defect-log.md` with owner and SLA
- [ ] Capture 11:00, 15:00, and 17:45 updates with signoff

## Day 3 working files
- CRUD evidence tracker: `day3-crud-evidence.md`
- Live defect log: `defect-log.md`
- Test environments: `test-environments.md`
