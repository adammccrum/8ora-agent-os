import { selectAgent } from "./registry";
import { chooseModel } from "./slm-policy";
import { routeModel } from "./omniroute";
import type { Env } from "./types";

export async function orchestrate(env: Env, request: string) {
  const agent = selectAgent(request);
  const plan = chooseModel(agent,request);
  const model = await routeModel(env, {
    profile: plan.profile,
    tier: plan.tier,
    freeOnly: true,
    messages: [
      { role: "system", content: `You are ${agent.name}. Stay within your declared capabilities and tools.` },
      { role: "user", content: request }
    ]
  });
  return {
    status: "planned",
    agent: { id: agent.id, name: agent.name, modelProfile: agent.modelProfile },
    model,
    modelPlan:plan,
    note: "Tool execution is a separate authority-gated phase."
  };
}
