import type { Authority } from "./types";
export type JobStatus="queued"|"planned"|"awaiting-approval"|"completed"|"failed";
export interface Job {id:string;tenantId:string;actorId:string;request:string;status:JobStatus;agentId?:string;createdAt:number;updatedAt:number}
export interface ApprovalRecord extends Authority {jobId?:string;status:"pending"|"approved"|"denied"|"expired"|"consumed";argsHash:string;createdAt:number;decidedAt?:number}

export class Store {
 constructor(private db:D1Database){}
 async audit(type:string,data:unknown,ctx:{jobId?:string;tenantId?:string;actorId?:string}={}){
  await this.db.prepare("INSERT INTO audit_events(id,job_id,tenant_id,actor_id,type,data_json,created_at) VALUES(?,?,?,?,?,?,?)")
   .bind(crypto.randomUUID(),ctx.jobId??null,ctx.tenantId??null,ctx.actorId??null,type,JSON.stringify(data),Date.now()).run();
 }
 async createJob(input:{tenantId:string;actorId:string;request:string}):Promise<Job>{
  const now=Date.now(),job:Job={...input,id:crypto.randomUUID(),status:"queued",createdAt:now,updatedAt:now};
  await this.db.batch([
   this.db.prepare("INSERT INTO jobs(id,tenant_id,actor_id,request,status,created_at,updated_at) VALUES(?,?,?,?,?,?,?)").bind(job.id,job.tenantId,job.actorId,job.request,job.status,now,now),
   this.db.prepare("INSERT INTO audit_events(id,job_id,tenant_id,actor_id,type,data_json,created_at) VALUES(?,?,?,?,?,?,?)").bind(crypto.randomUUID(),job.id,job.tenantId,job.actorId,"job.created","{}",now)
  ]); return job;
 }
 async updateJob(id:string,status:JobStatus,agentId?:string){await this.db.prepare("UPDATE jobs SET status=?,agent_id=COALESCE(?,agent_id),updated_at=? WHERE id=?").bind(status,agentId??null,Date.now(),id).run();}
 async listJobs(){const r=await this.db.prepare("SELECT id,tenant_id tenantId,actor_id actorId,request,status,agent_id agentId,created_at createdAt,updated_at updatedAt FROM jobs ORDER BY created_at DESC LIMIT 100").all<Job>();return r.results;}
 async listAudit(){const r=await this.db.prepare("SELECT id,job_id jobId,tenant_id tenantId,actor_id actorId,type,data_json dataJson,created_at createdAt FROM audit_events ORDER BY seq DESC LIMIT 200").all();return r.results;}
 async createApproval(input:{tenantId:string;actorId:string;toolId:string;jobId?:string;argsHash:string;ttlMs?:number}):Promise<ApprovalRecord>{
  const now=Date.now(),a:ApprovalRecord={approvalId:crypto.randomUUID(),tenantId:input.tenantId,actorId:input.actorId,toolId:input.toolId,jobId:input.jobId,status:"pending",argsHash:input.argsHash,createdAt:now,expiresAt:now+(input.ttlMs??300000)};
  await this.db.prepare("INSERT INTO approvals(id,tenant_id,actor_id,tool_id,job_id,status,args_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?,?)").bind(a.approvalId,a.tenantId,a.actorId,a.toolId,a.jobId??null,a.status,a.argsHash,a.createdAt,a.expiresAt).run();
  await this.audit("approval.requested",{approvalId:a.approvalId,toolId:a.toolId},{jobId:a.jobId,tenantId:a.tenantId,actorId:a.actorId}); return a;
 }
 async decideApproval(id:string,decision:"approved"|"denied",deciderActorId:string){
  const row=await this.db.prepare("SELECT * FROM approvals WHERE id=?").bind(id).first<Record<string,unknown>>();
  if(!row) return false;
  const now=Date.now(); if(Number(row.expires_at)<=now) {await this.db.prepare("UPDATE approvals SET status='expired',decided_at=? WHERE id=?").bind(now,id).run();return false;}
  if(String(row.actor_id)!==deciderActorId) return false;
  await this.db.prepare("UPDATE approvals SET status=?,decided_at=? WHERE id=? AND status='pending'").bind(decision,now,id).run();
  await this.audit("approval.decided",{approvalId:id,decision},{jobId:row.job_id as string|undefined,tenantId:String(row.tenant_id),actorId:deciderActorId}); return true;
 }
 async getApprovedAuthority(id:string):Promise<Authority|undefined>{
  const r=await this.db.prepare("SELECT id,tenant_id,actor_id,tool_id,expires_at,status FROM approvals WHERE id=?").bind(id).first<Record<string,unknown>>();
  if(!r||r.status!=="approved"||Number(r.expires_at)<=Date.now()) return undefined;
  return {approvalId:String(r.id),tenantId:String(r.tenant_id),actorId:String(r.actor_id),toolId:String(r.tool_id),expiresAt:Number(r.expires_at)};
 }
}
