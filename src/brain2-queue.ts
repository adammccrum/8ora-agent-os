import type {Env} from "./types";
export type Pipeline="iriskey"|"8ora"|"internal";
export interface QueueTask {id:string;tenantId:string;actorId:string;pipeline:Pipeline;agentId:string;task:unknown;dueAt:number}
export async function enqueue(env:Env,input:Omit<QueueTask,"id">):Promise<string>{
 const id=crypto.randomUUID(),now=Date.now();
 await env.DB.prepare("INSERT INTO brain2_queue(id,tenant_id,actor_id,pipeline,agent_id,task_json,due_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(id,input.tenantId,input.actorId,input.pipeline,input.agentId,JSON.stringify(input.task),input.dueAt,now,now).run();
 return id;
}
export async function claimDue(env:Env,tenantId:string,now=Date.now()):Promise<string|undefined>{
 const row=await env.DB.prepare("SELECT id FROM brain2_queue WHERE tenant_id=? AND ((status='queued' AND due_at<=?) OR (status='leased' AND lease_until<=?)) AND attempts<max_attempts ORDER BY due_at LIMIT 1").bind(tenantId,now,now).first<{id:string}>();
 if(!row)return undefined;
 const updated=await env.DB.prepare("UPDATE brain2_queue SET status='leased',attempts=attempts+1,lease_until=?,updated_at=? WHERE id=? AND tenant_id=? AND ((status='queued' AND due_at<=?) OR (status='leased' AND lease_until<=?)) AND attempts<max_attempts").bind(now+120000,now,row.id,tenantId,now,now).run();
 return updated.meta.changes===1?row.id:undefined;
}
export async function completeTask(env:Env,id:string,tenantId:string,actorId:string,success:boolean,error?:string):Promise<boolean>{
 const now=Date.now();
 const row=await env.DB.prepare("SELECT attempts,max_attempts FROM brain2_queue WHERE id=? AND tenant_id=? AND actor_id=? AND status='leased'").bind(id,tenantId,actorId).first<{attempts:number;max_attempts:number}>();
 if(!row)return false;
 const status=success?"completed":row.attempts>=row.max_attempts?"dead":"queued";
 const delay=success?0:Math.min(3600000,30000*2**Math.max(0,row.attempts-1));
 const updated=await env.DB.prepare("UPDATE brain2_queue SET status=?,due_at=?,lease_until=NULL,last_error=?,updated_at=? WHERE id=? AND tenant_id=? AND actor_id=? AND status='leased'").bind(status,now+delay,error??null,now,id,tenantId,actorId).run();
 if(updated.meta.changes!==1)return false;
 await env.DB.prepare("INSERT INTO brain2_runs(id,queue_id,tenant_id,started_at,finished_at,outcome,details_json) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),id,tenantId,now,now,status,JSON.stringify({error:error??null})).run();
 return true;
}

/** Recover orphaned leases and exhaust retries without executing external actions. */
export async function recoverExpired(env:Env,tenantId:string,now=Date.now()):Promise<{requeued:number;dead:number}>{
 const dead=await env.DB.prepare("UPDATE brain2_queue SET status='dead',lease_until=NULL,last_error='lease expired: attempts exhausted',updated_at=? WHERE tenant_id=? AND status='leased' AND lease_until<=? AND attempts>=max_attempts").bind(now,tenantId,now).run();
 const requeued=await env.DB.prepare("UPDATE brain2_queue SET status='queued',lease_until=NULL,due_at=?,last_error='lease expired: retry scheduled',updated_at=? WHERE tenant_id=? AND status='leased' AND lease_until<=? AND attempts<max_attempts").bind(now+30000,now,tenantId,now).run();
 return {requeued:requeued.meta.changes??0,dead:dead.meta.changes??0};
}
/** Queue health only; deliberately does not call an LLM or perform any external action. */
export async function queueHealth(env:Env,tenantId:string){
 const result=await env.DB.prepare("SELECT pipeline,status,COUNT(*) count FROM brain2_queue WHERE tenant_id=? GROUP BY pipeline,status").bind(tenantId).all<{pipeline:Pipeline;status:string;count:number}>();
 return result.results;
}
