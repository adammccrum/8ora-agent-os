# 8ORA Agent OS

Standalone, Cloudflare-first orchestration layer for 8ORA.

## Phase 1
This repository is deliberately independent from the production 8ORA application.

Flow:

```
Request -> Orchestrator -> Agent Registry -> OmniRoute -> Tool Proposal
        -> Authority Gate -> Execution -> Audit -> Result
```

## Principles
- Agents and model providers are decoupled.
- OmniRoute is the single model-gateway boundary.
- Tools are shared capabilities, not duplicated per agent.
- External/consequential actions fail closed without explicit authority.
- Secrets never belong in this repository.
- Production 8ORA is not modified by Phase 1.

## Local
```bash
npm install
npm test
npm run dev
```

## Cloudflare
Copy `.dev.vars.example` to `.dev.vars` for local secrets. Never commit `.dev.vars`.
Deployment is intentionally not performed in Phase 1 without explicit approval.
