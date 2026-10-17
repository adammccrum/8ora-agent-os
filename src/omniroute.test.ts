import {describe,it,expect,vi,afterEach} from "vitest";
import {routeModel} from "./omniroute";
import type {Env} from "./types";
const env={OMNIROUTE_BASE_URL:"https://router.example",OMNIROUTE_API_KEY:"test-key"} as Env;
const messages=[{role:"user" as const,content:"draft a headline"}];
afterEach(()=>vi.unstubAllGlobals());
describe("OmniRoute safety contract",()=>{
 it("fails closed without configured credentials",async()=>{
  const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
  await expect(routeModel({} as Env,{profile:"fast",tier:"slm",freeOnly:true,messages})).rejects.toThrow("credentials");
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("rejects requests missing a free-only requirement before network access",async()=>{
  const fetchMock=vi.fn();vi.stubGlobal("fetch",fetchMock);
  await expect(routeModel(env,{profile:"fast",tier:"slm",messages})).rejects.toThrow("free model tier");
  expect(fetchMock).not.toHaveBeenCalled();
 });
 it("forwards SLM tier and free-only flag to the router",async()=>{
  const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({output:"draft",tier:"slm",freeOnly:true,billable:false,model:"test-slm"})});
  vi.stubGlobal("fetch",fetchMock);
  await routeModel(env,{profile:"fast",tier:"slm",freeOnly:true,messages});
  const [url,init]=fetchMock.mock.calls[0];
  expect(String(url)).toBe("https://router.example/v1/route");
  expect(JSON.parse(init.body)).toMatchObject({tier:"slm",freeOnly:true});
 });
 it("rejects router output without verified free-tier attestation",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:true,json:async()=>({output:"draft"})}));
  await expect(routeModel(env,{profile:"fast",tier:"slm",freeOnly:true,messages})).rejects.toThrow("did not attest");
 });
 it("rejects upstream failures without a paid fallback",async()=>{
  vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false,status:429}));
  await expect(routeModel(env,{profile:"fast",tier:"slm",freeOnly:true,messages})).rejects.toThrow("429");
 });
});
