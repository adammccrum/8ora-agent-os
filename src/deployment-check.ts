import type {Env} from "./types";
export async function deploymentCheck(handle:(request:Request)=>Promise<Response>,env:Env):Promise<void>{
 const id=env.BRAIN2_DEPLOYMENT_CHECK_ID;if(!id)return;
 const row=await env.DB.prepare("SELECT value_json FROM brain2_memory WHERE tenant_id=? AND pipeline='internal' AND namespace='deployment-check' AND key=?").bind(env.FOUNDER_TENANT_ID,id).first<{value_json:string}>();
 if(row&&JSON.parse(row.value_json).passed===true)return;
 if(!env.FOUNDER_API_TOKEN||env.FOUNDER_API_TOKEN.length<32)throw Error("Founder credential is missing or too short");
 const headers={authorization:"Bearer "+env.FOUNDER_API_TOKEN,"content-type":"application/json"};
 const checks:Record<string,boolean>={};
 const run=async(name:string,path:string,status:number,body?:unknown,auth=true)=>{
  const r=await handle(new Request("https://brain2.internal"+path,{method:body===undefined?"GET":"POST",headers:auth?headers:{"content-type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})}));
  checks[name]=r.status===status;if(!checks[name])throw Error("Deployment check failed: "+name);return r;
 };
 await run("anonymous_denied","/v1/jobs",401,undefined,false);
 const ready=await (await run("founder_readiness","/ready",200)).json<{ready:boolean;modelConfigured:boolean;autonomousExecutionEnabled:boolean}>();
 if(!ready.ready||!ready.modelConfigured||ready.autonomousExecutionEnabled)throw Error("Readiness boundary failed");
 for(const path of ["/v1/agents","/v1/jobs","/v1/audit","/v1/brain2/queue/health"])await run(path,path,200);
 await run("tenant_spoof_denied","/v1/tasks",403,{request:"Deployment boundary test",tenantId:"deployment-other-tenant",actorId:"deployment-other-actor"});
 await run("unknown_tool_denied","/v1/authority/check",403,{proposal:{tenantId:env.FOUNDER_TENANT_ID,actorId:env.FOUNDER_ACTOR_ID,toolId:"deployment-unknown-tool",args:{}}});
 const result=await (await run("model_plan","/v1/tasks",202,{request:"Deployment verification only. Reply with the single word READY."})).json<{model?:{output?:string;billable?:boolean};status?:string}>();
 if(!result.model?.output?.trim()||result.model.billable!==false||result.status!=="planned")throw Error("Model plan verification failed");
 const proof={passed:true,checks,modelProducedText:true,autonomousExecutionEnabled:false,checkedAt:Date.now()};
 await env.DB.prepare("INSERT INTO brain2_memory(id,tenant_id,pipeline,namespace,key,value_json,updated_at) VALUES(?,?,'internal','deployment-check',?,?,?) ON CONFLICT(tenant_id,pipeline,namespace,key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at").bind(crypto.randomUUID(),env.FOUNDER_TENANT_ID,id,JSON.stringify(proof),Date.now()).run();
}
