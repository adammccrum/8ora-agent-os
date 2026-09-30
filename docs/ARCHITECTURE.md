# Architecture

## Boundary
Phase 1 does not modify or call production 8ORA.

## Runtime
Cloudflare Worker is the HTTP/control-plane runtime. Persistence adapters will be added for D1/R2/KV/Queues/Durable Objects as their responsibilities are introduced.

## Execution chain
1. 8ORA/API client submits task.
2. Orchestrator selects a specialist by capability.
3. Specialist requests a model profile.
4. OmniRoute resolves model/provider outside the agent definition.
5. Agent may propose a tool call.
6. Authority gate evaluates the exact actor, tenant, tool and expiry.
7. Consequential action is blocked unless valid authority exists.
8. Execution/audit adapters record the outcome.

## Agency Agents
The production catalogue should be imported/generated rather than copied into orchestration code. The initial registry contains only bootstrap agents so the runtime can be tested before the full catalogue is wired in.

## Public-repository rule
No API keys, customer data, private prompts, internal credentials or protected IrisKey material may be committed here.
