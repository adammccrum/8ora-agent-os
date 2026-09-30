export type Permission = "READ" | "WRITE" | "EXECUTE" | "EXTERNAL" | "APPROVAL" | "BLOCKED";
export type ModelProfile = "fast" | "reasoning" | "coding" | "vision" | "long-context";

export interface AgentDefinition {
  id: string;
  name: string;
  division: string;
  description: string;
  capabilities: string[];
  allowedTools: string[];
  modelProfile: ModelProfile;
}

export interface ToolDefinition {
  id: string;
  description: string;
  permission: Permission;
}

export interface ActionProposal {
  toolId: string;
  args: unknown;
  tenantId: string;
  actorId: string;
}

export interface Authority {
  approvalId: string;
  tenantId: string;
  actorId: string;
  toolId: string;
  expiresAt: number;
}

export interface Env {
  OMNIROUTE_BASE_URL?: string;
  OMNIROUTE_API_KEY?: string;
}
