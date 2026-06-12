"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useListFormSchema } from "../hooks/use-list-form-schema";
import { listFormValuesToBody } from "../utils/list-form.utils";

import { ListFormFields } from "./list-form-fields";
import { ListFormLayout } from "./list-form-layout";

import { Button, Form } from "@/components/ui";
import { DEFAULT_LIST_VISIBILITY, useCreateList } from "@/features/lists";
import type { CreateListFormData } from "@/features/lists/schemas/lists.schema";
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
  const listFormSchema = useListFormSchema();

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
      const { list } = await createList(listFormValuesToBody(values));

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
    <ListFormLayout embedded={embedded}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <ListFormFields control={form.control} />

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
    </ListFormLayout>
  );
}
