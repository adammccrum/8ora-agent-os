import {describe,it,expect} from "vitest";
import {chooseModel} from "./slm-policy";
import {listAgents} from "./registry";
const agent=(id:string)=>listAgents().find(a=>a.id===id)!;
describe("SLM-first routing",()=>{
 it("routes SEO tasks to SLM",()=>expect(chooseModel(agent("seo-specialist"),"keyword audit")).toMatchObject({tier:"slm",profile:"fast"}));
 it("routes CRM tasks to SLM",()=>expect(chooseModel(agent("crm-manager"),"qualify contact").tier).toBe("slm"));
 it("routes safety-critical tasks to LLM",()=>expect(chooseModel(agent("seo-specialist"),"safety critical verification").tier).toBe("llm"));
 it("routes engineering tasks to LLM",()=>expect(chooseModel(agent("engineering-researcher"),"physics simulation").tier).toBe("llm"));
 it("requires free routing for every task",()=>expect(listAgents().every(a=>chooseModel(a,"draft").requiresFreeRoute)).toBe(true));
});
