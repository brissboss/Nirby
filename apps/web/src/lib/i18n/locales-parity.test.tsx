import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import enExplore from "./locales/en/explore.json";
import enLists from "./locales/en/lists.json";
import frExplore from "./locales/fr/explore.json";
import frLists from "./locales/fr/lists.json";

type JsonObject = Record<string, unknown>;

function collectKeys(obj: JsonObject, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return collectKeys(value as JsonObject, path);
    }

    return [path];
  });
}

function getValue(obj: JsonObject, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current && typeof current === "object" && key in (current as JsonObject)) {
      return (current as JsonObject)[key];
    }
    return undefined;
  }, obj);
}

function expectLocaleParity(en: JsonObject, fr: JsonObject, namespace: string) {
  const enKeys = collectKeys(en).sort();
  const frKeys = collectKeys(fr).sort();

  expect(frKeys, `${namespace}: fr keys should match en`).toEqual(enKeys);
}

const NEW_LISTS_KEYS = [
  "pois.section.title",
  "pois.empty.title",
  "pois.error.retry",
  "poi.source.custom",
  "removePoi.success",
  "share.action",
  "share.readLink.generate",
  "share.editLink.revokeConfirm",
  "share.copySuccess",
  "share.description",
  "collaborators.section.title",
  "collaborators.invite.submit",
  "collaborators.leaveConfirm",
  "shared.title",
  "shared.notFound",
  "shared.expired",
  "join.edit.title",
  "join.edit.description",
  "join.accept.title",
  "join.accept.description",
  "join.missingToken",
  "join.joining",
] as const;

const NEW_EXPLORE_KEYS = [
  "idle.title",
  "search.placeholder",
  "results.empty.title",
  "addToList.picker.title",
  "addToList.alreadySaved",
  "results.savedIn",
  "addToList.picker.alreadyInList",
] as const;

function expectNonEmptyStrings(obj: JsonObject, keys: readonly string[], locale: string) {
  for (const key of keys) {
    const value = getValue(obj, key);
    expect(value, `${locale}.${key}`).toEqual(expect.any(String));
    expect(String(value).length, `${locale}.${key} should not be empty`).toBeGreaterThan(0);
  }
}

describe("locales parity", () => {
  it("lists.json has the same keys in en and fr", () => {
    expectLocaleParity(enLists, frLists, "lists");
  });

  it("explore.json has the same keys in en and fr", () => {
    expectLocaleParity(enExplore, frExplore, "explore");
  });

  it("new lists keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enLists, NEW_LISTS_KEYS, "en");
    expectNonEmptyStrings(frLists, NEW_LISTS_KEYS, "fr");
  });

  it("new explore keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enExplore, NEW_EXPLORE_KEYS, "en");
    expectNonEmptyStrings(frExplore, NEW_EXPLORE_KEYS, "fr");
  });

  it("does not keep the removed detail.poisComingSoon key", () => {
    expect(collectKeys(enLists)).not.toContain("detail.poisComingSoon");
    expect(collectKeys(frLists)).not.toContain("detail.poisComingSoon");
  });
});

describe("message resolution", () => {
  it("resolves lists and explore namespaces", () => {
    const messages = { lists: enLists, explore: enExplore };

    const tLists = createTranslator({ locale: "en", messages, namespace: "lists" });
    const tExplore = createTranslator({ locale: "en", messages, namespace: "explore" });

    expect(tLists("pois.section.title")).toBe("Places");
    expect(tExplore("search.placeholder")).toBe("Search for a place…");
    expect(tExplore("addToList.picker.description", { placeName: "Tour Eiffel" })).toBe(
      'Choose a list for "Tour Eiffel"'
    );
  });
});
