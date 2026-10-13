# Marketing Team — User Acceptance Test (UAT)

Status: NOT RUN. This checklist is a release gate, not evidence of passing.

## Prerequisites
- [ ] Isolated staging Worker and D1 database created; no production bindings
- [ ] Founder secret configured through Cloudflare secrets, never committed
- [ ] TypeScript check and automated tests green in CI
- [ ] Cloudflare scheduled trigger verified against staging logs
- [ ] Staging data can be deleted without affecting customer or production data

## Functional acceptance
- [ ] Daily scheduled run creates exactly 3 draft records
- [ ] Both IrisKey.ai and 8ORA.AI represented correctly
- [ ] LinkedIn text and Shorts script generated; no fabricated claims or invented ROI
- [ ] Drafts remain unpublished and visible to founder
- [ ] Repeated/retried schedule does not create duplicate daily drafts
- [ ] Marketing operation continues with founder laptop powered off
- [ ] Failed model calls produce visible errors and no external side effects

## Authority and security
- [ ] Anonymous requests denied for all private routes
- [ ] Spoofed tenant/actor identifiers ignored or rejected
- [ ] Tenant-specific job, audit and approval data never leaks
- [ ] Approval cannot be used twice or after expiry
- [ ] Changed tool, args, destination, or identity invalidate approval
- [ ] No external action executes outside central authority gate
- [ ] No social media publishing, messages, outreach, spending or production changes without explicit founder approval
- [ ] Kill switch stops scheduled runs and all consequential execution
- [ ] No credentials, private Brain 2 data or patents exposed in output/logs

## Operations and commercial
- [ ] Free-tier usage/cost limits set and verified
- [ ] Usage, failures and approvals are auditable
- [ ] Founder can review, edit, approve or reject a draft from a private interface
- [ ] Rollback procedure verified
- [ ] Results recorded with timestamps, screenshots/log references and tester sign-off

## Release decision
- **PASS:** every mandatory test above passed with evidence
- **FAIL:** any unauthorised action, data exposure, duplicate execution or unbounded spend
- **BLOCKED:** tests cannot be executed because deployment, credentials or environment is unavailable

Current release decision: **BLOCKED** — staging database, secrets, deployment and CI results have not been verified.
