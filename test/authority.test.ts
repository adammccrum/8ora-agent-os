import { describe, expect, it } from "vitest";
import { authorize } from "../src/authority";

const proposal = {
  toolId: "github.create_issue",
  args: { repo: "adammccrum/8ora-agent-os", title: "Example" },
  tenantId: "tenant-a",
  actorId: "adam"
};

describe("authority gate", () => {
  it("blocks consequential action without authority", () => {
    expect(authorize(proposal).allowed).toBe(false);
  });

  it("allows matching unexpired scoped authority", () => {
    expect(authorize(proposal, {
      approvalId: "approval-1",
      toolId: "github.create_issue",
      tenantId: "tenant-a",
      actorId: "adam",
      expiresAt: Date.now() + 60_000
    }).allowed).toBe(true);
  });

  it("allows read-only capability without approval", () => {
    expect(authorize({ ...proposal, toolId: "github.read" }).allowed).toBe(true);
  });

  it("fails closed for unknown tools", () => {
    expect(authorize({ ...proposal, toolId: "unknown" }).allowed).toBe(false);
  });
});
