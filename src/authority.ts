import { getTool } from "./registry";
import type { ActionProposal, Authority } from "./types";

export type Decision =
  | { allowed: true; reason: string }
  | { allowed: false; reason: string; approvalRequired: boolean };

export function authorize(proposal: ActionProposal, authority?: Authority): Decision {
  const tool = getTool(proposal.toolId);
  if (!tool) return { allowed: false, reason: "Unknown tools fail closed", approvalRequired: true };
  if (tool.permission === "BLOCKED") return { allowed: false, reason: "Tool is blocked", approvalRequired: false };
  if (tool.permission === "READ") return { allowed: true, reason: "Approved read capability" };

  const valid = authority &&
    authority.toolId === proposal.toolId &&
    authority.tenantId === proposal.tenantId &&
    authority.actorId === proposal.actorId &&
    authority.expiresAt > Date.now();

  return valid
    ? { allowed: true, reason: "Explicit scoped authority verified" }
    : { allowed: false, reason: "Explicit scoped authority required", approvalRequired: true };
}
