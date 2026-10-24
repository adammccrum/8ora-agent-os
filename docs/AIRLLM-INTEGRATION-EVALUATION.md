# AirLLM optional local inference — ORCA / Brain 2

**Status:** evaluated, not installed or deployed.

Upstream: https://github.com/lyogavin/airllm (Apache-2.0; verify individual model licences).

## Recommendation
Keep ORCA's existing on-demand model routing. Add AirLLM only as an **optional, disabled-by-default** private local inference adapter. Do not delay founder login, memory, chat and voice delivery to wait for this feature.

## Why it cannot run in the current stack
AirLLM is a Python model runner requiring model weights, large disk throughput, and suitable CPU/GPU resources. Cloudflare Workers, Netlify static hosting and Supabase Edge Functions are not general-purpose GPU model hosts. Low VRAM does not imply low storage, low RAM, low cost, or fast responses.

## Proposed boundary
Phone UI → authenticated ORCA backend → IrisKey authority boundary → model router.
Model router → configured hosted models (existing) OR private AirLLM HTTP adapter (opt-in).
The adapter must not have tool execution, GitHub write, payment, mail or other side effects.

## Before enabling
1. Confirm a suitable owner-controlled machine, disk capacity, supported GPU/driver, acceptable latency, and model licence. No new paid host by default.
2. Pin AirLLM and selected model version; inspect upstream dependencies before installation.
3. Expose an HTTP inference adapter only via a private encrypted channel; NEVER place an unauthenticated public endpoint on the internet.
4. Founder-only authentication with token verification, bounded requests, quotas, timeouts and safe logging.
5. Fail closed and fall back to existing provider routing when AirLLM is unavailable; show the selected model and execution location in ORCA.
6. Run model response, latency, offline use, data handling, memory, cancellation, and authority-gate tests.
7. Enable only after explicit founder approval, keeping Brain 2 on-demand rather than permanently running.

## Deployment and secret policy
Do not request or commit extra API keys; reuse existing secrets where already configured. No automatic download of large models, no Cloudflare production deploy, no change to 8ora.ai public site, and no modification of IrisKey.ai.
