import { selectAgent } from "./registry";
import { routeModel } from "./omniroute";
import type { Env } from "./types";

export async function orchestrate(env: Env, request: string) {
  const agent = selectAgent(request);
  const model = await routeModel(env, {
    profile: agent.modelProfile,
    messages: [
      { role: "system", content: `You are ${agent.name}. Stay within your declared capabilities and tools.` },
      { role: "user", content: request }
    ]
  });
  return {
    status: "planned",
    agent: { id: agent.id, name: agent.name, modelProfile: agent.modelProfile },
    model,
    note: "Tool execution is a separate authority-gated phase."
  };
}
