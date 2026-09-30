import type { AgentDefinition, ModelProfile } from "./types";

const UPSTREAM = "https://api.github.com/repos/msitarzewski/agency-agents";
const NON_DIVISIONS = new Set([".github","examples","integrations","scripts","strategy"]);

type GithubEntry = { name: string; path: string; type: "file"|"dir"; download_url?: string|null };

function parseFrontmatter(source: string): Record<string,string> {
  if (!source.startsWith("---")) return {};
  const end = source.indexOf("\n---", 3);
  if (end < 0) return {};
  const result: Record<string,string> = {};
  for (const line of source.slice(3,end).split("\n")) {
    const i=line.indexOf(":"); if(i<0) continue;
    result[line.slice(0,i).trim()] = line.slice(i+1).trim().replace(/^["']|["']$/g,"");
  }
  return result;
}

function profileFor(text:string): ModelProfile {
  const q=text.toLowerCase();
  if(/code|engineer|developer|architect/.test(q)) return "coding";
  if(/visual|design|spatial|image/.test(q)) return "vision";
  if(/research|academic|legal|analysis/.test(q)) return "long-context";
  return "reasoning";
}

export async function fetchAgencyCatalog(fetcher: typeof fetch = fetch): Promise<AgentDefinition[]> {
  const root = await fetcher(`${UPSTREAM}/contents`);
  if(!root.ok) throw new Error(`Agency catalog root failed: ${root.status}`);
  const entries = await root.json() as GithubEntry[];
  const divisions = entries.filter(x=>x.type==="dir" && !NON_DIVISIONS.has(x.name));
  const agents: AgentDefinition[]=[];
  for(const division of divisions){
    const res=await fetcher(`${UPSTREAM}/contents/${division.path}`);
    if(!res.ok) continue;
    const children=await res.json() as GithubEntry[];
    for(const child of children.filter(x=>x.type==="file" && x.name.endsWith(".md") && x.download_url)){
      const raw=await fetcher(child.download_url!); if(!raw.ok) continue;
      const text=await raw.text(); const fm=parseFrontmatter(text);
      const name=fm.name || child.name.replace(/\.md$/,"").replace(/[-_]/g," ");
      const description=fm.description || `Agency Agents specialist from ${division.name}`;
      const words=(description+" "+name).toLowerCase().match(/[a-z][a-z-]{3,}/g) || [];
      const capabilities=[...new Set(words)].slice(0,12);
      agents.push({
        id:`agency:${division.name}:${child.name.replace(/\.md$/,"")}`,
        name, division:division.name, description, capabilities,
        allowedTools:["knowledge.read"], modelProfile:profileFor(name+" "+description)
      });
    }
  }
  return agents;
}
