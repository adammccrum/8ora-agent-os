import {describe,expect,it} from "vitest";
import {selectAgent} from "../src/registry";
describe("capability routing",()=>{
 it("routes coding work to software engineering",()=>expect(selectAgent("please code and debug this").id).toBe("software-engineer"));
 it("uses safe general fallback for unknown work",()=>expect(selectAgent("something entirely unmatched").id).toBe("ora-general"));
});
