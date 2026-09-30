import type { AgentDefinition, ToolDefinition } from "./types";

const agents: AgentDefinition[] = [
  {
    id: "ora-general",
    name: "ORA General",
    division: "orchestration",
    description: "Safe fallback agent for general planning and analysis.",
    capabilities: ["plan", "analyse", "route"],
    allowedTools: ["knowledge.read"],
    modelProfile: "reasoning"
  },
  {
    id: "software-engineer",
    name: "Software Engineer",
    division: "engineering",
    description: "Designs, reviews and prepares software changes.",
    capabilities: ["code", "debug", "architecture", "test"],
    allowedTools: ["knowledge.read", "github.write"],
    modelProfile: "coding"
  },
  {
    id: "researcher",
    name: "Researcher",
    division: "research",
    description: "Researches and synthesises evidence.",
    capabilities: ["research", "analyse", "summarise"],
    allowedTools: ["knowledge.read", "web.external"],
    modelProfile: "long-context"
  }
];

const tools: ToolDefinition[] = [
  { id: "knowledge.read", description: "Read approved knowledge", permission: "READ" },
  { id: "github.write", description: "Write to an approved GitHub target", permission: "EXTERNAL" },
  { id: "web.external", description: "Access an external network resource", permission: "EXTERNAL" }
];

export function listAgents() { return agents; }
export function listTools() { return tools; }
export function getTool(id: string) { return tools.find(t => t.id === id); }

export function selectAgent(request: string): AgentDefinition {
  const q = request.toLowerCase();
  const scored = agents.map(agent => ({
    agent,
    score: agent.capabilities.reduce((n, c) => n + (q.includes(c) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].agent : agents[0];
}
