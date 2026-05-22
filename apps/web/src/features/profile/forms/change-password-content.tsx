"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
} from "@/components/ui";
import { useAuth, type ChangePasswordFormData, createChangePasswordSchema } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

export function ChangePasswordContent({
  closeDialog,
  embedded = false,
}: {
  closeDialog: () => void;
  embedded?: boolean;
}) {
  const tProfile = useTranslations("profile");
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();
  const { changePassword } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const changePasswordSchema = useMemo(
    () =>
      createChangePasswordSchema({
        requiredPassword: t("errors.validation.formErrors.requiredPassword"),
        passwordTooShort: t("errors.validation.formErrors.passwordTooShort"),
        newPasswordSameAsOldPassword: t(
          "errors.validation.formErrors.newPasswordSameAsOldPassword"
        ),
      }),
    [t]
  );

  const form = useForm<ChangePasswordFormData>({
    resolver: standardSchemaResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormData) {
    try {
      await changePassword(values.oldPassword, values.newPassword);
      toast.success(tProfile("changePassword.success"));
      closeDialog();
    } catch (error) {
      toast.error(tProfile("changePassword.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className={cn(!embedded && "pt-4")}>
      <div
        className={cn(
          "grid gap-6",
          !embedded && "py-4 md:py-0 mb-[env(safe-area-inset-bottom,0.5rem)]"
        )}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md lg:text-sm">
                    {tProfile("changePassword.oldPassword")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="pr-12 lg:pr-10"
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
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md lg:text-sm">
                    {tProfile("changePassword.newPassword")}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        {...field}
                        className="pr-12 lg:pr-10"
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

            {!embedded && <Separator className="my-4 md:my-2" />}

            <div
              className={cn(
                "flex gap-2",
                embedded ? "flex-col" : "flex-col md:flex-row justify-end"
              )}
            >
              {!embedded && (
                <Button variant="outline" type="button" onClick={closeDialog}>
                  {t("common.buttons.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                loading={form.formState.isSubmitting}
                className={cn(embedded && "w-full")}
              >
                {tProfile("changePassword.save")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
