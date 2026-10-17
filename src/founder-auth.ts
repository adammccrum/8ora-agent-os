import type {Env} from "./types";
export interface FounderPrincipal {tenantId:string;actorId:string}
export function founderPrincipal(request:Request,env:Env):FounderPrincipal|undefined {
 const token=env.FOUNDER_API_TOKEN;
 const tenantId=env.FOUNDER_TENANT_ID;
 const actorId=env.FOUNDER_ACTOR_ID;
 if(!token||!tenantId||!actorId||token.length<32)return undefined;
 const auth=request.headers.get("authorization");
 if(!auth?.startsWith("Bearer "))return undefined;
 const supplied=auth.slice(7);
 if(supplied.length!==token.length)return undefined;
 let mismatch=0;
 for(let i=0;i<token.length;i++)mismatch|=token.charCodeAt(i)^supplied.charCodeAt(i);
 return mismatch===0?{tenantId,actorId}:undefined;
}
