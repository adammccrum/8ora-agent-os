import {authorize} from "./authority";
import {dashboardHtml} from "./dashboard";
import {hashArgs} from "./hash";
import {orchestrate} from "./orchestrator";
import {listAgents,listTools} from "./registry";
import {Store} from "./storage";
import type {ActionProposal,Env} from "./types";
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});

export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),store=new Store(env.DB);
 if(request.method==="GET"&&url.pathname==="/")return new Response(dashboardHtml(),{headers:{"content-type":"text/html;charset=utf-8"}});
 if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"8ora-agent-os",phase:1,persistence:"D1",productionConnected:false});
 if(request.method==="GET"&&url.pathname==="/v1/agents")return json(listAgents());
 if(request.method==="GET"&&url.pathname==="/v1/tools")return json(listTools());
 if(request.method==="GET"&&url.pathname==="/v1/jobs")return json(await store.listJobs());
 if(request.method==="GET"&&url.pathname==="/v1/audit")return json(await store.listAudit());

 if(request.method==="POST"&&url.pathname==="/v1/tasks"){
  const body=await request.json<{request?:string;tenantId?:string;actorId?:string}>();
  if(!body.request||!body.tenantId||!body.actorId)return json({error:"request, tenantId and actorId are required"},400);
  const job=await store.createJob({request:body.request,tenantId:body.tenantId,actorId:body.actorId});
  try{const result=await orchestrate(env,body.request);await store.updateJob(job.id,"planned",result.agent.id);await store.audit("orchestration.planned",{agent:result.agent},{jobId:job.id,tenantId:job.tenantId,actorId:job.actorId});return json({jobId:job.id,...result},202)}
  catch(error){await store.updateJob(job.id,"failed");await store.audit("orchestration.failed",{error:error instanceof Error?error.message:"unknown"},{jobId:job.id,tenantId:job.tenantId,actorId:job.actorId});return json({jobId:job.id,error:"orchestration failed"},502)}
 }

 if(request.method==="POST"&&url.pathname==="/v1/approvals"){
  const body=await request.json<{proposal?:ActionProposal;jobId?:string}>();
  if(!body.proposal)return json({error:"proposal is required"},400);
  const tool=listTools().find(t=>t.id===body.proposal!.toolId);
  if(!tool)return json({error:"unknown tool fails closed"},403);
  if(tool.permission==="BLOCKED")return json({error:"tool is blocked"},403);
  const approval=await store.createApproval({...body.proposal,jobId:body.jobId,argsHash:await hashArgs(body.proposal.args)});
  return json(approval,202);
 }

 const approvalMatch=url.pathname.match(/^\/v1\/approvals\/([^/]+)\/(approve|deny)$/);
 if(request.method==="POST"&&approvalMatch){
  const body=await request.json<{actorId?:string}>();
  if(!body.actorId)return json({error:"actorId is required"},400);
  const ok=await store.decideApproval(approvalMatch[1],approvalMatch[2]==="approve"?"approved":"denied",body.actorId);
  return json({ok},ok?200:403);
 }

 if(request.method==="POST"&&url.pathname==="/v1/authority/check"){
  const body=await request.json<{proposal?:ActionProposal;approvalId?:string}>();
  if(!body.proposal)return json({error:"proposal is required"},400);
  const authority=body.approvalId?await store.getApprovedAuthority(body.approvalId):undefined;
  const decision=authorize(body.proposal,authority);
  if(decision.allowed&&authority){
   const approval=await env.DB.prepare("SELECT args_hash argsHash FROM approvals WHERE id=?").bind(authority.approvalId).first<{argsHash:string}>();
   if(!approval||approval.argsHash!==await hashArgs(body.proposal.args))return json({allowed:false,reason:"Approved action arguments do not match",approvalRequired:true},403);
  }
  return json(decision,decision.allowed?200:403);
 }
 return json({error:"not found"},404);
}};