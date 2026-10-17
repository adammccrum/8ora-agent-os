import type {Env} from "./types";
import type {Pipeline} from "./brain2-queue";
export type Severity="warning"|"critical";
export interface IncidentInput {tenantId:string;pipeline:Pipeline;queueId?:string;fingerprint:string;severity:Severity;category:string;summary:string;details?:unknown}
export async function reportIncident(env:Env,input:IncidentInput):Promise<void>{
 const now=Date.now();
 await env.DB.prepare(`INSERT INTO brain2_incidents(id,tenant_id,pipeline,queue_id,fingerprint,severity,category,summary,details_json,first_seen_at,last_seen_at)
 VALUES(?,?,?,?,?,?,?,?,?,?,?)
 ON CONFLICT(tenant_id,pipeline,fingerprint) DO UPDATE SET
 occurrences=occurrences+1,last_seen_at=excluded.last_seen_at,
 severity=excluded.severity,category=excluded.category,summary=excluded.summary,details_json=excluded.details_json,
 status='open',acknowledged_at=NULL,resolved_at=NULL`).bind(
 crypto.randomUUID(),input.tenantId,input.pipeline,input.queueId??null,input.fingerprint,input.severity,input.category,input.summary,
 JSON.stringify(input.details??{}),now,now).run();
}
export async function listOpenIncidents(env:Env,tenantId:string){
 const result=await env.DB.prepare("SELECT id,pipeline,queue_id queueId,severity,category,summary,occurrences,first_seen_at firstSeenAt,last_seen_at lastSeenAt,status FROM brain2_incidents WHERE tenant_id=? AND status='open' ORDER BY CASE severity WHEN 'critical' THEN 0 ELSE 1 END,last_seen_at DESC LIMIT 100").bind(tenantId).all();
 return result.results;
}
export async function acknowledgeIncident(env:Env,tenantId:string,id:string){
 const result=await env.DB.prepare("UPDATE brain2_incidents SET status='acknowledged',acknowledged_at=? WHERE id=? AND tenant_id=? AND status='open'").bind(Date.now(),id,tenantId).run();
 return result.meta.changes===1;
}
