import type { Env, ModelProfile } from "./types";

export interface ModelRequest {
  profile: ModelProfile;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export async function routeModel(env: Env, request: ModelRequest): Promise<unknown> {
  if (!env.OMNIROUTE_BASE_URL || !env.OMNIROUTE_API_KEY) {
    return { mode: "mock", profile: request.profile, reason: "OmniRoute credentials not configured" };
  }

  const response = await fetch(new URL("/v1/route", env.OMNIROUTE_BASE_URL), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${env.OMNIROUTE_API_KEY}`
    },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error(`OmniRoute failed: ${response.status}`);
  return response.json();
}
