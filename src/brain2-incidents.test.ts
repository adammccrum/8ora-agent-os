import {describe,it,expect} from "vitest";
import {reportIncident,listOpenIncidents,acknowledgeIncident,criticalIncidentFeed,resolveIncident} from "./brain2-incidents";
import type {Env} from "./types";
function fakeDb(){
 const calls:{sql:string;args:unknown[]}[]=[];
 const db={prepare(sql:string){const args:unknown[]=[];return {bind(...values:unknown[]){args.push(...values);return this},async run(){calls.push({sql,args});return {meta:{changes:1}}},async all(){calls.push({sql,args});return {results:[]}}}}};
 return {env:{DB:db} as unknown as Env,calls};
}
describe("Brain 2 incident escalation",()=>{
 it("records a critical incident with pipeline isolation",async()=>{const {env,calls}=fakeDb();await reportIncident(env,{tenantId:"founder",pipeline:"iriskey",fingerprint:"job:1",severity:"critical",category:"scheduler",summary:"Job failed"});expect(calls[0].sql).toContain("ON CONFLICT");expect(calls[0].args).toContain("iriskey");expect(calls[0].args).toContain("critical")});
 it("reads only founder-scoped open incidents",async()=>{const {env,calls}=fakeDb();expect(await listOpenIncidents(env,"founder")).toEqual([]);expect(calls[0].sql).toContain("tenant_id=?");expect(calls[0].args).toEqual(["founder"])});
 it("acknowledges only an incident in the same tenant",async()=>{const {env,calls}=fakeDb();expect(await acknowledgeIncident(env,"founder","incident1")).toBe(true);expect(calls[0].args).toContain("founder");expect(calls[0].sql).toContain("status='open'")});
 it("exposes only critical open incidents without claiming delivery",async()=>{const {env,calls}=fakeDb();expect(await criticalIncidentFeed(env,"founder")).toEqual({deliveryConfigured:false,items:[]});expect(calls[0].sql).toContain("severity='critical'");expect(calls[0].args).toEqual(["founder"])});

 it("resolves only founder-owned open or acknowledged incidents",async()=>{const {env,calls}=fakeDb();expect(await resolveIncident(env,"founder","incident1")).toBe(true);expect(calls[0].sql).toContain("tenant_id=?");expect(calls[0].args).toContain("founder")});

});
