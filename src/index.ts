import {authorize} from "./authority";
import {dashboardHtml} from "./dashboard";
import {hashArgs} from "./hash";
import {orchestrate} from "./orchestrator";
import {listAgents,listTools} from "./registry";
import {Store} from "./storage";
import type {ActionProposal,Env} from "./types";
const json=(data:unknown,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});
const OWNER="founder", TENANT="iriskey-internal";
async function tokenMatches(actual:string,expected:string):Promise<boolean>{
 const enc=new TextEncoder();
 const [a,b]=await Promise.all([crypto.subtle.digest("SHA-256",enc.encode(actual)),crypto.subtle.digest("SHA-256",enc.encode(expected))]);
 const x=new Uint8Array(a),y=new Uint8Array(b);let diff=0;
 for(let i=0;i<x.length;i++)diff|=x[i]^y[i];
 return diff===0;
}
export default {async fetch(request:Request,env:Env):Promise<Response>{
 const url=new URL(request.url),store=new Store(env.DB);
 if(request.method==="GET"&&url.pathname==="/health")return json({ok:true,service:"8ora-agent-os",phase:1});
 // Development-only founder token; fails closed if missing. Do not deploy without a secret.
 const secret=env.FOUNDER_API_TOKEN;
 const supplied=request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
 if(!secret||!supplied||!(await tokenMatches(supplied,secret)))return json({error:"unauthorized"},401);
 if(request.method==="GET"&&url.pathname==="/")return new Response(dashboardHtml(),{headers:{"content-type":"text/html;charset=utf-8","cache-control":"no-store"}});
 if(request.method==="GET"&&url.pathname==="/v1/agents")return json(listAgents());
 if(request.method==="GET"&&url.pathname==="/v1/tools")return json(listTools());
 if(request.method==="GET"&&url.pathname==="/v1/jobs")return json(await store.listJobs(TENANT));
 if(request.method==="GET"&&url.pathname==="/v1/audit")return json(await store.listAudit(TENANT));
 if(request.method==="POST"&&url.pathname==="/v1/tasks"){
  const body=await request.json<{request?:string}>();
  if(typeof body.request!=="string"||!body.request.trim()||body.request.length>4000)return json({error:"invalid request"},400);
  const job=await store.createJob({request:body.request,tenantId:TENANT,actorId:OWNER});
  try{const result=await orchestrate(env,body.request);await store.updateJob(job.id,"planned",result.agent.id);await store.audit("orchestration.planned",{agent:result.agent},{jobId:job.id,tenantId:TENANT,actorId:OWNER});return json({jobId:job.id,...result},202)}
  catch(error){await store.updateJob(job.id,"failed");await store.audit("orchestration.failed",{error:"model route failed"},{jobId:job.id,tenantId:TENANT,actorId:OWNER});return json({jobId:job.id,error:"orchestration failed"},502)}
 }
 if(request.method==="POST"&&url.pathname==="/v1/approvals"){
  const body=await request.json<{proposal?:ActionProposal;jobId?:string}>();
  if(!body.proposal||typeof body.proposal.toolId!=="string")return json({error:"invalid proposal"},400);
  const tool=listTools().find(t=>t.id===body.proposal!.toolId);
  if(!tool||tool.permission==="BLOCKED")return json({error:"tool not permitted"},403);
  const approval=await store.createApproval({tenantId:TENANT,actorId:OWNER,toolId:tool.id,jobId:body.jobId,argsHash:await hashArgs(body.proposal.args)});
  return json(approval,202);
 }
 const match=url.pathname.match(/^\/v1\/approvals\/([^/]+)\/(approve|deny)$/);
 if(request.method==="POST"&&match){
  const ok=await store.decideApproval(match[1],match[2]==="approve"?"approved":"denied",OWNER,TENANT);
  return json({ok},ok?200:403);
 }
 if(request.method==="POST"&&url.pathname==="/v1/authority/check"){
  const body=await request.json<{proposal?:ActionProposal;approvalId?:string}>();
  if(!body.proposal)return json({error:"proposal required"},400);
  const proposal={...body.proposal,tenantId:TENANT,actorId:OWNER};
  const tool=listTools().find(t=>t.id===proposal.toolId);
  if(!tool||tool.permission==="BLOCKED")return json({allowed:false,reason:"Tool unavailable"},403);
  if(tool.permission==="READ")return json({allowed:true,reason:"Read-only capability"},200);
  if(!body.approvalId)return json({allowed:false,reason:"Approval required"},403);
  const argsHash=await hashArgs(proposal.args);
  const now=Date.now();
  // One-use atomic consume: the database, not the caller, decides whether authority exists.
  const consumed=await env.DB.prepare(
   "UPDATE approvals SET status='consumed' WHERE id=? AND tenant_id=? AND actor_id=? AND tool_id=? AND args_hash=? AND status='approved' AND expires_at>?"
  ).bind(body.approvalId,TENANT,OWNER,proposal.toolId,argsHash,now).run();
  if(consumed.meta.changes!==1)return json({allowed:false,reason:"Approval missing, expired, mismatched or already used"},403);
  await store.audit("approval.consumed",{approvalId:body.approvalId,toolId:proposal.toolId},{tenantId:TENANT,actorId:OWNER});
  return json({allowed:true,reason:"One-use authority consumed"},200);
 }
 return json({error:"not found"},404);
}};