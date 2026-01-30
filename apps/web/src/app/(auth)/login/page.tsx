"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useMemo } from "react";
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
import { useAuth, type LoginSignupFormData, createLoginSignupSchema } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();

  const loginSchema = useMemo(
    () =>
      createLoginSignupSchema({
        invalidEmail: t("errors.validation.formErrors.invalidEmail"),
        requiredPassword: t("errors.validation.formErrors.requiredPassword"),
        passwordTooShort: t("errors.validation.formErrors.passwordTooShort"),
      }),
    [t]
  );

  const form = useForm<LoginSignupFormData>({
    resolver: standardSchemaResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginSignupFormData) {
    try {
      await login(values.email, values.password);
      router.push("/");
    } catch (error) {
      toast.error(t("auth.login.loginError"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md lg:max-w-sm space-y-8 lg:space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">{t("auth.login.title")}</h1>
          <p className="text-muted-foreground text-md lg:text-sm">{t("auth.login.description")}</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 lg:space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md lg:text-sm">{t("common.labels.email")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("common.labels.emailPlaceholder")}
                      {...field}
                      className="px-4 lg:px-3"
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
                  <div className="flex justify-end pt-2 lg:pt-1">
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t("auth.login.forgotPassword")}
                    </Link>
                  </div>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full mt-4"
              disabled={form.formState.isSubmitting}
              loading={form.formState.isSubmitting}
            >
              {t("auth.login.login")}
            </Button>
          </form>
        </Form>

        <div className="text-center text-base lg:text-sm pt-4">
          <span className="text-muted-foreground">{t("auth.login.noAccount")} </span>
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            {t("auth.login.signup")}
          </Link>
        </div>
      </div>
    </div>
  );
}
