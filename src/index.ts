import { authorize } from "./authority";
import { dashboardHtml } from "./dashboard";
import { createJob, listAudit, listJobs, updateJob } from "./jobs";
import { orchestrate } from "./orchestrator";
import { listAgents, listTools } from "./registry";
import type { ActionProposal, Authority, Env } from "./types";

const json=(data:unknown,status=200)=>new Response(JSON.stringify(data,null,2),{status,headers:{"content-type":"application/json","cache-control":"no-store"}});

export default {
 async fetch(request:Request,env:Env):Promise<Response>{
  const url=new URL(request.url);
  if(request.method==="GET"&&url.pathname==="/") return new Response(dashboardHtml(),{headers:{"content-type":"text/html;charset=utf-8"}});
  if(request.method==="GET"&&url.pathname==="/health") return json({ok:true,service:"8ora-agent-os",phase:1,productionConnected:false});
  if(request.method==="GET"&&url.pathname==="/v1/agents") return json(listAgents());
  if(request.method==="GET"&&url.pathname==="/v1/tools") return json(listTools());
  if(request.method==="GET"&&url.pathname==="/v1/jobs") return json(listJobs());
  if(request.method==="GET"&&url.pathname==="/v1/audit") return json(listAudit());

  if(request.method==="POST"&&url.pathname==="/v1/tasks"){
   const body=await request.json<{request?:string;tenantId?:string;actorId?:string}>();
   if(!body.request||!body.tenantId||!body.actorId) return json({error:"request, tenantId and actorId are required"},400);
   const job=createJob({request:body.request,tenantId:body.tenantId,actorId:body.actorId});
   try{
    const result=await orchestrate(env,body.request);
    updateJob(job.id,{status:"planned",agentId:result.agent.id});
    return json({jobId:job.id,...result},202);
   }catch(error){
    updateJob(job.id,{status:"failed"});
    return json({jobId:job.id,error:error instanceof Error?error.message:"orchestration failed"},502);
   }
  }

  if(request.method==="POST"&&url.pathname==="/v1/authority/check"){
   const body=await request.json<{proposal?:ActionProposal;authority?:Authority}>();
   if(!body.proposal) return json({error:"proposal is required"},400);
   return json(authorize(body.proposal,body.authority));
  }
  return json({error:"not found"},404);
 }
};