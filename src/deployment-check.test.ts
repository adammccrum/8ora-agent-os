import {describe,it,expect,vi} from "vitest";
import {deploymentCheck} from "./deployment-check";
import type {Env} from "./types";
function fixture(token="t".repeat(40)){
 const saved:unknown[][]=[];
 const first=vi.fn().mockResolvedValue(null);
 const db={prepare:vi.fn((sql:string)=>({bind:(...args:unknown[])=>({first,run:async()=>{saved.push(args);return {success:true};}})}))} as D1Database;
 const env:Env={DB:db,FOUNDER_API_TOKEN:token,FOUNDER_TENANT_ID:"founder",FOUNDER_ACTOR_ID:"owner",BRAIN2_DEPLOYMENT_CHECK_ID:"release-check"};
 return {env,saved};
}
describe("Private deployment verifier",()=>{
 it("never calls the application if the founder token is too short",async()=>{const {env}=fixture("short");const handle=vi.fn();await expect(deploymentCheck(handle,env)).rejects.toThrow("too short");expect(handle).not.toHaveBeenCalled();});
 it("fails if protected data accepts an anonymous request",async()=>{const {env,saved}=fixture();await expect(deploymentCheck(async()=>Response.json({}),env)).rejects.toThrow("anonymous_denied");expect(saved).toHaveLength(0);});
 it("records authenticated checks without persisting the token or AI text",async()=>{
  const {env,saved}=fixture();
  const handle=async(r:Request)=>{
   const path=new URL(r.url).pathname;
   if(!r.headers.has("authorization"))return Response.json({}, {status:401});
   expect(r.headers.get("authorization")).toBe("Bearer "+env.FOUNDER_API_TOKEN);
   if(path==="/ready")return Response.json({ready:true,modelConfigured:true,autonomousExecutionEnabled:false});
   if(path==="/v1/authority/check")return Response.json({}, {status:403});
   if(path==="/v1/tasks"){const body=await r.json<{tenantId?:string}>();if(body.tenantId)return Response.json({}, {status:403});return Response.json({status:"planned",model:{output:"SYNTHETIC_PRIVATE_MODEL_TEXT",billable:false}}, {status:202});}
   return Response.json([]);
  };
  await deploymentCheck(handle,env);
  expect(saved).toHaveLength(1);
  const proof=JSON.parse(String(saved[0][3]));
  expect(proof).toMatchObject({passed:true,modelProducedText:true,autonomousExecutionEnabled:false});
  expect(proof.checks).toMatchObject({anonymous_denied:true,tenant_spoof_denied:true,unknown_tool_denied:true,model_plan:true});
  expect(JSON.stringify(saved)).not.toContain(env.FOUNDER_API_TOKEN);
  expect(JSON.stringify(saved)).not.toContain("SYNTHETIC_PRIVATE_MODEL_TEXT");
 });
});
