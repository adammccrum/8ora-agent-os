import type { Env, ModelProfile } from "./types";

export interface ModelRequest {
  profile: ModelProfile;
  tier?: "slm"|"llm";
  freeOnly?: boolean;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export async function routeModel(env: Env, request: ModelRequest): Promise<unknown> {
  if ((!env.OMNIROUTE_BASE_URL || !env.OMNIROUTE_API_KEY) && env.AI && env.WORKERS_AI_FREE_PLAN === "true") {
    if(request.freeOnly!==true||!request.tier)throw new Error("Model unavailable: verified free model tier required");
    if(request.messages.reduce((n,m)=>n+m.content.length,0)>16384)throw new Error("Model request exceeds 16 KiB limit");
    const model=request.tier==="slm"?"@cf/meta/llama-3.2-3b-instruct":"@cf/meta/llama-3.1-8b-instruct-fp8";
    // This deployment uses the verified Workers Free plan: quota exhaustion fails.
    // Never retry through a paid provider.
    const result=await env.AI.run(model,{messages:request.messages,max_tokens:512,stream:false});
    if(typeof result!=="object"||result===null||!("response" in result)||typeof result.response!=="string"||!result.response.trim())throw new Error("Workers AI returned no text");
    return {output:result.response,tier:request.tier,freeOnly:true,billable:false,model,provider:"cloudflare-workers-ai"};
  }
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
