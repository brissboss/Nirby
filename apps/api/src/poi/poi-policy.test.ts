import { describe, expect, it } from "vitest";

import { canDeletePoi, canEditPoi, canReadPoi } from "./poi-policy";

const creatorId = "creator-id";
const otherId = "other-id";

describe("canReadPoi", () => {
  it("allows creator regardless of visibility", () => {
    expect(canReadPoi({ createdBy: creatorId, visibility: "PRIVATE" }, creatorId)).toBe(true);
    expect(canReadPoi({ createdBy: creatorId, visibility: "SHARED" }, creatorId)).toBe(true);
    expect(canReadPoi({ createdBy: creatorId, visibility: "PUBLIC" }, creatorId)).toBe(true);
  });

  it("allows non-creator only when PUBLIC", () => {
    expect(canReadPoi({ createdBy: creatorId, visibility: "PUBLIC" }, otherId)).toBe(true);
    expect(canReadPoi({ createdBy: creatorId, visibility: "PRIVATE" }, otherId)).toBe(false);
    expect(canReadPoi({ createdBy: creatorId, visibility: "SHARED" }, otherId)).toBe(false);
  });
});

describe("canEditPoi", () => {
  it("allows only creator", () => {
    expect(canEditPoi({ createdBy: creatorId }, creatorId)).toBe(true);
    expect(canEditPoi({ createdBy: creatorId }, otherId)).toBe(false);
  });
});

describe("canDeletePoi", () => {
  it("allows only creator", () => {
    expect(canDeletePoi({ createdBy: creatorId }, creatorId)).toBe(true);
    expect(canDeletePoi({ createdBy: creatorId }, otherId)).toBe(false);
  });
});
