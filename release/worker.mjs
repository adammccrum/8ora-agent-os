var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/deployment-check.ts
async function deploymentCheck(handle, env) {
  const id = env.BRAIN2_DEPLOYMENT_CHECK_ID;
  if (!id) return;
  const row = await env.DB.prepare("SELECT value_json FROM brain2_memory WHERE tenant_id=? AND pipeline='internal' AND namespace='deployment-check' AND key=?").bind(env.FOUNDER_TENANT_ID, id).first();
  if (row && JSON.parse(row.value_json).passed === true) return;
  if (!env.FOUNDER_API_TOKEN || env.FOUNDER_API_TOKEN.length < 32) throw Error("Founder credential is missing or too short");
  const headers = { authorization: "Bearer " + env.FOUNDER_API_TOKEN, "content-type": "application/json" };
  const checks = {};
  const run = /* @__PURE__ */ __name(async (name, path, status, body, auth = true) => {
    const r = await handle(new Request("https://brain2.internal" + path, { method: body === void 0 ? "GET" : "POST", headers: auth ? headers : { "content-type": "application/json" }, ...body === void 0 ? {} : { body: JSON.stringify(body) } }));
    checks[name] = r.status === status;
    if (!checks[name]) throw Error("Deployment check failed: " + name);
    return r;
  }, "run");
  await run("anonymous_denied", "/v1/jobs", 401, void 0, false);
  const ready = await (await run("founder_readiness", "/ready", 200)).json();
  if (!ready.ready || !ready.modelConfigured || ready.autonomousExecutionEnabled) throw Error("Readiness boundary failed");
  for (const path of ["/v1/agents", "/v1/jobs", "/v1/audit", "/v1/brain2/queue/health"]) await run(path, path, 200);
  await run("tenant_spoof_denied", "/v1/tasks", 403, { request: "Deployment boundary test", tenantId: "deployment-other-tenant", actorId: "deployment-other-actor" });
  await run("unknown_tool_denied", "/v1/authority/check", 403, { proposal: { tenantId: env.FOUNDER_TENANT_ID, actorId: env.FOUNDER_ACTOR_ID, toolId: "deployment-unknown-tool", args: {} } });
  const result = await (await run("model_plan", "/v1/tasks", 202, { request: "Deployment verification only. Reply with the single word READY." })).json();
  if (!result.model?.output?.trim() || result.model.billable !== false || result.status !== "planned") throw Error("Model plan verification failed");
  const proof = { passed: true, checks, modelProducedText: true, autonomousExecutionEnabled: false, checkedAt: Date.now() };
  await env.DB.prepare("INSERT INTO brain2_memory(id,tenant_id,pipeline,namespace,key,value_json,updated_at) VALUES(?,?,'internal','deployment-check',?,?,?) ON CONFLICT(tenant_id,pipeline,namespace,key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at").bind(crypto.randomUUID(), env.FOUNDER_TENANT_ID, id, JSON.stringify(proof), Date.now()).run();
}
__name(deploymentCheck, "deploymentCheck");

// src/registry.ts
var agents = [
  { "id": "ora-director", "name": "ORA Director", "division": "orchestration", "description": "Draft-only ORA Director specialist; no independent external actions.", "capabilities": ["route", "plan", "coordinate"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "iriskey-authority", "name": "IrisKey Authority", "division": "security", "description": "Draft-only IrisKey Authority specialist; no independent external actions.", "capabilities": ["authority", "approval", "governance"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "watchdog", "name": "Watchdog", "division": "operations", "description": "Draft-only Watchdog specialist; no independent external actions.", "capabilities": ["monitor", "alert", "recover"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "sales-director", "name": "Sales Director", "division": "sales", "description": "Draft-only Sales Director specialist; no independent external actions.", "capabilities": ["sales", "pipeline", "forecast"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "lead-generation", "name": "Lead Generation", "division": "sales", "description": "Draft-only Lead Generation specialist; no independent external actions.", "capabilities": ["leads", "prospect", "discover"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "lead-qualification", "name": "Lead Qualification", "division": "sales", "description": "Draft-only Lead Qualification specialist; no independent external actions.", "capabilities": ["qualify", "score", "leads"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "sales-outreach", "name": "Sales Outreach", "division": "sales", "description": "Draft-only Sales Outreach specialist; no independent external actions.", "capabilities": ["outreach", "draft", "email"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "crm-manager", "name": "CRM Manager", "division": "sales", "description": "Draft-only CRM Manager specialist; no independent external actions.", "capabilities": ["crm", "records", "followup"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "marketing-director", "name": "Marketing Director", "division": "marketing", "description": "Draft-only Marketing Director specialist; no independent external actions.", "capabilities": ["marketing", "strategy"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "seo-specialist", "name": "SEO Specialist", "division": "marketing", "description": "Draft-only SEO Specialist specialist; no independent external actions.", "capabilities": ["seo", "search", "keywords"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "content-marketing", "name": "Content Marketing", "division": "marketing", "description": "Draft-only Content Marketing specialist; no independent external actions.", "capabilities": ["content", "blog", "editorial"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "social-media", "name": "Social Media Manager", "division": "marketing", "description": "Draft-only Social Media Manager specialist; no independent external actions.", "capabilities": ["social", "posts"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "advertising", "name": "Advertising Specialist", "division": "marketing", "description": "Draft-only Advertising Specialist specialist; no independent external actions.", "capabilities": ["advertising", "ads"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "conversion", "name": "Conversion Specialist", "division": "marketing", "description": "Draft-only Conversion Specialist specialist; no independent external actions.", "capabilities": ["conversion", "funnel"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "shorts-strategist", "name": "Shorts Strategist", "division": "video", "description": "Draft-only Shorts Strategist specialist; no independent external actions.", "capabilities": ["shorts", "plan"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "scriptwriter", "name": "Scriptwriter", "division": "video", "description": "Draft-only Scriptwriter specialist; no independent external actions.", "capabilities": ["scripts", "storyboard"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "video-producer", "name": "Video Producer", "division": "video", "description": "Draft-only Video Producer specialist; no independent external actions.", "capabilities": ["video", "render"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "video-qa", "name": "Video Quality Control", "division": "video", "description": "Draft-only Video Quality Control specialist; no independent external actions.", "capabilities": ["video", "verify", "quality"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "licensing-scout", "name": "Licensing Scout", "division": "licensing", "description": "Draft-only Licensing Scout specialist; no independent external actions.", "capabilities": ["licensing", "targets"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "partnerships", "name": "Partnership Specialist", "division": "licensing", "description": "Draft-only Partnership Specialist specialist; no independent external actions.", "capabilities": ["partnership", "research"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "proposal-writer", "name": "Proposal Writer", "division": "licensing", "description": "Draft-only Proposal Writer specialist; no independent external actions.", "capabilities": ["proposal", "licensing", "draft"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "opportunity-scout", "name": "Business Opportunity Scout", "division": "commercial", "description": "Draft-only Business Opportunity Scout specialist; no independent external actions.", "capabilities": ["opportunity", "market"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "customer-onboarding", "name": "Customer Onboarding", "division": "customer", "description": "Draft-only Customer Onboarding specialist; no independent external actions.", "capabilities": ["onboarding"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "customer-support", "name": "Customer Support", "division": "customer", "description": "Draft-only Customer Support specialist; no independent external actions.", "capabilities": ["support", "tickets"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "market-researcher", "name": "Market Researcher", "division": "research", "description": "Draft-only Market Researcher specialist; no independent external actions.", "capabilities": ["research", "market"], "allowedTools": ["knowledge.read"], "modelProfile": "long-context" },
  { "id": "github-scout", "name": "GitHub Scout", "division": "research", "description": "Draft-only GitHub Scout specialist; no independent external actions.", "capabilities": ["github", "open-source"], "allowedTools": ["knowledge.read"], "modelProfile": "long-context" },
  { "id": "engineering-researcher", "name": "Engineering Researcher", "division": "engineering", "description": "Draft-only Engineering Researcher specialist; no independent external actions.", "capabilities": ["physics", "simulation", "research"], "allowedTools": ["knowledge.read"], "modelProfile": "coding" },
  { "id": "testing-engineer", "name": "Testing Engineer", "division": "engineering", "description": "Draft-only Testing Engineer specialist; no independent external actions.", "capabilities": ["test", "verify"], "allowedTools": ["knowledge.read"], "modelProfile": "coding" },
  { "id": "integration-engineer", "name": "Integration Engineer", "division": "engineering", "description": "Draft-only Integration Engineer specialist; no independent external actions.", "capabilities": ["integrate", "api"], "allowedTools": ["knowledge.read"], "modelProfile": "coding" },
  { "id": "finance-analyst", "name": "Finance Analyst", "division": "operations", "description": "Draft-only Finance Analyst specialist; no independent external actions.", "capabilities": ["finance", "budget"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
  { "id": "operations-manager", "name": "Operations Manager", "division": "operations", "description": "Draft-only Operations Manager specialist; no independent external actions.", "capabilities": ["operations", "schedule"], "allowedTools": ["knowledge.read"], "modelProfile": "reasoning" },
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
var tools = [
  { id: "knowledge.read", description: "Read approved knowledge", permission: "READ" },
  { id: "github.write", description: "Write to an approved GitHub target", permission: "EXTERNAL" },
  { id: "web.external", description: "Access an external network resource", permission: "EXTERNAL" }
];
function listAgents() {
  return agents;
}
__name(listAgents, "listAgents");
function listTools() {
  return tools;
}
__name(listTools, "listTools");
function getTool(id) {
  return tools.find((t) => t.id === id);
}
__name(getTool, "getTool");
function selectAgent(request) {
  const q = request.toLowerCase();
  const scored = agents.map((agent) => ({
    agent,
    score: agent.capabilities.reduce((n, c) => n + (q.includes(c) ? 1 : 0), 0)
  })).sort((a, b) => b.score - a.score);
  return scored[0]?.score ? scored[0].agent : agents.find((a) => a.id === "ora-director");
}
__name(selectAgent, "selectAgent");

// src/authority.ts
function authorize(proposal, authority) {
  const tool = getTool(proposal.toolId);
  if (!tool) return { allowed: false, reason: "Unknown tools fail closed", approvalRequired: true };
  if (tool.permission === "BLOCKED") return { allowed: false, reason: "Tool is blocked", approvalRequired: false };
  if (tool.permission === "READ") return { allowed: true, reason: "Approved read capability" };
  const valid = authority && authority.toolId === proposal.toolId && authority.tenantId === proposal.tenantId && authority.actorId === proposal.actorId && authority.expiresAt > Date.now();
  return valid ? { allowed: true, reason: "Explicit scoped authority verified" } : { allowed: false, reason: "Explicit scoped authority required", approvalRequired: true };
}
__name(authorize, "authorize");

// src/brain2-incidents.ts
async function reportIncident(env, input) {
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO brain2_incidents(id,tenant_id,pipeline,queue_id,fingerprint,severity,category,summary,details_json,first_seen_at,last_seen_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(tenant_id,pipeline,fingerprint) DO UPDATE SET
 occurrences=occurrences+1,last_seen_at=excluded.last_seen_at,
 severity=excluded.severity,category=excluded.category,summary=excluded.summary,details_json=excluded.details_json,
 status='open',acknowledged_at=NULL,resolved_at=NULL`).bind(
    crypto.randomUUID(),
    input.tenantId,
    input.pipeline,
    input.queueId ?? null,
    input.fingerprint,
    input.severity,
    input.category,
    input.summary,
    JSON.stringify(input.details ?? {}),
    now,
    now
  ).run();
}
__name(reportIncident, "reportIncident");
async function listOpenIncidents(env, tenantId) {
  const result = await env.DB.prepare("SELECT id,pipeline,queue_id queueId,severity,category,summary,occurrences,first_seen_at firstSeenAt,last_seen_at lastSeenAt,status FROM brain2_incidents WHERE tenant_id=? AND status='open' ORDER BY CASE severity WHEN 'critical' THEN 0 ELSE 1 END,last_seen_at DESC LIMIT 100").bind(tenantId).all();
  return result.results;
}
__name(listOpenIncidents, "listOpenIncidents");
async function resolveIncident(env, tenantId, id) {
  const result = await env.DB.prepare("UPDATE brain2_incidents SET status='resolved',resolved_at=? WHERE id=? AND tenant_id=? AND status IN ('open','acknowledged')").bind(Date.now(), id, tenantId).run();
  return result.meta.changes === 1;
}
__name(resolveIncident, "resolveIncident");
async function acknowledgeIncident(env, tenantId, id) {
  const result = await env.DB.prepare("UPDATE brain2_incidents SET status='acknowledged',acknowledged_at=? WHERE id=? AND tenant_id=? AND status='open'").bind(Date.now(), id, tenantId).run();
  return result.meta.changes === 1;
}
__name(acknowledgeIncident, "acknowledgeIncident");
async function criticalIncidentFeed(env, tenantId) {
  const result = await env.DB.prepare("SELECT id,pipeline,queue_id queueId,category,summary,occurrences,last_seen_at lastSeenAt FROM brain2_incidents WHERE tenant_id=? AND status='open' AND severity='critical' ORDER BY last_seen_at DESC LIMIT 50").bind(tenantId).all();
  return { deliveryConfigured: false, items: result.results };
}
__name(criticalIncidentFeed, "criticalIncidentFeed");

// src/brain2-queue.ts
async function enqueue(env, input) {
  const id = crypto.randomUUID(), now = Date.now();
  await env.DB.prepare("INSERT INTO brain2_queue(id,tenant_id,actor_id,pipeline,agent_id,task_json,due_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id, input.tenantId, input.actorId, input.pipeline, input.agentId, JSON.stringify(input.task), input.dueAt, now, now).run();
  return id;
}
__name(enqueue, "enqueue");
async function recoverExpired(env, tenantId, now = Date.now()) {
  const dead = await env.DB.prepare("UPDATE brain2_queue SET status='dead',lease_until=NULL,last_error='lease expired: attempts exhausted',updated_at=? WHERE tenant_id=? AND status='leased' AND lease_until<=? AND attempts>=max_attempts").bind(now, tenantId, now).run();
  const requeued = await env.DB.prepare("UPDATE brain2_queue SET status='queued',lease_until=NULL,due_at=?,last_error='lease expired: retry scheduled',updated_at=? WHERE tenant_id=? AND status='leased' AND lease_until<=? AND attempts<max_attempts").bind(now + 3e4, now, tenantId, now).run();
  return { requeued: requeued.meta.changes ?? 0, dead: dead.meta.changes ?? 0 };
}
__name(recoverExpired, "recoverExpired");
async function pauseQueue(env, tenantId) {
  const now = Date.now();
  const result = await env.DB.prepare("UPDATE brain2_queue SET status='awaiting-approval',lease_until=NULL,updated_at=? WHERE tenant_id=? AND status IN ('queued','leased')").bind(now, tenantId).run();
  return result.meta.changes ?? 0;
}
__name(pauseQueue, "pauseQueue");
async function queueHealth(env, tenantId) {
  const result = await env.DB.prepare("SELECT pipeline,status,COUNT(*) count FROM brain2_queue WHERE tenant_id=? GROUP BY pipeline,status").bind(tenantId).all();
  return result.results;
}
__name(queueHealth, "queueHealth");

// src/founder-auth.ts
function founderPrincipal(request, env) {
  const token = env.FOUNDER_API_TOKEN;
  const tenantId = env.FOUNDER_TENANT_ID;
  const actorId = env.FOUNDER_ACTOR_ID;
  if (!token || !tenantId || !actorId || token.length < 32) return void 0;
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return void 0;
  const supplied = auth.slice(7);
  if (supplied.length !== token.length) return void 0;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) mismatch |= token.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0 ? { tenantId, actorId } : void 0;
}
__name(founderPrincipal, "founderPrincipal");

// src/dashboard.ts
function dashboardHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="referrer" content="no-referrer"><title>8ORA Agent OS</title>
<style>body{font-family:system-ui;background:#071018;color:#e8f4f7;margin:0;padding:32px}h1{font-size:28px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.card{background:#0e1c26;border:1px solid #1e3b48;border-radius:14px;padding:18px}code{color:#69d6cf}.muted{color:#91a8b3}button,input,textarea{padding:12px;margin:4px;background:#112c37;color:#e8f4f7;border:1px solid #34606a;border-radius:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style></head>
<body><h1>8ORA Agent OS</h1><p class="muted">Private founder dashboard. Autonomous execution disabled until validated.</p>
<label for="token">Founder token (kept only in this tab\u2019s memory; Clear removes it)</label><input id="token" type="password" autocomplete="off" spellcheck="false"><button id="connect">Connect</button><button id="disconnect">Clear</button><p id="message" role="status"></p>
<section class="card"><h2>Ask Brain 2</h2><label for="request">Task or question</label><br><textarea id="request" rows="4" maxlength="16000" style="width:min(95%,800px)" placeholder="What would you like help with?"></textarea><br><button id="ask" disabled>Plan task</button><p class="muted">Creates a private plan only. Sending, publishing, purchases and autonomous tool execution stay disabled.</p><pre id="answer"></pre></section><br><div class="grid"><div class="card"><h3>Readiness</h3><pre id="health">Not connected</pre></div><div class="card"><h3>Agents</h3><pre id="agents">Not connected</pre></div><div class="card"><h3>Jobs</h3><pre id="jobs">Not connected</pre></div><div class="card"><h3>Audit</h3><pre id="audit">Not connected</pre></div></div>
<script>let sessionToken="";const el=id=>document.getElementById(id);async function j(u,t){const r=await fetch(u,{headers:{Authorization:'Bearer '+t},cache:'no-store'});if(!r.ok)throw Error(u+': HTTP '+r.status);return r.json()};el('connect').onclick=async()=>{const t=el('token').value;el('message').textContent='Checking...';try{const h=await j('/ready',t);if(!h.ready)throw Error('Service not ready');const [a,jb,au]=await Promise.all([j('/v1/agents',t),j('/v1/jobs',t),j('/v1/audit',t)]);el('health').textContent=JSON.stringify(h,null,2);el('agents').textContent=a.length+' registered (not necessarily running)';el('jobs').textContent=JSON.stringify(jb.slice(0,5),null,2);el('audit').textContent=JSON.stringify(au.slice(0,5),null,2);sessionToken=t;el('ask').disabled=false;el('message').textContent='Connected. Token stays in this tab\u2019s memory until Clear or close.'}catch(e){sessionToken='';el('ask').disabled=true;el('message').textContent='Connection failed: '+e.message}finally{el('token').value=''}};el('ask').onclick=async()=>{const request=el('request').value.trim();if(!request||!sessionToken)return;el('ask').disabled=true;el('answer').textContent='Thinking...';try{const r=await fetch('/v1/tasks',{method:'POST',headers:{Authorization:'Bearer '+sessionToken,'content-type':'application/json'},body:JSON.stringify({request}),cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);const result=await r.json();el('answer').textContent=result.agent.name+'\\n\\n'+(result.model.output||JSON.stringify(result.model))+'\\n\\nPlan only \u2014 no external action was performed.'}catch(e){el('answer').textContent='Task failed: '+e.message}finally{el('ask').disabled=!sessionToken}};el('disconnect').onclick=()=>{sessionToken='';el('ask').disabled=true;el('answer').textContent='';el('token').value='';for(const id of ['health','agents','jobs','audit'])el(id).textContent='Not connected';el('message').textContent='Cleared'};<\/script></body></html>`;
}
__name(dashboardHtml, "dashboardHtml");

// src/hash.ts
async function hashArgs(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, "0")).join("");
}
__name(hashArgs, "hashArgs");

// src/slm-policy.ts
var llmAgents = /* @__PURE__ */ new Set(["engineering-researcher", "software-engineer", "testing-engineer", "integration-engineer"]);
function chooseModel(agent, request) {
  const complex = /(patent claim|formal verification|complex simulation|safety critical|legal opinion|advanced coding|multi-step proof)/i.test(request);
  const tier = complex || llmAgents.has(agent.id) ? "llm" : "slm";
  return { tier, profile: tier === "slm" ? "fast" : agent.modelProfile, reason: tier === "slm" ? "Routine specialist task; small-model first" : "Complex or engineering task; larger-model route requires availability", requiresFreeRoute: true };
}
__name(chooseModel, "chooseModel");

// src/omniroute.ts
async function routeModel(env, request) {
  if ((!env.OMNIROUTE_BASE_URL || !env.OMNIROUTE_API_KEY) && env.AI && env.WORKERS_AI_FREE_PLAN === "true") {
    if (request.freeOnly !== true || !request.tier) throw new Error("Model unavailable: verified free model tier required");
    if (request.messages.reduce((n, m) => n + m.content.length, 0) > 16384) throw new Error("Model request exceeds 16 KiB limit");
    const model = request.tier === "slm" ? "@cf/meta/llama-3.2-3b-instruct" : "@cf/meta/llama-3.1-8b-instruct-fp8";
    const result2 = await env.AI.run(model, { messages: request.messages, max_tokens: 512, stream: false });
    if (typeof result2 !== "object" || result2 === null || !("response" in result2) || typeof result2.response !== "string" || !result2.response.trim()) throw new Error("Workers AI returned no text");
    return { output: result2.response, tier: request.tier, freeOnly: true, billable: false, model, provider: "cloudflare-workers-ai" };
  }
  if (!env.OMNIROUTE_BASE_URL || !env.OMNIROUTE_API_KEY) {
    throw new Error("Model unavailable: OmniRoute credentials not configured");
  }
  if (request.freeOnly !== true || !request.tier) throw new Error("Model unavailable: verified free model tier required");
  const response = await fetch(new URL("/v1/route", env.OMNIROUTE_BASE_URL), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "authorization": `Bearer ${env.OMNIROUTE_API_KEY}`
    },
    body: JSON.stringify(request)
  });
  if (!response.ok) throw new Error(`OmniRoute failed: ${response.status}`);
  const result = await response.json();
  if (typeof result !== "object" || result === null || Array.isArray(result)) throw new Error("OmniRoute invalid response");
  const meta = result;
  if (meta.tier !== request.tier || meta.freeOnly !== true || meta.billable !== false || typeof meta.model !== "string" || !meta.model.trim()) throw new Error("OmniRoute did not attest free-only model tier; response rejected");
  return result;
}
__name(routeModel, "routeModel");

// src/orchestrator.ts
async function orchestrate(env, request) {
  const agent = selectAgent(request);
  const plan = chooseModel(agent, request);
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
    modelPlan: plan,
    note: "Tool execution is a separate authority-gated phase."
  };
}
__name(orchestrate, "orchestrate");

// src/storage.ts
var Store = class {
  constructor(db) {
    this.db = db;
  }
  db;
  static {
    __name(this, "Store");
  }
  async audit(type, data, ctx = {}) {
    await this.db.prepare("INSERT INTO audit_events(id,job_id,tenant_id,actor_id,type,data_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), ctx.jobId ?? null, ctx.tenantId ?? null, ctx.actorId ?? null, type, JSON.stringify(data), Date.now()).run();
  }
  async createJob(input) {
    const now = Date.now(), job = { ...input, id: crypto.randomUUID(), status: "queued", createdAt: now, updatedAt: now };
    await this.db.batch([
      this.db.prepare("INSERT INTO jobs(id,tenant_id,actor_id,request,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(job.id, job.tenantId, job.actorId, job.request, job.status, now, now),
      this.db.prepare("INSERT INTO audit_events(id,job_id,tenant_id,actor_id,type,data_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(), job.id, job.tenantId, job.actorId, "job.created", "{}", now)
    ]);
    return job;
  }
  async updateJob(id, status, agentId) {
    await this.db.prepare("UPDATE jobs SET status=?,agent_id=COALESCE(?,agent_id),updated_at=? WHERE id=?").bind(status, agentId ?? null, Date.now(), id).run();
  }
  async listJobs(tenantId, actorId) {
    const r = await this.db.prepare("SELECT id,tenant_id tenantId,actor_id actorId,request,status,agent_id agentId,created_at createdAt,updated_at updatedAt FROM jobs WHERE tenant_id=? AND actor_id=? ORDER BY created_at DESC LIMIT 100").bind(tenantId, actorId).all();
    return r.results;
  }
  async listAudit(tenantId, actorId) {
    const r = await this.db.prepare("SELECT id,job_id jobId,tenant_id tenantId,actor_id actorId,type,data_json dataJson,created_at createdAt FROM audit_events WHERE tenant_id=? AND actor_id=? ORDER BY seq DESC LIMIT 200").bind(tenantId, actorId).all();
    return r.results;
  }
  async createApproval(input) {
    const now = Date.now(), a = { approvalId: crypto.randomUUID(), tenantId: input.tenantId, actorId: input.actorId, toolId: input.toolId, jobId: input.jobId, status: "pending", argsHash: input.argsHash, createdAt: now, expiresAt: now + (input.ttlMs ?? 3e5) };
    await this.db.prepare("INSERT INTO approvals(id,tenant_id,actor_id,tool_id,job_id,status,args_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(a.approvalId, a.tenantId, a.actorId, a.toolId, a.jobId ?? null, a.status, a.argsHash, a.createdAt, a.expiresAt).run();
    await this.audit("approval.requested", { approvalId: a.approvalId, toolId: a.toolId }, { jobId: a.jobId, tenantId: a.tenantId, actorId: a.actorId });
    return a;
  }
  async decideApproval(id, decision, deciderActorId) {
    const row = await this.db.prepare("SELECT * FROM approvals WHERE id=?").bind(id).first();
    if (!row) return false;
    const now = Date.now();
    if (Number(row.expires_at) <= now) {
      await this.db.prepare("UPDATE approvals SET status='expired',decided_at=? WHERE id=?").bind(now, id).run();
      return false;
    }
    if (String(row.actor_id) !== deciderActorId || row.status !== "pending") return false;
    const result = await this.db.prepare("UPDATE approvals SET status=?,decided_at=? WHERE id=? AND status='pending'").bind(decision, now, id).run();
    if (result.meta.changes !== 1) return false;
    await this.audit("approval.decided", { approvalId: id, decision }, { jobId: row.job_id, tenantId: String(row.tenant_id), actorId: deciderActorId });
    return true;
  }
  async consumeApprovedAuthority(id, tenantId, actorId, toolId, argsHash) {
    const now = Date.now();
    const r = await this.db.prepare("UPDATE approvals SET status='consumed',decided_at=? WHERE id=? AND tenant_id=? AND actor_id=? AND tool_id=? AND args_hash=? AND status='approved' AND expires_at>?").bind(now, id, tenantId, actorId, toolId, argsHash, now).run();
    if (r.meta.changes !== 1) return false;
    await this.audit("approval.consumed", { approvalId: id, toolId }, { tenantId, actorId });
    return true;
  }
  async getApprovedAuthority(id, tenantId, actorId, toolId, argsHash) {
    const r = await this.db.prepare("SELECT id,tenant_id,actor_id,tool_id,expires_at,status FROM approvals WHERE id=? AND tenant_id=? AND actor_id=? AND tool_id=? AND args_hash=?").bind(id, tenantId, actorId, toolId, argsHash).first();
    if (!r || r.status !== "approved" || Number(r.expires_at) <= Date.now()) return void 0;
    return { approvalId: String(r.id), tenantId: String(r.tenant_id), actorId: String(r.actor_id), toolId: String(r.tool_id), expiresAt: Number(r.expires_at) };
  }
};

// src/index.ts
var json = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data, null, 2), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } }), "json");
var app = {
  async fetch(request, env) {
    const url = new URL(request.url), store = new Store(env.DB);
    const principal = founderPrincipal(request, env);
    if (request.method === "GET" && url.pathname === "/") return new Response(dashboardHtml(), { headers: { "content-type": "text/html;charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff", "referrer-policy": "no-referrer", "content-security-policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" } });
    if (url.pathname !== "/health" && !principal) return json({ error: "founder authentication required" }, 401);
    if (request.method === "GET" && url.pathname === "/health") return json({ ok: true, service: "8ora-agent-os", phase: 1, productionConnected: false, autonomousExecutionEnabled: false });
    if (request.method === "GET" && url.pathname === "/ready") {
      if (!principal) return json({ ready: false, error: "founder authentication required" }, 401);
      const authReady = Boolean(env.FOUNDER_API_TOKEN && env.FOUNDER_API_TOKEN.length >= 32 && env.FOUNDER_TENANT_ID && env.FOUNDER_ACTOR_ID);
      if (!authReady || !env.DB) return json({ ready: false, reason: "missing required bindings" }, 503);
      try {
        await env.DB.prepare("SELECT 1 FROM brain2_queue LIMIT 1").first();
        await env.DB.prepare("SELECT 1 FROM approvals LIMIT 1").first();
        return json({ ready: true, service: "8ora-agent-os", database: "ok", modelConfigured: Boolean(env.AI && env.WORKERS_AI_FREE_PLAN === "true" || env.OMNIROUTE_BASE_URL && env.OMNIROUTE_API_KEY), autonomousExecutionEnabled: false });
      } catch {
        return json({ ready: false, reason: "database migrations incomplete or unavailable" }, 503);
      }
    }
    if (request.method === "POST" && url.pathname === "/v1/brain2/emergency-pause") return json({ paused: await pauseQueue(env, principal.tenantId), warning: "In-flight external work cannot be cancelled by this operation" });
    if (request.method === "POST" && url.pathname === "/v1/brain2/queue") {
      const body = await request.json().catch(() => null);
      if (!body || !["iriskey", "8ora", "internal"].includes(body.pipeline ?? "") || !listAgents().some((a) => a.id === body.agentId) || body.task === void 0 || !Number.isFinite(body.dueAt) || body.dueAt < 0) return json({ error: "invalid queue task" }, 400);
      let serialized;
      try {
        serialized = JSON.stringify(body.task);
      } catch {
        return json({ error: "task must be JSON serializable" }, 400);
      }
      if (typeof serialized !== "string") return json({ error: "task must be JSON serializable" }, 400);
      if (serialized.length > 16384) return json({ error: "queue task exceeds 16 KiB limit" }, 413);
      const id = await enqueue(env, { tenantId: principal.tenantId, actorId: principal.actorId, pipeline: body.pipeline, agentId: body.agentId, task: body.task, dueAt: body.dueAt });
      return json({ id, status: "queued", executionEnabled: false }, 202);
    }
    if (request.method === "GET" && url.pathname === "/v1/brain2/incidents/critical-feed") return json(await criticalIncidentFeed(env, principal.tenantId));
    if (request.method === "GET" && url.pathname === "/v1/brain2/incidents") return json(await listOpenIncidents(env, principal.tenantId));
    const incidentAck = url.pathname.split("/").filter(Boolean);
    if (request.method === "POST" && incidentAck.length === 5 && incidentAck[0] === "v1" && incidentAck[1] === "brain2" && incidentAck[2] === "incidents" && incidentAck[4] === "acknowledge") return json({ ok: await acknowledgeIncident(env, principal.tenantId, incidentAck[3]) });
    if (request.method === "POST" && incidentAck.length === 5 && incidentAck[0] === "v1" && incidentAck[1] === "brain2" && incidentAck[2] === "incidents" && incidentAck[4] === "resolve") return json({ ok: await resolveIncident(env, principal.tenantId, incidentAck[3]) });
    if (request.method === "GET" && url.pathname === "/v1/brain2/queue/health") return json(await queueHealth(env, principal.tenantId));
    if (request.method === "GET" && url.pathname === "/v1/agents") return json(listAgents());
    if (request.method === "GET" && url.pathname === "/v1/tools") return json(listTools());
    if (request.method === "GET" && url.pathname === "/v1/jobs") return json(await store.listJobs(principal.tenantId, principal.actorId));
    if (request.method === "GET" && url.pathname === "/v1/audit") return json(await store.listAudit(principal.tenantId, principal.actorId));
    if (request.method === "POST" && url.pathname === "/v1/tasks") {
      const body = await request.json().catch(() => null);
      if (!body || typeof body.request !== "string" || !body.request.trim() || body.request.length > 16e3) return json({ error: "request must contain 1\u201316000 characters" }, 400);
      if (body.tenantId !== void 0 && body.tenantId !== principal.tenantId || body.actorId !== void 0 && body.actorId !== principal.actorId) return json({ error: "principal mismatch" }, 403);
      const job = await store.createJob({ request: body.request, tenantId: principal.tenantId, actorId: principal.actorId });
      try {
        const result = await orchestrate(env, body.request);
        await store.updateJob(job.id, "planned", result.agent.id);
        await store.audit("orchestration.planned", { agent: result.agent }, { jobId: job.id, tenantId: job.tenantId, actorId: job.actorId });
        return json({ jobId: job.id, ...result }, 202);
      } catch (error) {
        await store.updateJob(job.id, "failed");
        await store.audit("orchestration.failed", { error: error instanceof Error ? error.message : "unknown" }, { jobId: job.id, tenantId: job.tenantId, actorId: job.actorId });
        return json({ jobId: job.id, error: "orchestration failed" }, 502);
      }
    }
    if (request.method === "POST" && url.pathname === "/v1/approvals") {
      const body = await request.json();
      if (!body.proposal) return json({ error: "proposal is required" }, 400);
      if (body.proposal.tenantId !== principal.tenantId || body.proposal.actorId !== principal.actorId) return json({ error: "principal mismatch" }, 403);
      const tool = listTools().find((t) => t.id === body.proposal.toolId);
      if (!tool) return json({ error: "unknown tool fails closed" }, 403);
      if (tool.permission === "BLOCKED") return json({ error: "tool is blocked" }, 403);
      const approval = await store.createApproval({ ...body.proposal, jobId: body.jobId, argsHash: await hashArgs(body.proposal.args) });
      return json(approval, 202);
    }
    const approvalMatch = url.pathname.match(/^\/v1\/approvals\/([^/]+)\/(approve|deny)$/);
    if (request.method === "POST" && approvalMatch) {
      const body = await request.json();
      if (body.actorId !== principal.actorId) return json({ error: "principal mismatch" }, 403);
      const ok = await store.decideApproval(approvalMatch[1], approvalMatch[2] === "approve" ? "approved" : "denied", body.actorId);
      return json({ ok }, ok ? 200 : 403);
    }
    if (request.method === "POST" && url.pathname === "/v1/authority/check") {
      const body = await request.json();
      if (!body.proposal) return json({ error: "proposal is required" }, 400);
      if (body.proposal.tenantId !== principal.tenantId || body.proposal.actorId !== principal.actorId) return json({ error: "principal mismatch" }, 403);
      const authority = body.approvalId ? await store.getApprovedAuthority(body.approvalId, principal.tenantId, principal.actorId, body.proposal.toolId, await hashArgs(body.proposal.args)) : void 0;
      const decision = authorize(body.proposal, authority);
      return json(decision, decision.allowed ? 200 : 403);
    }
    return json({ error: "not found" }, 404);
  },
  async scheduled(_event, env) {
    if (env.BRAIN2_DEPLOYMENT_CHECK_ID) await deploymentCheck((request) => app.fetch(request, env), env);
    if (!env.FOUNDER_TENANT_ID || !env.FOUNDER_ACTOR_ID || !env.FOUNDER_API_TOKEN || env.FOUNDER_API_TOKEN.length < 32) return;
    try {
      const recovered = await recoverExpired(env, env.FOUNDER_TENANT_ID);
      if (recovered.dead > 0) await reportIncident(env, { tenantId: env.FOUNDER_TENANT_ID, pipeline: "internal", fingerprint: "recovery-dead-letter", severity: "critical", category: "queue-recovery", summary: "Brain 2 jobs exhausted their retries", details: recovered });
    } catch (error) {
      await reportIncident(env, { tenantId: env.FOUNDER_TENANT_ID, pipeline: "internal", fingerprint: "recovery-error", severity: "critical", category: "scheduler", summary: "Brain 2 scheduled recovery failed", details: { error: error instanceof Error ? error.message : "unknown" } }).catch(() => {
      });
      throw error;
    }
  }
};
var index_default = app;
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
