import {describe,it,expect,vi} from "vitest";
import {routeModel} from "./omniroute";
import type {Env} from "./types";
const messages=[{role:"user" as const,content:"Write a headline"}];
const makeEnv=(run:ReturnType<typeof vi.fn>,free="true")=>({AI:{run},WORKERS_AI_FREE_PLAN:free} as unknown as Env);
describe("Workers AI free-plan route",()=>{
 it("uses the small model for routine tasks",async()=>{const run=vi.fn().mockResolvedValue({response:"Draft"});const r=await routeModel(makeEnv(run),{profile:"fast",tier:"slm",freeOnly:true,messages});expect(r).toMatchObject({output:"Draft",billable:false,tier:"slm"});expect(run).toHaveBeenCalledWith("@cf/meta/llama-3.2-3b-instruct",expect.objectContaining({max_tokens:512}));});
 it("uses the larger model for complex tasks",async()=>{const run=vi.fn().mockResolvedValue({response:"Plan"});await routeModel(makeEnv(run),{profile:"reasoning",tier:"llm",freeOnly:true,messages});expect(run.mock.calls[0][0]).toBe("@cf/meta/llama-3.1-8b-instruct-fp8");});
 it("rejects unverified billing configuration",async()=>{const run=vi.fn();await expect(routeModel(makeEnv(run,"false"),{profile:"fast",tier:"slm",freeOnly:true,messages})).rejects.toThrow("credentials");expect(run).not.toHaveBeenCalled();});
 it("requires the free-only flag",async()=>{const run=vi.fn();await expect(routeModel(makeEnv(run),{profile:"fast",tier:"slm",messages})).rejects.toThrow("free model tier");expect(run).not.toHaveBeenCalled();});
 it("does not fall back after quota failure",async()=>{const run=vi.fn().mockRejectedValue(new Error("quota exhausted"));await expect(routeModel(makeEnv(run),{profile:"fast",tier:"slm",freeOnly:true,messages})).rejects.toThrow("quota");expect(run).toHaveBeenCalledTimes(1);});
 it("rejects empty model responses",async()=>{const run=vi.fn().mockResolvedValue({response:""});await expect(routeModel(makeEnv(run),{profile:"fast",tier:"slm",freeOnly:true,messages})).rejects.toThrow("no text");});
 it("rejects oversized input before inference",async()=>{const run=vi.fn();await expect(routeModel(makeEnv(run),{profile:"fast",tier:"slm",freeOnly:true,messages:[{role:"user",content:"x".repeat(16385)}]})).rejects.toThrow("16 KiB");expect(run).not.toHaveBeenCalled();});
});
