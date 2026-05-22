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
import { useAuth, type DeleteAccountFormData, createDeleteAccountSchema } from "@/features/auth";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

export function DeleteAccountContent({
  closeDialog,
  embedded = false,
}: {
  closeDialog: () => void;
  embedded?: boolean;
}) {
  const tProfile = useTranslations("profile");
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();
  const { deleteAccount } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

  const deleteAccountSchema = useMemo(
    () =>
      createDeleteAccountSchema({
        requiredPassword: t("errors.validation.formErrors.requiredPassword"),
      }),
    [t]
  );

  const form = useForm<DeleteAccountFormData>({
    resolver: standardSchemaResolver(deleteAccountSchema),
    defaultValues: {
      password: "",
    },
  });

  async function onSubmit(values: DeleteAccountFormData) {
    try {
      await deleteAccount(values.password);
      toast.success(tProfile("deleteAccount.success"));
      closeDialog();
    } catch (error) {
      toast.error(tProfile("deleteAccount.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", !embedded && "")}>
      <div
        className={cn(
          "grid gap-6",
          !embedded && "py-4 md:py-0 mb-[env(safe-area-inset-bottom,0.5rem)]"
        )}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="password">{t("common.labels.password")}</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="password"
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
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!embedded && <Separator className="my-4 md:hidden" />}

            <div
              className={cn(
                "flex gap-2",
                embedded ? "flex-col" : "flex-col md:flex-row justify-end"
              )}
            >
              {!embedded && (
                <Button type="button" variant="outline" onClick={closeDialog}>
                  {t("common.buttons.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                variant="destructive"
                disabled={form.formState.isSubmitting}
                loading={form.formState.isSubmitting}
                className={cn(embedded && "w-full")}
              >
                {tProfile("deleteAccount.delete")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
