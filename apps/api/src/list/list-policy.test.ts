import { describe, expect, it } from "vitest";

import {
  canDeleteList,
  canManageCollaborators,
  canManageShareAndEditLinks,
  canQueryNearbyListPois,
  canUpdateList,
  hasListAccess,
  isListOwner,
  isListOwnerRole,
} from "./list-policy";

const roles = ["OWNER", "EDITOR", "VIEWER", "ADMIN"] as const;

describe("hasListAccess", () => {
  it("returns false for null", () => {
    expect(hasListAccess(null)).toBe(false);
  });

  it("returns true for any non-null role", () => {
    for (const role of roles) {
      expect(hasListAccess(role)).toBe(true);
    }
  });
});

describe("canUpdateList", () => {
  it("allows EDITOR, ADMIN, OWNER", () => {
    expect(canUpdateList("EDITOR")).toBe(true);
    expect(canUpdateList("ADMIN")).toBe(true);
    expect(canUpdateList("OWNER")).toBe(true);
  });

  it("denies VIEWER", () => {
    expect(canUpdateList("VIEWER")).toBe(false);
  });
});

describe("canDeleteList", () => {
  it("allows ADMIN and OWNER", () => {
    expect(canDeleteList("ADMIN")).toBe(true);
    expect(canDeleteList("OWNER")).toBe(true);
  });

  it("denies EDITOR and VIEWER", () => {
    expect(canDeleteList("EDITOR")).toBe(false);
    expect(canDeleteList("VIEWER")).toBe(false);
  });
});

describe("canQueryNearbyListPois", () => {
  it("allows all roles", () => {
    for (const role of roles) {
      expect(canQueryNearbyListPois(role)).toBe(true);
    }
  });
});

describe("canManageShareAndEditLinks", () => {
  it("allows ADMIN and OWNER", () => {
    expect(canManageShareAndEditLinks("ADMIN")).toBe(true);
    expect(canManageShareAndEditLinks("OWNER")).toBe(true);
  });

  it("denies EDITOR and VIEWER", () => {
    expect(canManageShareAndEditLinks("EDITOR")).toBe(false);
    expect(canManageShareAndEditLinks("VIEWER")).toBe(false);
  });
});

describe("canManageCollaborators", () => {
  it("allows ADMIN and OWNER", () => {
    expect(canManageCollaborators("ADMIN")).toBe(true);
    expect(canManageCollaborators("OWNER")).toBe(true);
  });

  it("denies EDITOR and VIEWER", () => {
    expect(canManageCollaborators("EDITOR")).toBe(false);
    expect(canManageCollaborators("VIEWER")).toBe(false);
  });
});

describe("isListOwner", () => {
  it("returns true when ids match", () => {
    expect(isListOwner("user-1", "user-1")).toBe(true);
  });

  it("returns false when ids differ", () => {
    expect(isListOwner("user-1", "user-2")).toBe(false);
  });
});

describe("isListOwnerRole", () => {
  it("returns true only for OWNER", () => {
    expect(isListOwnerRole("OWNER")).toBe(true);
    expect(isListOwnerRole("ADMIN")).toBe(false);
    expect(isListOwnerRole("EDITOR")).toBe(false);
    expect(isListOwnerRole("VIEWER")).toBe(false);
  });
});
