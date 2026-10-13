import {describe,it,expect} from "vitest";
import {buildMarketingDrafts} from "../src/marketing-drafts";
import {authorize} from "../src/authority";
describe("draft-only marketing",()=>{
 it("prepares three unpublished drafts for both brands",()=>{
  const drafts=buildMarketingDrafts(new Date("2026-10-13T09:00:00Z"));
  expect(drafts).toHaveLength(3);
  expect(new Set(drafts.map(d=>d.brand))).toEqual(new Set(["IrisKey.ai","8ORA.AI"]));
  expect(drafts.every(d=>d.approvalRequired&&!d.published)).toBe(true);
 });
 it("does not grant external authority without an approval",()=>{
  const result=authorize({toolId:"github.write",args:{},tenantId:"iriskey-internal",actorId:"founder"});
  expect(result.allowed).toBe(false);
 });
 it("rejects unknown tools",()=>{
  const result=authorize({toolId:"marketing.publish",args:{},tenantId:"iriskey-internal",actorId:"founder"});
  expect(result.allowed).toBe(false);
 });
});
