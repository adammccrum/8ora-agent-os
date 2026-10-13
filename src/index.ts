import {dashboardHtml} from "./dashboard";
import {buildMarketingDrafts} from "./marketing-drafts";
import {orchestrate} from "./orchestrator";
import {listAgents,listTools} from "./registry";
import {Store} from "./storage";
import type {Env} from "./types";
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
 if(request.method==="GET"&&url.pathname==="/v1/marketing/drafts")return json({drafts:buildMarketingDrafts(),status:"draft-only",published:false});
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
 if(request.method==="POST"&&url.pathname.startsWith("/v1/approvals"))return json({error:"Approvals disabled in draft-only staging"},403);
 if(request.method==="POST"&&url.pathname==="/v1/authority/check"){
  const body=await request.json<{proposal?:ActionProposal;approvalId?:string}>();
  if(!body.proposal)return json({error:"proposal required"},400);
  const proposal={...body.proposal,tenantId:TENANT,actorId:OWNER};
  const tool=listTools().find(t=>t.id===proposal.toolId);
  if(!tool||tool.permission==="BLOCKED")return json({allowed:false,reason:"Tool unavailable"},403);
  if(tool.permission==="READ")return json({allowed:true,reason:"Read-only capability"},200);
  return json({allowed:false,reason:"External execution disabled until a controlled gateway is implemented"},403);

 }
 return json({error:"not found"},404);
},async scheduled(_event:ScheduledEvent,env:Env):Promise<void>{
 if(!env.FOUNDER_API_TOKEN||env.MARKETING_ENABLED!=="true")return;
 const store=new Store(env.DB);
 const day=new Date().toISOString().slice(0,10);
 const drafts=buildMarketingDrafts();
 for(let i=0;i<drafts.length;i++){
  const draft=drafts[i];
  const id=`marketing:${day}:${i}`;
  await store.createScheduledDraft({id,tenantId:TENANT,actorId:OWNER,request:JSON.stringify(draft)});
 }
}};