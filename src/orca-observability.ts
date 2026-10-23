import {listOpenIncidents} from "./brain2-incidents";
import {queueHealth} from "./brain2-queue";
import type {FounderPrincipal} from "./founder-auth";
import {listAgents} from "./registry";
import {Store} from "./storage";
import type {Env} from "./types";

/** Founder-only read-only snapshot. Caller must authenticate first. */
export async function readOrcaOverview(env:Env,principal:FounderPrincipal,now=Date.now()){
 if(!env.DB)throw new Error("database unavailable");
 const store=new Store(env.DB);
 const [queue,incidents,jobs,audit,pending]=await Promise.all([
  queueHealth(env,principal.tenantId),
  listOpenIncidents(env,principal.tenantId),
  store.listJobs(principal.tenantId,principal.actorId),
  store.listAudit(principal.tenantId,principal.actorId),
  env.DB.prepare("SELECT COUNT(*) AS count FROM approvals WHERE tenant_id=? AND actor_id=? AND status='pending' AND expires_at>?")
   .bind(principal.tenantId,principal.actorId,now).first<{count:number}>()
 ]);
 return {
  observedAt:now,mode:"read-only",
  brain1:{integrationStatus:"not-connected",runtimeStatus:"unknown"},
  brain2:{apiStatus:"responding-to-authenticated-request",modelStatus:"unverified",autonomousExecutionEnabled:false,schedulerPurpose:"queue-recovery-only"},
  agentRegistry:{declaredCount:listAgents().length,agents:listAgents().map(a=>({id:a.id,name:a.name,division:a.division,capabilities:a.capabilities,runtimeStatus:"not-verified"}))},
  queueCounts:queue,
  pendingApprovals:Number(pending?.count??0),
  openIncidents:incidents.slice(0,20).map(row=>({id:row.id,pipeline:row.pipeline,severity:row.severity,category:row.category,summary:row.summary,occurrences:row.occurrences,lastSeenAt:row.lastSeenAt})),
  recentJobs:jobs.slice(0,20).map(row=>({id:row.id,status:row.status,agentId:row.agentId??null,createdAt:row.createdAt,updatedAt:row.updatedAt})),
  recentAudit:audit.slice(0,20).map((row:Record<string,unknown>)=>({id:row.id,type:row.type,jobId:row.jobId,createdAt:row.createdAt}))
 };
}
