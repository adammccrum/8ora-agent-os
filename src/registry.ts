import type { AgentDefinition, ToolDefinition } from "./types";

const agents: AgentDefinition[] = [
  {"id":"ora-director","name":"ORA Director","division":"orchestration","description":"Draft-only ORA Director specialist; no independent external actions.","capabilities":["route","plan","coordinate"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"iriskey-authority","name":"IrisKey Authority","division":"security","description":"Draft-only IrisKey Authority specialist; no independent external actions.","capabilities":["authority","approval","governance"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"watchdog","name":"Watchdog","division":"operations","description":"Draft-only Watchdog specialist; no independent external actions.","capabilities":["monitor","alert","recover"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"sales-director","name":"Sales Director","division":"sales","description":"Draft-only Sales Director specialist; no independent external actions.","capabilities":["sales","pipeline","forecast"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"lead-generation","name":"Lead Generation","division":"sales","description":"Draft-only Lead Generation specialist; no independent external actions.","capabilities":["leads","prospect","discover"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"lead-qualification","name":"Lead Qualification","division":"sales","description":"Draft-only Lead Qualification specialist; no independent external actions.","capabilities":["qualify","score","leads"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"sales-outreach","name":"Sales Outreach","division":"sales","description":"Draft-only Sales Outreach specialist; no independent external actions.","capabilities":["outreach","draft","email"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"crm-manager","name":"CRM Manager","division":"sales","description":"Draft-only CRM Manager specialist; no independent external actions.","capabilities":["crm","records","followup"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"marketing-director","name":"Marketing Director","division":"marketing","description":"Draft-only Marketing Director specialist; no independent external actions.","capabilities":["marketing","strategy"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"seo-specialist","name":"SEO Specialist","division":"marketing","description":"Draft-only SEO Specialist specialist; no independent external actions.","capabilities":["seo","search","keywords"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"content-marketing","name":"Content Marketing","division":"marketing","description":"Draft-only Content Marketing specialist; no independent external actions.","capabilities":["content","blog","editorial"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"social-media","name":"Social Media Manager","division":"marketing","description":"Draft-only Social Media Manager specialist; no independent external actions.","capabilities":["social","posts"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"advertising","name":"Advertising Specialist","division":"marketing","description":"Draft-only Advertising Specialist specialist; no independent external actions.","capabilities":["advertising","ads"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"conversion","name":"Conversion Specialist","division":"marketing","description":"Draft-only Conversion Specialist specialist; no independent external actions.","capabilities":["conversion","funnel"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"shorts-strategist","name":"Shorts Strategist","division":"video","description":"Draft-only Shorts Strategist specialist; no independent external actions.","capabilities":["shorts","plan"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"scriptwriter","name":"Scriptwriter","division":"video","description":"Draft-only Scriptwriter specialist; no independent external actions.","capabilities":["scripts","storyboard"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"video-producer","name":"Video Producer","division":"video","description":"Draft-only Video Producer specialist; no independent external actions.","capabilities":["video","render"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"video-qa","name":"Video Quality Control","division":"video","description":"Draft-only Video Quality Control specialist; no independent external actions.","capabilities":["video","verify","quality"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"licensing-scout","name":"Licensing Scout","division":"licensing","description":"Draft-only Licensing Scout specialist; no independent external actions.","capabilities":["licensing","targets"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"partnerships","name":"Partnership Specialist","division":"licensing","description":"Draft-only Partnership Specialist specialist; no independent external actions.","capabilities":["partnership","research"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"proposal-writer","name":"Proposal Writer","division":"licensing","description":"Draft-only Proposal Writer specialist; no independent external actions.","capabilities":["proposal","licensing","draft"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"opportunity-scout","name":"Business Opportunity Scout","division":"commercial","description":"Draft-only Business Opportunity Scout specialist; no independent external actions.","capabilities":["opportunity","market"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"customer-onboarding","name":"Customer Onboarding","division":"customer","description":"Draft-only Customer Onboarding specialist; no independent external actions.","capabilities":["onboarding"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"customer-support","name":"Customer Support","division":"customer","description":"Draft-only Customer Support specialist; no independent external actions.","capabilities":["support","tickets"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"market-researcher","name":"Market Researcher","division":"research","description":"Draft-only Market Researcher specialist; no independent external actions.","capabilities":["research","market"],"allowedTools":["knowledge.read"],"modelProfile":"long-context"},
  {"id":"github-scout","name":"GitHub Scout","division":"research","description":"Draft-only GitHub Scout specialist; no independent external actions.","capabilities":["github","open-source"],"allowedTools":["knowledge.read"],"modelProfile":"long-context"},
  {"id":"engineering-researcher","name":"Engineering Researcher","division":"engineering","description":"Draft-only Engineering Researcher specialist; no independent external actions.","capabilities":["physics","simulation","research"],"allowedTools":["knowledge.read"],"modelProfile":"coding"},
  {"id":"testing-engineer","name":"Testing Engineer","division":"engineering","description":"Draft-only Testing Engineer specialist; no independent external actions.","capabilities":["test","verify"],"allowedTools":["knowledge.read"],"modelProfile":"coding"},
  {"id":"integration-engineer","name":"Integration Engineer","division":"engineering","description":"Draft-only Integration Engineer specialist; no independent external actions.","capabilities":["integrate","api"],"allowedTools":["knowledge.read"],"modelProfile":"coding"},
  {"id":"finance-analyst","name":"Finance Analyst","division":"operations","description":"Draft-only Finance Analyst specialist; no independent external actions.","capabilities":["finance","budget"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {"id":"operations-manager","name":"Operations Manager","division":"operations","description":"Draft-only Operations Manager specialist; no independent external actions.","capabilities":["operations","schedule"],"allowedTools":["knowledge.read"],"modelProfile":"reasoning"},
  {
    id: "software-engineer",
    name: "Software Engineer",
    division: "engineering",
    description: "Designs, reviews and prepares software changes.",
    capabilities: ["code", "debug", "architecture", "test"],
    allowedTools: ["knowledge.read"],
    modelProfile: "coding"
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
  return scored[0]?.score ? scored[0].agent : agents.find(a=>a.id==="ora-director")!;
}
