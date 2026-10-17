import {describe,it,expect} from "vitest";
import {founderPrincipal} from "./founder-auth";
import {listAgents,selectAgent} from "./registry";
import type {Env} from "./types";
const env={FOUNDER_API_TOKEN:"a".repeat(40),FOUNDER_TENANT_ID:"founder",FOUNDER_ACTOR_ID:"owner"} as Env;
describe("Brain 2 founder boundary",()=>{
 it("rejects missing credentials",()=>expect(founderPrincipal(new Request("https://example.test"),env)).toBeUndefined());
 it("rejects invalid credentials",()=>expect(founderPrincipal(new Request("https://example.test",{headers:{authorization:"Bearer "+"b".repeat(40)}}),env)).toBeUndefined());
 it("fails closed when token not configured",()=>expect(founderPrincipal(new Request("https://example.test",{headers:{authorization:"Bearer "+"a".repeat(40)}}),{} as Env)).toBeUndefined());
 it("derives trusted identity only from environment",()=>expect(founderPrincipal(new Request("https://example.test",{headers:{authorization:"Bearer "+"a".repeat(40)}}),env)).toEqual({tenantId:"founder",actorId:"owner"}));
});
describe("Brain 2 workforce",()=>{
 it("has exactly 32 unique agents",()=>{const agents=listAgents();expect(agents).toHaveLength(32);expect(new Set(agents.map(a=>a.id)).size).toBe(32)});
 it("routes SEO requests to SEO specialist",()=>expect(selectAgent("seo audit").id).toBe("seo-specialist");
 it("routes unknown tasks to director",()=>expect(selectAgent("unrecognisable")).toHaveProperty("id","ora-director"));
 it("keeps specialist roles read-only",()=>expect(listAgents().filter(a=>a.id!=="software-engineer").every(a=>a.allowedTools.every(t=>t==="knowledge.read"))).toBe(true));
});
