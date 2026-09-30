import { authorize } from "./authority";
import { orchestrate } from "./orchestrator";
import { listAgents, listTools } from "./registry";
import type { ActionProposal, Authority, Env } from "./types";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json" } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health")
      return json({ ok: true, service: "8ora-agent-os", phase: 1 });
    if (request.method === "GET" && url.pathname === "/v1/agents") return json(listAgents());
    if (request.method === "GET" && url.pathname === "/v1/tools") return json(listTools());

    if (request.method === "POST" && url.pathname === "/v1/tasks") {
      const body = await request.json<{ request?: string }>();
      if (!body.request) return json({ error: "request is required" }, 400);
      return json(await orchestrate(env, body.request));
    }

    if (request.method === "POST" && url.pathname === "/v1/authority/check") {
      const body = await request.json<{ proposal: ActionProposal; authority?: Authority }>();
      return json(authorize(body.proposal, body.authority));
    }

    return json({ error: "not found" }, 404);
  }
};
