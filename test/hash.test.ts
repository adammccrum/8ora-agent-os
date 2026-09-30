import {describe,expect,it} from "vitest";
import {hashArgs} from "../src/hash";
describe("argument binding",()=>{it("changes when action arguments change",async()=>{expect(await hashArgs({a:1})).not.toBe(await hashArgs({a:2}))})});
