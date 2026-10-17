import {describe,it,expect} from "vitest";
import {routeModel} from "./omniroute";
import {authorize} from "./authority";
import type {Env,ActionProposal} from "./types";
const proposal:ActionProposal={toolId:"github.write",tenantId:"founder",actorId:"owner",args:{branch:"feat/private-brain-24x7"}};
describe("fail closed authority and inference",()=>{
 it("rejects unknown tools",()=>expect(authorize({...proposal,toolId:"unregistered"}).allowed).toBe(false));
 it("rejects writes without approval",()=>expect(authorize(proposal).allowed).toBe(false));
 it("rejects wrong tenant",()=>expect(authorize(proposal,{approvalId:"a",tenantId:"other",actorId:"owner",toolId:"github.write",expiresAt:Date.now()+60000}).allowed).toBe(false));
 it("rejects expired approval",()=>expect(authorize(proposal,{approvalId:"a",tenantId:"founder",actorId:"owner",toolId:"github.write",expiresAt:Date.now()-1}).allowed).toBe(false));
 it("rejects missing live model credentials",async()=>await expect(routeModel({} as Env,{profile:"reasoning",messages:[{role:"user",content:"test"}]})).rejects.toThrow("Model unavailable"));
});
