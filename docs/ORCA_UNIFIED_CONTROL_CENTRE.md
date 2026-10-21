# ORCA Unified Control Centre — implementation plan

## Goal
Upgrade the existing 8ORA phone experience to expose Brain 1 and Brain 2 through one voice-first ORCA interface. Do not replace the working app or deploy before verification.

## Verified repository facts
- 8ora-agent-os is a standalone Cloudflare-first orchestration layer.
- Its documented pipeline is Request -> Orchestrator -> Agent Registry -> OmniRoute -> Tool Proposal -> Authority Gate -> Execution -> Audit -> Result.
- Production 8ORA is not modified by its Phase 1.
- The separate 8ora-site repository is the public commercial website, not necessarily the installed phone app.

## Required UI
- Overview: Brain 1 and Brain 2 availability, last successful checks, incidents, pending approvals, usage and costs.
- Agents: discover from the live registry, view capabilities, enable/disable by founder selection, inspect permissions and activity.
- Activity: real execution records with timestamps, statuses and evidence; never fabricate success.
- Voice: push-to-talk initially, permission-gated microphone, speech recognition where supported, text fallback, text-to-speech output; wake word later.
- Approvals: explicit founder confirmation for messages, payments, publishing, production writes and other consequential actions.
- Settings: free-tier usage visibility, voice options, privacy controls, authentication and logout.

## Technical boundaries
- Read-only observability first. Do not expose secrets, credentials or private logs to the client.
- Reuse existing auth; verify tenant isolation and founder role on server-side endpoints.
- Never allow UI toggles alone to bypass IrisKey authority checks.
- Brain 1 remains operational; Brain 2 health unknown until tested.
- Keep 8ORA.AI on Netlify and IrisKey.ai unchanged.
- No paid dependencies or automatic upgrades. Treat free quotas as limited.
- No automatic deployment or autonomous operations before security checks and founder approval.

## Implementation order
1. Locate the actual installed app source and its Brain 1 chat integration.
2. Inspect Brain 2 routes, registry, authentication, tests and deployment status.
3. Define read-only health/activity/agent registry API contracts.
4. Add a mobile-friendly control-centre UI behind a feature flag.
5. Add voice input/output with accessible text fallback.
6. Integrate real APIs, run unit/integration/security tests, then stage and verify.
7. Only then request approval to switch the existing app experience.

## Acceptance criteria
- User can see verified Brain 1 and Brain 2 health, including UNKNOWN when no evidence exists.
- Agents and actions reflect server-side data, not hard-coded demo entries.
- Founder can select agents without granting unauthorised execution privileges.
- Voice works on supported mobile browsers with fallback to text.
- No impact to production Brain 1 until rollback-tested.
