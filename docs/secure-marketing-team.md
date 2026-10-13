# Secure Marketing Team — implementation plan

Status: development only. No production deployment or external marketing actions authorised by this document.

## Objective
Private cloud-hosted marketing operations for IrisKey.ai and 8ORA.AI. Draft research, lead lists, social posts, and Shorts for founder approval. Measure qualified leads and conversions.

## Blocking security requirements
1. Protect every non-public API route with verified Cloudflare Access JWT or equivalent server-side identity verification. Never trust request-supplied actorId or tenantId.
2. Derive actor and tenant from verified identity and membership; enforce tenant-scoped database queries.
3. Bind each approval to a server-stored canonical action payload, actor, tenant, destination, and expiry. Approvals must be single-use with atomic pending-to-approved-to-consumed transitions.
4. Execute actions only through a central authority gate. Reject unknown tools and mismatched or expired approvals.
5. Limit external destinations and credential scopes. Keep production, patents, private Brain 2, and unrelated accounts inaccessible.
6. Rate-limit requests, set AI usage caps, and record immutable decision events with sensitive-data redaction.
7. No automatic publishing, sending, outreach, purchasing, or deployments without explicit founder approval.

## Delivery stages
- Stage 1: Implement auth, tenant isolation, approval integrity, and adversarial tests.
- Stage 2: Research/content/lead/shorts agents in draft-only mode.
- Stage 3: Cloudflare scheduled jobs, queueing, private dashboard, alerts and cost controls.
- Stage 4: Controlled staging deployment, security validation, and founder sign-off before production.

## Acceptance tests
- Anonymous callers receive 401 for jobs, audit, tasks, approvals, and authority endpoints.
- Spoofed actor/tenant claims cannot cross boundaries.
- Replay, concurrent approval, expired approval, and changed arguments fail closed.
- Agents cannot access disallowed tools, credentials, websites or accounts.
- A scheduled run creates a draft without sending it.
- No external action executes before a valid scoped approval.
- A hard stop disables all consequential execution.
