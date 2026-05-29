"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
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
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import {
  DEFAULT_LIST_VISIBILITY,
  LIST_VISIBILITY_VALUES,
  listConstraints,
  useCreateList,
} from "@/features/lists";
import type { ListVisibility } from "@/features/lists/constants/lists.constants";
import {
  createListFormSchema,
  type CreateListFormData,
} from "@/features/lists/schemas/lists.schema";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

export type CreateListFormProps = {
  /** Closes the dialog after a successful create. */
  closeDialog?: () => void;
  /** Called with the new list id (e.g. navigate to detail). */
  onCreated?: (listId: string) => void;
  embedded?: boolean;
};

export function CreateListForm({ closeDialog, onCreated, embedded = false }: CreateListFormProps) {
  const tLists = useTranslations("lists");
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: createList, isPending } = useCreateList();

  const listFormSchema = useMemo(
    () =>
      createListFormSchema({
        requiredName: tLists("validation.requiredName"),
        nameTooLong: tLists("validation.nameTooLong"),
        descriptionTooLong: tLists("validation.descriptionTooLong"),
      }),
    [tLists]
  );

  const form = useForm<CreateListFormData>({
    resolver: standardSchemaResolver(listFormSchema),
    defaultValues: {
      name: "",
      description: "",
      visibility: DEFAULT_LIST_VISIBILITY,
    },
  });

  async function onSubmit(values: CreateListFormData) {
    try {
      const { list } = await createList({
        name: values.name,
        description: values.description?.trim() || undefined,
        visibility: values.visibility,
      });

      toast.success(tLists("createList.success"));
      form.reset();
      closeDialog?.();
      onCreated?.(list.id);
    } catch (error) {
      toast.error(tLists("createList.error"), {
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md lg:text-sm">{tLists("fields.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={listConstraints.name.max} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md lg:text-sm">
                    {tLists("fields.description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      maxLength={listConstraints.description.max}
                      className="min-h-22 resize-y"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-md lg:text-sm">
                    {tLists("fields.visibility")}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as ListVisibility)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="z-10000">
                      {LIST_VISIBILITY_VALUES.map((value) => (
                        <SelectItem key={value} value={value}>
                          {tLists(`visibility.${value}.label`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div
              className={cn(
                "flex gap-2 mt-2",
                embedded ? "flex-col" : "flex-col md:flex-row justify-end"
              )}
            >
              {!embedded && closeDialog && (
                <Button variant="outline" type="button" onClick={closeDialog}>
                  {t("common.buttons.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                disabled={isPending}
                loading={isPending}
                className={cn(embedded && "w-full")}
              >
                {tLists("create.submit")}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
