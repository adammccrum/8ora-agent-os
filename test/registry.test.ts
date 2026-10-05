import { describe, expect, it } from "vitest";
import { getUniversalAgent, listAgents, selectTaskMode } from "../src/registry";

describe("universal IrisKey agent", () => {
  it("exposes exactly one universal agent", () => {
    expect(listAgents()).toHaveLength(1);
    expect(getUniversalAgent().id).toBe("iriskey-universal");
  });

  it("uses coding mode for software work", () => {
    const mode = selectTaskMode("please code and debug this GitHub repo");
    expect(mode.id).toBe("coding");
    expect(mode.modelProfile).toBe("coding");
  });

  it("uses safe general reasoning fallback for unmatched work", () => {
    expect(selectTaskMode("something entirely unmatched").id).toBe("general");
  });
});
