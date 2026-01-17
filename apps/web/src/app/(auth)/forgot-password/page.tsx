"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { ArrowLeft, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { createForgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/auth.schema";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const getErrorMessage = useErrorMessage();

  const [emailSent, setEmailSent] = useState(false);

  const forgotPasswordSchema = useMemo(
    () =>
      createForgotPasswordSchema({
        requiredEmail: t("errors.validation.formErrors.requiredEmail"),
        invalidEmail: t("errors.validation.formErrors.invalidEmail"),
      }),
    [t]
  );

  const form = useForm<ForgotPasswordFormData>({
    resolver: standardSchemaResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: ForgotPasswordFormData) {
    try {
      await forgotPassword(values.email);
      setEmailSent(true);
    } catch (error) {
      toast.error(t("auth.forgotPassword.forgotPasswordError"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background relative">
      <Button variant="ghost" className="absolute top-11 left-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4" />
        {t("common.buttons.back")}
      </Button>
      <div className="w-full max-w-md lg:max-w-sm space-y-8 lg:space-y-6">
        {emailSent ? (
          <div className="space-y-2 text-center">
            <Mail className="w-10 h-10 mx-auto text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              {t("auth.forgotPassword.emailSentTitle")}
            </h1>
            <p className="text-muted-foreground text-md lg:text-sm">
              {t("auth.forgotPassword.emailSentDescription")}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                {t("auth.forgotPassword.title")}
              </h1>
              <p className="text-muted-foreground text-md lg:text-sm">
                {t("auth.forgotPassword.description")}
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
                <Button
                  type="submit"
                  className="w-full h-12 lg:h-10 text-lg lg:text-sm font-semibold mt-4"
                  disabled={form.formState.isSubmitting}
                  loading={form.formState.isSubmitting}
                >
                  {t("common.buttons.send")}
                </Button>
              </form>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
