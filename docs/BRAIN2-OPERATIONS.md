# Brain 2 private deployment

Brain 2 runs separately at https://8ora-agent-os.long-river-2983.workers.dev.
8ORA.AI remains on Netlify. No public website or IrisKey.ai deployment is changed.

## Use it

Open the Brain 2 address. Enter the founder token saved in your password manager, then select Connect.
The token remains only in the current tab's memory. Clear or closing the tab removes it.
Use Ask Brain 2 to create a private plan. Results are text plans; no external action is performed.

## Authentication

FOUNDER_API_TOKEN is an encrypted Cloudflare Worker secret.
FOUNDER_TENANT_ID and FOUNDER_ACTOR_ID establish the trusted principal on the server.
The task endpoint derives identity from this principal and rejects conflicting supplied identities.
Never put tokens in GitHub source, URLs, screenshots, logs or chat.

## AI and limits

The deployment uses the existing Cloudflare Workers Free plan.
Routine tasks use Llama 3.2 3B; complex tasks use Llama 3.1 8B.
Requests cap input size and output length. Quota errors stop processing; there is no paid fallback.
Review the free-only guard before changing the account's plan.
Provider-hosted inference is not on-device inference.

## Operations and checks

Autonomous tool execution is disabled. Outbound communication, publishing, purchases and production changes are not enabled by this deployment.
The existing 15-minute scheduler handles queue recovery only.
An operator can set BRAIN2_DEPLOYMENT_CHECK_ID for a one-time private verification on an existing scheduled invocation.
That verification checks founder authentication, principal isolation, database routes, unknown-tool denial, and one synthetic AI plan.
It writes a sanitized result into the internal deployment-check namespace, never the credential or AI response.
Remove the diagnostic setting after verification. Do not add a faster or additional schedule.
Preview URLs are disabled in wrangler.jsonc.

GitHub deployment uses only the brain2-production environment and the existing 8ora-agent-os Worker and D1 database.
