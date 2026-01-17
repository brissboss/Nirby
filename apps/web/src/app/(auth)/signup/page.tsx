"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useErrorMessage } from "@/hooks/use-error-message";
import { useAuth } from "@/lib/auth";
import { createLoginSignupSchema, type LoginSignupFormData } from "@/schemas/auth.schema";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signup, resendEmail } = useAuth();
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();

  const signupSchema = useMemo(
    () =>
      createLoginSignupSchema({
        requiredEmail: t("errors.validation.formErrors.requiredEmail"),
        invalidEmail: t("errors.validation.formErrors.invalidEmail"),
        requiredPassword: t("errors.validation.formErrors.requiredPassword"),
        passwordTooShort: t("errors.validation.formErrors.passwordTooShort"),
      }),
    [t]
  );

  const form = useForm<LoginSignupFormData>({
    resolver: standardSchemaResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginSignupFormData) {
    try {
      await signup(values.email, values.password);
      setEmailSent(true);
    } catch (error) {
      toast.error(t("auth.signup.signupError"), {
        description: getErrorMessage(error),
      });
    }
  }

  async function handleResendEmail() {
    setIsLoading(true);
    try {
      const email = form.getValues("email");

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

  function handleBack() {
    setEmailSent(false);
    form.reset();
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background relative">
      {emailSent && (
        <Button variant="ghost" className="absolute top-11 left-4" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
          {t("common.buttons.back")}
        </Button>
      )}

      <div className="w-full max-w-md lg:max-w-sm space-y-8 lg:space-y-6">
        {emailSent ? (
          <div className="space-y-2 text-center">
            <Mail className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{t("auth.signup.emailSentTitle")}</h1>
            <p className="text-muted-foreground text-md lg:text-sm">
              {t("auth.signup.emailSentDescription")}
            </p>
            <Button
              variant="outline"
              onClick={handleResendEmail}
              className="w-full h-12 lg:h-10 text-lg lg:text-sm font-semibold mt-4"
              disabled={isLoading}
              loading={isLoading}
            >
              {t("auth.verifyEmail.resendEmail")}
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">{t("auth.signup.title")}</h1>
              <p className="text-muted-foreground text-md lg:text-sm">
                {t("auth.signup.description")}
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md lg:text-sm">
                        {t("common.labels.email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("common.labels.emailPlaceholder")}
                          {...field}
                          className="h-12 lg:h-10 text-md lg:text-sm px-4 lg:px-3"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-md lg:text-sm">
                        {t("common.labels.password")}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            {...field}
                            className="h-12 lg:h-10 text-md lg:text-sm px-4 lg:px-3 pr-12 lg:pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 lg:right-2 top-0 lg:top-2 h-full lg:h-6 w-12 lg:w-6 hover:bg-transparent"
                            onClick={() => setShowPassword((prev) => !prev)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-6 w-6 lg:h-4 lg:w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-6 w-6 lg:h-4 lg:w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword
                                ? t("auth.general.hidePassword")
                                : t("auth.general.showPassword")}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full h-12 lg:h-10 text-lg lg:text-sm font-semibold mt-4"
                  disabled={form.formState.isSubmitting}
                  loading={form.formState.isSubmitting}
                >
                  {t("auth.signup.signup")}
                </Button>
              </form>
            </Form>

            <div className="text-center text-base lg:text-sm pt-4">
              <span className="text-muted-foreground">{t("auth.signup.noAccount")} </span>
              <Link href="/login" className="font-semibold text-primary hover:underline">
                {t("auth.signup.login")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
