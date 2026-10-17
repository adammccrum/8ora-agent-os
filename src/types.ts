export type Permission = "READ" | "ANALYSE" | "DRAFT" | "EXTERNAL" | "BLOCKED";
export type ModelProfile = "fast" | "reasoning" | "coding" | "vision" | "long-context";

export interface UniversalAgentDefinition {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  allowedTools: string[];
  defaultModelProfile: ModelProfile;
}

export interface TaskMode {
  id: string;
  label: string;
  modelProfile: ModelProfile;
  capabilities: string[];
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
  DB: D1Database;
  OMNIROUTE_BASE_URL?: string;
  OMNIROUTE_API_KEY?: string;
}
