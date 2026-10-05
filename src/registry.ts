import type { ModelProfile, TaskMode, ToolDefinition, UniversalAgentDefinition } from "./types";

const universalAgent: UniversalAgentDefinition = {
  id: "iriskey-universal",
  name: "IrisKey Universal Agent",
  description: "One adaptive agent that selects capabilities and tools for the task while all consequential actions remain authority-gated.",
  capabilities: [
    "research",
    "analyse",
    "reason",
    "code",
    "debug",
    "security",
    "draft",
    "documents",
    "data",
    "plan",
    "route"
  ],
  allowedTools: [
    "knowledge.read",
    "github.read",
    "web.read",
    "github.create_issue"
  ],
  defaultModelProfile: "reasoning"
};

const tools: ToolDefinition[] = [
  { id: "knowledge.read", description: "Read approved internal knowledge", permission: "READ" },
  { id: "github.read", description: "Read from an approved GitHub target", permission: "READ" },
  { id: "web.read", description: "Read an external web resource without changing it", permission: "READ" },
  { id: "github.create_issue", description: "Create an issue in an approved GitHub repository", permission: "EXTERNAL" }
];

const modes: Array<{ id: string; label: string; profile: ModelProfile; keywords: string[]; capabilities: string[] }> = [
  {
    id: "coding",
    label: "Coding",
    profile: "coding",
    keywords: ["code", "bug", "github", "repo", "typescript", "javascript", "python", "build", "debug", "test"],
    capabilities: ["code", "debug", "security", "analyse"]
  },
  {
    id: "research",
    label: "Research",
    profile: "long-context",
    keywords: ["research", "investigate", "compare", "evidence", "paper", "patent", "study"],
    capabilities: ["research", "analyse", "reason"]
  },
  {
    id: "fast",
    label: "Fast task",
    profile: "fast",
    keywords: ["quick", "short", "summarise", "summarize"],
    capabilities: ["analyse", "draft"]
  }
];

export function getUniversalAgent(): UniversalAgentDefinition {
  return universalAgent;
}

export function listAgents(): UniversalAgentDefinition[] {
  return [universalAgent];
}

export function listTools(): ToolDefinition[] {
  return tools;
}

export function getTool(id: string): ToolDefinition | undefined {
  return tools.find(tool => tool.id === id);
}

export function selectTaskMode(request: string): TaskMode {
  const q = request.toLowerCase();
  const match = modes
    .map(mode => ({
      mode,
      score: mode.keywords.reduce((score, keyword) => score + (q.includes(keyword) ? 1 : 0), 0)
    }))
    .sort((a, b) => b.score - a.score)[0];

  if (!match || match.score === 0) {
    return {
      id: "general",
      label: "General reasoning",
      modelProfile: universalAgent.defaultModelProfile,
      capabilities: ["reason", "analyse", "plan", "draft"]
    };
  }

  return {
    id: match.mode.id,
    label: match.mode.label,
    modelProfile: match.mode.profile,
    capabilities: match.mode.capabilities
  };
}
