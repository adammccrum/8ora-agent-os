import {describe,expect,it} from "vitest";
import {authorize} from "../src/authority";
const proposal={toolId:"github.write",args:{repo:"a"},tenantId:"tenant-a",actorId:"adam"};
const base={approvalId:"x",toolId:"github.write",tenantId:"tenant-a",actorId:"adam",expiresAt:Date.now()+60000};
describe("authority isolation",()=>{
 it("rejects a different tenant",()=>expect(authorize(proposal,{...base,tenantId:"tenant-b"}).allowed).toBe(false));
 it("rejects a different actor",()=>expect(authorize(proposal,{...base,actorId:"other"}).allowed).toBe(false));
 it("rejects expired authority",()=>expect(authorize(proposal,{...base,expiresAt:Date.now()-1}).allowed).toBe(false));
});
