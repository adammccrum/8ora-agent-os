import type { Env, ModelProfile } from "./types";

export interface ModelRequest {
  profile: ModelProfile;
  tier?: "slm"|"llm";
  freeOnly?: boolean;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export async function routeModel(env: Env, request: ModelRequest): Promise<unknown> {
  if (!env.OMNIROUTE_BASE_URL || !env.OMNIROUTE_API_KEY) {
    throw new Error("Model unavailable: OmniRoute credentials not configured");
  }

  if(request.freeOnly!==true||!request.tier)throw new Error("Model unavailable: verified free model tier required");
  const response = await fetch(new URL("/v1/route", env.OMNIROUTE_BASE_URL), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${env.OMNIROUTE_API_KEY}`
    },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error(`OmniRoute failed: ${response.status}`);
  const result:unknown=await response.json();
  if(typeof result!=="object"||result===null||Array.isArray(result))throw new Error("OmniRoute invalid response");
  const meta=result as Record<string,unknown>;
  if(meta.tier!==request.tier||meta.freeOnly!==true||meta.billable!==false||typeof meta.model!=="string"||!meta.model.trim())throw new Error("OmniRoute did not attest free-only model tier; response rejected");
  return result;
}
