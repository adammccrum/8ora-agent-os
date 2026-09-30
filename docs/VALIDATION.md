# Phase 1 validation

The standalone OS is considered ready for deployment testing only when CI passes:

1. TypeScript typecheck.
2. Authority gate blocks external actions without scoped approval.
3. Tenant and actor isolation tests pass.
4. Expired authority is rejected.
5. Capability routing selects a suitable bootstrap specialist.
6. Unknown work falls back safely.
7. Action argument hashes differ when proposed arguments differ.

## Agency Agents source
The upstream catalogue is pinned in `agency-source.json`. At the pinned source commit it contains 279 agent Markdown files across 18 divisions.

Runtime code must not silently follow upstream `main`. Updating the pin is an explicit maintenance action followed by validation.

## Not yet production
Passing CI does not mean the system is connected to 8ORA or deployed to Cloudflare. Those remain separate explicit stages.
