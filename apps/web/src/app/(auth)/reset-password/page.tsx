"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
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
import { createResetPasswordSchema, ResetPasswordFormData } from "@/schemas/auth.schema";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const resolvedSearchParams = React.use(searchParams);
  const token = resolvedSearchParams.token;
  const t = useTranslations();
  const { resetPassword } = useAuth();
  const getErrorMessage = useErrorMessage();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const passwordResetSchema = useMemo(
    () =>
      createResetPasswordSchema({
        requiredPassword: t("errors.validation.formErrors.requiredPassword"),
        passwordTooShort: t("errors.validation.formErrors.passwordTooShort"),
      }),
    [t]
  );

  const form = useForm<ResetPasswordFormData>({
    resolver: standardSchemaResolver(passwordResetSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormData) {
    try {
      if (!token) {
        throw new Error("Token is required");
      }
      await resetPassword(token, values.password);
      toast.success(t("auth.resetPassword.resetPasswordSuccess"), {
        description: t("auth.resetPassword.resetPasswordSuccessDescription"),
      });
      router.push("/login");
    } catch (error) {
      toast.error(t("auth.resetPassword.resetPasswordError"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background relative">
      <div className="w-full max-w-md lg:max-w-sm space-y-8 lg:space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.resetPassword.title")}</h1>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:space-y-4">
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
                        className="px-4 lg:px-3 pr-12 lg:pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 lg:right-2 top-0 lg:top-1.5 h-full lg:h-6 w-12 lg:w-6 hover:bg-transparent"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? (
                          <EyeOff className="size-5 lg:size-4 text-muted-foreground" />
                        ) : (
                          <Eye className="size-5 lg:size-4 text-muted-foreground" />
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
              className="w-full mt-4"
              disabled={form.formState.isSubmitting}
              loading={form.formState.isSubmitting}
            >
              {t("auth.resetPassword.resetPassword")}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
