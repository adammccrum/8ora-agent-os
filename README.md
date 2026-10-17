# IrisKey Universal Agent

Cloudflare-first universal AI agent runtime for IrisKey.ai.

This repository began as the standalone 8ORA Agent OS prototype. The runtime is now being simplified around one adaptive IrisKey agent rather than a catalogue of separate agents.

## Core flow

```
Request
  -> IrisKey Universal Agent
  -> Task Mode / OmniRoute
  -> Tool Proposal
  -> IrisKey Authority Gate
  -> Approved Execution
  -> Audit
  -> Result
```

## Design principles

- One universal agent; capabilities are loaded dynamically for the task.
- Model providers are decoupled from the agent runtime.
- OmniRoute remains the model-gateway boundary.
- Tools are shared capabilities, not duplicated per persona.
- Read / analysis / drafting can be permitted by policy.
- Consequential external actions fail closed without explicit scoped authority.
- Approval is bound to tenant, actor, tool and exact action arguments.
- Secrets never belong in this repository.
- Production applications remain isolated from this runtime until explicitly connected.

## Current vertical slice

The first proof target is:

```
User request
-> universal agent reasons
-> reads an approved GitHub target
-> drafts a GitHub issue
-> authority gate stops execution
-> user approves or denies
-> exact approved action executes
-> audit trail records the consequence
```

## Local development

```bash
npm install
npm test
npm run typecheck
npm run dev
```

## Cloudflare

Copy `.dev.vars.example` to `.dev.vars` for local secrets. Never commit `.dev.vars`.

Deployment remains a separate explicit step.
