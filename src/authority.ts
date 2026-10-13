import { getTool } from "./registry";
import type { ActionProposal, Authority } from "./types";

export type Decision =
  | { allowed: true; reason: string }
  | { allowed: false; reason: string; approvalRequired: boolean };

// Staging is deliberately read-only. An approval record is NOT an execution grant.
export function authorize(proposal: ActionProposal, _authority?: Authority): Decision {
  const tool = getTool(proposal.toolId);
  if (!tool) return { allowed: false, reason: "Unknown tools fail closed", approvalRequired: true };
  if (tool.permission === "BLOCKED") return { allowed: false, reason: "Tool is blocked", approvalRequired: false };
  if (tool.permission === "READ") return { allowed: true, reason: "Read-only capability", };
  return { allowed: false, reason: "External execution is disabled in staging", approvalRequired: true };
}
