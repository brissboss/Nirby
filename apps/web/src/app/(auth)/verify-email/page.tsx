"use client";

import { CheckCircle, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { Error } from "@/lib/api/generated";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const { verifyEmail, resendEmail } = useAuth();
  const getErrorMessage = useErrorMessage();

  const [state, setState] = useState<VerificationState>("loading");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!token) {
        setState("error");
        setErrorCode("TOKEN_REQUIRED");
        return;
      }

      try {
        const response = await verifyEmail(token);

        if (response && typeof response === "object" && "user" in response) {
          setState("success");
        } else {
          setState("error");
          setErrorCode((response as Error)?.error?.code || "INTERNAL_ERROR");
        }
      } catch (err) {
        setState("error");
        setErrorCode((err as Error)?.error?.code || "INTERNAL_ERROR");
      }
    }

    verify();
  }, [token, verifyEmail]);

  async function handleResendEmail() {
    setIsLoading(true);
    try {
      if (!email) {
        setState("error");
        setErrorCode("EMAIL_REQUIRED");
        return;
      }

      await resendEmail(email);

      toast.success(t("auth.verifyEmail.emailResent"));
    } catch (err) {
      toast.error(t("auth.verifyEmail.emailResendError"), {
        description: getErrorMessage(err),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background relative">
      <div className="w-full max-w-md lg:max-w-sm space-y-8 lg:space-y-6 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.verifyEmail.verifying")}</h1>
            <p className="text-muted-foreground">{t("auth.verifyEmail.pleaseWait")}</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto text-green-500" />
            <h1 className="text-2xl font-bold tracking-tight">
              {t("auth.verifyEmail.successTitle")}
            </h1>
            <p className="text-muted-foreground">{t("auth.verifyEmail.successDescription")}</p>
            <Button asChild className="w-full mt-4">
              <Link href="/login">{t("auth.verifyEmail.goToLogin")}</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold tracking-tight">
              {t("auth.verifyEmail.errorTitle")}
            </h1>
            <p className="text-muted-foreground">
              {errorCode && t.has(`errors.api.${errorCode}`)
                ? t(`errors.api.${errorCode}`)
                : t("auth.verifyEmail.errorDescription")}
            </p>
            <div className="flex flex-col gap-2 mt-4">
              <Button
                variant="outline"
                onClick={handleResendEmail}
                className="w-full mt-4"
                disabled={isLoading}
                loading={isLoading}
              >
                {t("auth.verifyEmail.resendEmail")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
