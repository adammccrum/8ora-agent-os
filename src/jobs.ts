export type JobStatus="queued"|"planned"|"awaiting-approval"|"completed"|"failed";
export interface Job { id:string; tenantId:string; actorId:string; request:string; status:JobStatus; agentId?:string; createdAt:number; updatedAt:number; }
export interface AuditEvent { id:string; jobId?:string; type:string; at:number; data:unknown; }

const jobs=new Map<string,Job>();
const audit:AuditEvent[]=[];

export function createJob(input:Omit<Job,"id"|"status"|"createdAt"|"updatedAt">):Job{
  const now=Date.now(); const job={...input,id:crypto.randomUUID(),status:"queued" as const,createdAt:now,updatedAt:now};
  jobs.set(job.id,job); appendAudit("job.created",{tenantId:job.tenantId,actorId:job.actorId},job.id); return job;
}
export function updateJob(id:string,patch:Partial<Job>){ const j=jobs.get(id); if(!j)return; Object.assign(j,patch,{updatedAt:Date.now()}); appendAudit("job.updated",{status:j.status},id); }
export function listJobs(){return [...jobs.values()].sort((a,b)=>b.createdAt-a.createdAt);}
export function appendAudit(type:string,data:unknown,jobId?:string){audit.push({id:crypto.randomUUID(),jobId,type,at:Date.now(),data});}
export function listAudit(){return audit.slice().reverse();}
