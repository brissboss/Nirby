"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@/components/ui";
import { applySentryConsent } from "@/lib/consent/apply-sentry-consent";
import { readConsent, subscribeConsent, writeConsent } from "@/lib/consent/consent";

function subscribeNever() {
  return () => {};
}

type CookieConsentContextValue = {
  openPreferences: () => void;
};

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsent");
  }
  return context;
}

type Step = "main" | "customize";

export function CookieConsent({ children }: { children: ReactNode }) {
  const t = useTranslations("consent");
  const isClient = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => null);
  const required = isClient && consent === null;
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [step, setStep] = useState<Step>("main");
  const [sentryDraft, setSentryDraft] = useState(false);

  const persist = useCallback((sentry: boolean) => {
    writeConsent(sentry);
    applySentryConsent(sentry);
    setSentryDraft(sentry);
    setStep("main");
    setPreferencesOpen(false);
  }, []);

  const openPreferences = useCallback(() => {
    setSentryDraft(readConsent()?.sentry ?? false);
    setStep("main");
    setPreferencesOpen(true);
  }, []);

  const value = useMemo(() => ({ openPreferences }), [openPreferences]);

  function handleOpenChange(next: boolean) {
    if (!next && required) {
      return;
    }
    setPreferencesOpen(next);
    if (!next) {
      setStep("main");
    }
  }

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      {isClient ? (
        <Dialog open={required || preferencesOpen} onOpenChange={handleOpenChange}>
          <DialogContent
            showCloseButton={!required}
            onPointerDownOutside={(event) => {
              if (required) {
                event.preventDefault();
              }
            }}
            onEscapeKeyDown={(event) => {
              if (required) {
                event.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>
                {t("description")}{" "}
                <Link
                  href="/privacy"
                  className="text-primary underline underline-offset-4 hover:no-underline"
                >
                  {t("privacyLink")}
                </Link>
              </DialogDescription>
            </DialogHeader>

            {step === "customize" ? (
              <div className="grid gap-4">
                <fieldset className="grid gap-2 rounded-lg border border-border p-3">
                  <legend className="px-1 text-sm font-medium">{t("necessaryTitle")}</legend>
                  <p className="text-muted-foreground text-sm">{t("necessaryDescription")}</p>
                  <label
                    className="flex items-center gap-2 text-sm"
                    htmlFor="cookie-consent-necessary"
                  >
                    <input id="cookie-consent-necessary" type="checkbox" checked disabled />
                    {t("necessaryTitle")}
                  </label>
                </fieldset>
                <fieldset className="grid gap-2 rounded-lg border border-border p-3">
                  <legend className="px-1 text-sm font-medium">{t("sentryTitle")}</legend>
                  <p className="text-muted-foreground text-sm">{t("sentryDescription")}</p>
                  <Label className="text-foreground" htmlFor="cookie-consent-sentry">
                    <input
                      id="cookie-consent-sentry"
                      type="checkbox"
                      checked={sentryDraft}
                      onChange={(event) => setSentryDraft(event.target.checked)}
                    />
                    {t("sentryTitle")}
                  </Label>
                </fieldset>
              </div>
            ) : null}

            <DialogFooter>
              {step === "main" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => persist(false)}>
                    {t("refuse")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setStep("customize")}>
                    {t("customize")}
                  </Button>
                  <Button type="button" onClick={() => persist(true)}>
                    {t("accept")}
                  </Button>
                </>
              ) : (
                <>
                  <Button type="button" variant="outline" onClick={() => setStep("main")}>
                    {t("back")}
                  </Button>
                  <Button type="button" onClick={() => persist(sentryDraft)}>
                    {t("save")}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </CookieConsentContext.Provider>
  );
}
