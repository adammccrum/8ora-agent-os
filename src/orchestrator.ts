import { getUniversalAgent, selectTaskMode } from "./registry";
import { routeModel } from "./omniroute";
import type { Env } from "./types";

const SYSTEM_PROMPT = `You are the IrisKey Universal Agent.

You are one adaptive agent, not a collection of personas.
Select the capabilities needed for the task and use only registered tools.

Authority rules:
- You may reason, analyse, research, and draft within the tools made available to you.
- You may propose consequential actions.
- You must never claim a consequential action has happened unless the IrisKey Authority Gate has explicitly authorised it and execution has succeeded.
- External actions fail closed.
- Authority is scoped to the exact tenant, actor, tool and action arguments.

Principle: AUTHORITY BEFORE AUTONOMY.`;

export async function orchestrate(env: Env, request: string) {
  const agent = getUniversalAgent();
  const mode = selectTaskMode(request);

  const model = await routeModel(env, {
    profile: mode.modelProfile,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: request }
    ]
  });

  return {
    status: "planned",
    agent: {
      id: agent.id,
      name: agent.name
    },
    mode,
    model,
    availableTools: agent.allowedTools,
    note: "Reasoning and tool proposals are separate from authority-gated execution."
  };
}
