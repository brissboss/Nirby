import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import enAuth from "./locales/en/auth.json";
import enCommon from "./locales/en/common.json";
import enConsent from "./locales/en/consent.json";
import enErrors from "./locales/en/errors.json";
import enExplore from "./locales/en/explore.json";
import enLegal from "./locales/en/legal.json";
import enLists from "./locales/en/lists.json";
import enPoi from "./locales/en/poi.json";
import enProfile from "./locales/en/profile.json";
import enShell from "./locales/en/shell.json";
import enUpload from "./locales/en/upload.json";
import frAuth from "./locales/fr/auth.json";
import frCommon from "./locales/fr/common.json";
import frConsent from "./locales/fr/consent.json";
import frErrors from "./locales/fr/errors.json";
import frExplore from "./locales/fr/explore.json";
import frLegal from "./locales/fr/legal.json";
import frLists from "./locales/fr/lists.json";
import frPoi from "./locales/fr/poi.json";
import frProfile from "./locales/fr/profile.json";
import frShell from "./locales/fr/shell.json";
import frUpload from "./locales/fr/upload.json";

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
  "pois.empty.description",
  "pois.error.retry",
  "poi.source.custom",
  "removePoi.success",
  "addPoi.success",
  "addPoi.error",
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

const NEW_COMMON_KEYS = [
  "legal.navLabel",
  "legal.home",
  "legal.privacy",
  "legal.mentions",
  "skipLink",
  "globalError.title",
  "globalError.description",
  "globalError.retry",
] as const;

const NEW_LEGAL_KEYS = [
  "privacy.metaTitle",
  "privacy.title",
  "privacy.s6Body",
  "privacy.s6Ovh",
  "privacy.s6Transfers",
  "privacy.s7Body",
  "privacy.s7Product",
  "privacy.s9Title",
  "privacy.s9Body",
  "privacy.s9Necessary",
  "privacy.s9Mapbox",
  "privacy.s9Sentry",
  "mentions.metaTitle",
  "mentions.title",
  "mentions.s1Status",
  "mentions.s3Body",
  "mentions.s3Legal",
  "mentions.s3Datacenter",
  "mentions.s5Body",
] as const;

const NEW_POI_KEYS = [
  "create.title",
  "create.submit",
  "edit.submit",
  "fields.name",
  "fields.visibility",
  "fields.category",
  "placeholders.name",
  "validation.requiredName",
  "validation.latitudeInvalid",
  "visibility.PRIVATE.label",
  "categories.restaurant.label",
  "categories.other.label",
  "photo.uploadSuccess",
  "photo.uploadError",
  "createPoi.success",
  "createPoi.error",
  "updatePoi.success",
  "updatePoi.error",
] as const;

const NEW_SHELL_KEYS = ["tabs.navLabel"] as const;

const NEW_CONSENT_KEYS = [
  "title",
  "description",
  "privacyLink",
  "accept",
  "refuse",
  "customize",
  "save",
  "back",
  "necessaryTitle",
  "necessaryDescription",
  "sentryTitle",
  "sentryDescription",
  "manage",
] as const;

const NEW_ERRORS_KEYS = [
  "default",
  "api.REFRESH_TOKEN_REQUIRED",
  "api.INVALID_REFRESH_TOKEN",
  "api.UNAUTHORIZED",
  "validation.formErrors.requiredEmail",
] as const;

const NEW_AUTH_KEYS = ["login.title", "signup.title", "required.login"] as const;

const NEW_PROFILE_KEYS = ["hub.title", "update.success", "sections.privacy"] as const;

const NEW_UPLOAD_KEYS = ["uploadError", "fileTooLarge"] as const;

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

  it("poi.json has the same keys in en and fr", () => {
    expectLocaleParity(enPoi, frPoi, "poi");
  });

  it("legal.json has the same keys in en and fr", () => {
    expectLocaleParity(enLegal, frLegal, "legal");
  });

  it("common.json has the same keys in en and fr", () => {
    expectLocaleParity(enCommon, frCommon, "common");
  });

  it("shell.json has the same keys in en and fr", () => {
    expectLocaleParity(enShell, frShell, "shell");
  });

  it("consent.json has the same keys in en and fr", () => {
    expectLocaleParity(enConsent, frConsent, "consent");
  });

  it("auth.json has the same keys in en and fr", () => {
    expectLocaleParity(enAuth, frAuth, "auth");
  });

  it("errors.json has the same keys in en and fr", () => {
    expectLocaleParity(enErrors, frErrors, "errors");
  });

  it("profile.json has the same keys in en and fr", () => {
    expectLocaleParity(enProfile, frProfile, "profile");
  });

  it("upload.json has the same keys in en and fr", () => {
    expectLocaleParity(enUpload, frUpload, "upload");
  });

  it("new lists keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enLists, NEW_LISTS_KEYS, "en");
    expectNonEmptyStrings(frLists, NEW_LISTS_KEYS, "fr");
  });

  it("new explore keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enExplore, NEW_EXPLORE_KEYS, "en");
    expectNonEmptyStrings(frExplore, NEW_EXPLORE_KEYS, "fr");
  });

  it("new poi keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enPoi, NEW_POI_KEYS, "en");
    expectNonEmptyStrings(frPoi, NEW_POI_KEYS, "fr");
  });

  it("new legal keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enLegal, NEW_LEGAL_KEYS, "en");
    expectNonEmptyStrings(frLegal, NEW_LEGAL_KEYS, "fr");
  });

  it("new common legal keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enCommon, NEW_COMMON_KEYS, "en");
    expectNonEmptyStrings(frCommon, NEW_COMMON_KEYS, "fr");
  });

  it("new shell keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enShell, NEW_SHELL_KEYS, "en");
    expectNonEmptyStrings(frShell, NEW_SHELL_KEYS, "fr");
  });

  it("new consent keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enConsent, NEW_CONSENT_KEYS, "en");
    expectNonEmptyStrings(frConsent, NEW_CONSENT_KEYS, "fr");
  });

  it("new errors keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enErrors, NEW_ERRORS_KEYS, "en");
    expectNonEmptyStrings(frErrors, NEW_ERRORS_KEYS, "fr");
  });

  it("new auth keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enAuth, NEW_AUTH_KEYS, "en");
    expectNonEmptyStrings(frAuth, NEW_AUTH_KEYS, "fr");
  });

  it("new profile keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enProfile, NEW_PROFILE_KEYS, "en");
    expectNonEmptyStrings(frProfile, NEW_PROFILE_KEYS, "fr");
  });

  it("new upload keys are non-empty strings in both locales", () => {
    expectNonEmptyStrings(enUpload, NEW_UPLOAD_KEYS, "en");
    expectNonEmptyStrings(frUpload, NEW_UPLOAD_KEYS, "fr");
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

  it("resolves poi namespace", () => {
    const tPoi = createTranslator({ locale: "en", messages: { poi: enPoi }, namespace: "poi" });

    expect(tPoi("select", { name: "Secret garden" })).toBe("Select Secret garden");
    expect(tPoi("create.title")).toBe("New place");
  });

  it("resolves legal namespace", () => {
    const tLegal = createTranslator({
      locale: "en",
      messages: { legal: enLegal },
      namespace: "legal",
    });

    expect(tLegal("privacy.title")).toBe("Privacy policy");
    expect(tLegal("mentions.title")).toBe("Legal notice");
    expect(tLegal("mentions.s1Name")).toBe("Théo Brissiaud");
    expect(tLegal("privacy.s9Title")).toBe("9. Cookies and trackers");
  });

  it("resolves consent namespace", () => {
    const tConsent = createTranslator({
      locale: "en",
      messages: { consent: enConsent },
      namespace: "consent",
    });

    expect(tConsent("title")).toBe("Cookies and tracking");
    expect(tConsent("manage")).toBe("Manage cookies");
  });

  it("resolves skip link and global error keys", () => {
    const tCommon = createTranslator({
      locale: "en",
      messages: { common: enCommon },
      namespace: "common",
    });

    expect(tCommon("skipLink")).toBe("Skip to content");
    expect(tCommon("globalError.title")).toBe("Something went wrong");
    expect(tCommon("globalError.retry")).toBe("Try again");
  });

  it("resolves shell namespace", () => {
    const tShell = createTranslator({
      locale: "en",
      messages: { shell: enShell },
      namespace: "shell",
    });

    expect(tShell("tabs.navLabel")).toBe("Main navigation");
    expect(tShell("tabs.explore")).toBe("Explore");
  });
});
