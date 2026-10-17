import {describe,it,expect} from "vitest";
import {claimDue,completeTask,enqueue,recoverExpired} from "./brain2-queue";
import type {Env} from "./types";
function fakeDb(rows:Record<string,unknown>[]=[]){
 const calls:{sql:string;args:unknown[]}[]=[];
 const db={prepare(sql:string){const args:unknown[]=[];return {bind(...values:unknown[]){args.push(...values);return this},async run(){calls.push({sql,args});return {meta:{changes:1}}},async first(){calls.push({sql,args});return rows.shift()??null}}}};
 return {db:db as unknown as D1Database,calls};
}
describe("Brain 2 queue primitives",()=>{
 it("persists pipeline and tenant on enqueue",async()=>{const {db,calls}=fakeDb();await enqueue({DB:db} as Env,{tenantId:"founder",actorId:"owner",pipeline:"iriskey",agentId:"licensing-scout",task:{draft:true},dueAt:123});expect(calls[0].sql).toContain("INSERT INTO brain2_queue");expect(calls[0].args).toContain("iriskey") it("recovers expired leases without executing actions",async()=>{const {db,calls}=fakeDb();expect(await recoverExpired({DB:db} as Env,"founder",500)).toEqual({requeued:1,dead:1});expect(calls).toHaveLength(2);expect(calls[0].sql).toContain("status='dead'");expect(calls[1].sql).toContain("status='queued'");});
});
 it("does not claim an absent job",async()=>{const {db}=fakeDb();expect(await claimDue({DB:db} as Env,"founder",100)).toBeUndefined()});
 it("claims a due job with lease",async()=>{const {db,calls}=fakeDb([{id:"job1"}]);expect(await claimDue({DB:db} as Env,"founder",100)).toBe("job1");expect(calls[1].args[0]).toBe(120100)});
 it("rejects completion of a non-leased job",async()=>{const {db}=fakeDb();expect(await completeTask({DB:db} as Env,"job1","founder","owner",true)).toBe(false)});
 it("marks exhausted retry as dead",async()=>{const {db,calls}=fakeDb([{attempts:3,max_attempts:3}]);expect(await completeTask({DB:db} as Env,"job1","founder","owner",false,"failed")).toBe(true);expect(calls[1].args[0]).toBe("dead")});
});
