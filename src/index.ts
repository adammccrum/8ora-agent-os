import {authorize} from "./authority";
import {listOpenIncidents,acknowledgeIncident,reportIncident} from "./brain2-incidents";
import {recoverExpired,queueHealth,enqueue} from "./brain2-queue";
import {founderPrincipal} from "./founder-auth";
import {dashboardHtml} from "./dashboard";
import {hashArgs} from "./hash";
import {orchestrate} from "./orchestrator";
import {listAgents,listTools} from "./registry";
import {Store} from "./storage";
import type {ActionProposal,Env} from "./types";
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});

export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),store=new Store(env.DB);
 const principal=founderPrincipal(request,env);
 if(url.pathname!=="/health"&&!principal)return json({error:"founder authentication required"},401);
 if(request.method==="GET"&&url.pathname==="/")return new Response(dashboardHtml(),{headers:{"content-type":"text/html;charset=utf-8"}});
 if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"8ora-agent-os",phase:1,persistence:"D1",productionConnected:false});
 if(request.method==="POST"&&url.pathname==="/v1/brain2/queue"){
  const body=await request.json<{pipeline?:string;agentId?:string;task?:unknown;dueAt?:number}>().catch(()=>null);
  if(!body||!["iriskey","8ora","internal"].includes(body.pipeline??"")||!listAgents().some(a=>a.id===body.agentId)||body.task===undefined||!Number.isFinite(body.dueAt)||body.dueAt! < 0)return json({error:"invalid queue task"},400);
  const id=await enqueue(env,{tenantId:principal!.tenantId,actorId:principal!.actorId,pipeline:body.pipeline as "iriskey"|"8ora"|"internal",agentId:body.agentId!,task:body.task,dueAt:body.dueAt!});
  return json({id,status:"queued",executionEnabled:false},202);
 }
 if(request.method==="GET"&&url.pathname==="/v1/brain2/incidents")return json(await listOpenIncidents(env,principal!.tenantId));
 const incidentAck=url.pathname.match(/^\\/v1\\/brain2\\/incidents\\/([^/]+)\\/acknowledge$/);
 if(request.method==="POST"&&incidentAck)return json({ok:await acknowledgeIncident(env,principal!.tenantId,incidentAck[1])});
 if(request.method==="GET"&&url.pathname==="/v1/brain2/queue/health")return json(await queueHealth(env,principal!.tenantId));
 if(request.method==="GET"&&url.pathname==="/v1/agents")return json(listAgents());
 if(request.method==="GET"&&url.pathname==="/v1/tools")return json(listTools());
 if(request.method==="GET"&&url.pathname==="/v1/jobs")return json(await store.listJobs(principal!.tenantId,principal!.actorId));
 if(request.method==="GET"&&url.pathname==="/v1/audit")return json(await store.listAudit(principal!.tenantId,principal!.actorId));

 if(request.method==="POST"&&url.pathname==="/v1/tasks"){
  const body=await request.json<{request?:string;tenantId?:string;actorId?:string}>();
  if(!body.request||body.tenantId!==principal!.tenantId||body.actorId!==principal!.actorId)return json({error:"request, tenantId and actorId are required"},400);
  const job=await store.createJob({request:body.request,tenantId:body.tenantId,actorId:body.actorId});
  try{const result=await orchestrate(env,body.request);await store.updateJob(job.id,"planned",result.agent.id);await store.audit("orchestration.planned",{agent:result.agent},{jobId:job.id,tenantId:job.tenantId,actorId:job.actorId});return json({jobId:job.id,...result},202)}
  catch(error){await store.updateJob(job.id,"failed");await store.audit("orchestration.failed",{error:error instanceof Error?error.message:"unknown"},{jobId:job.id,tenantId:job.tenantId,actorId:job.actorId});return json({jobId:job.id,error:"orchestration failed"},502)}
 }

 if(request.method==="POST"&&url.pathname==="/v1/approvals"){
  const body=await request.json<{proposal?:ActionProposal;jobId?:string}>();
  if(!body.proposal)return json({error:"proposal is required"},400);
  if(body.proposal.tenantId!==principal!.tenantId||body.proposal.actorId!==principal!.actorId)return json({error:"principal mismatch"},403);
  const tool=listTools().find(t=>t.id===body.proposal!.toolId);
  if(!tool)return json({error:"unknown tool fails closed"},403);
  if(tool.permission==="BLOCKED")return json({error:"tool is blocked"},403);
  const approval=await store.createApproval({...body.proposal,jobId:body.jobId,argsHash:await hashArgs(body.proposal.args)});
  return json(approval,202);
 }

 const approvalMatch=url.pathname.match(/^\/v1\/approvals\/([^/]+)\/(approve|deny)$/);
 if(request.method==="POST"&&approvalMatch){
  const body=await request.json<{actorId?:string}>();
  if(body.actorId!==principal!.actorId)return json({error:"principal mismatch"},403);
  const ok=await store.decideApproval(approvalMatch[1],approvalMatch[2]==="approve"?"approved":"denied",body.actorId);
  return json({ok},ok?200:403);
 }

 if(request.method==="POST"&&url.pathname==="/v1/authority/check"){
  const body=await request.json<{proposal?:ActionProposal;approvalId?:string}>();
  if(!body.proposal)return json({error:"proposal is required"},400);
  if(body.proposal.tenantId!==principal!.tenantId||body.proposal.actorId!==principal!.actorId)return json({error:"principal mismatch"},403);
  const authority=body.approvalId?await store.getApprovedAuthority(body.approvalId):undefined;
  const decision=authorize(body.proposal,authority);
  if(decision.allowed&&authority){
   const consumed=await store.consumeApprovedAuthority(authority.approvalId,principal!.tenantId,principal!.actorId,body.proposal.toolId,await hashArgs(body.proposal.args));
   if(!consumed)return json({allowed:false,reason:"Approval expired, mismatched or already used",approvalRequired:true},403);
  }
  return json(decision,decision.allowed?200:403);
 }
 return json({error:"not found"},404);
},
async scheduled(_event:ScheduledEvent,env:Env):Promise<void>{
 // Recovery only. Autonomous execution remains disabled until end-to-end authority tests pass.
 if(!env.FOUNDER_TENANT_ID||!env.FOUNDER_ACTOR_ID||!env.FOUNDER_API_TOKEN||env.FOUNDER_API_TOKEN.length<32)return;
 try{
  const recovered=await recoverExpired(env,env.FOUNDER_TENANT_ID);
  if(recovered.dead>0)await reportIncident(env,{tenantId:env.FOUNDER_TENANT_ID,pipeline:"internal",fingerprint:"recovery-dead-letter",severity:"critical",category:"queue-recovery",summary:"Brain 2 jobs exhausted their retries",details:recovered});
 }catch(error){
  // A failed incident write must still fail the scheduled invocation for platform observability.
  await reportIncident(env,{tenantId:env.FOUNDER_TENANT_ID,pipeline:"internal",fingerprint:"recovery-error",severity:"critical",category:"scheduler",summary:"Brain 2 scheduled recovery failed",details:{error:error instanceof Error?error.message:"unknown"}}).catch(()=>{});
  throw error;
 }
}
};