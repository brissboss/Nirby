"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useListFormSchema } from "../hooks/use-list-form-schema";
import { listFormValuesToBody } from "../utils/list-form.utils";

import { ListFormFields } from "./list-form-fields";
import { ListFormLayout } from "./list-form-layout";

import { Button, Form } from "@/components/ui";
import { useUpdateList } from "@/features/lists";
import type { CreateListFormData } from "@/features/lists/schemas/lists.schema";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

export type EditListFormProps = {
  listId: string;
  defaultValues: CreateListFormData;
  embedded?: boolean;
  onUpdated?: () => void;
};

export function EditListForm({
  listId,
  defaultValues,
  embedded = true,
  onUpdated,
}: EditListFormProps) {
  const tLists = useTranslations("lists");
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: updateList, isPending } = useUpdateList();
  const listFormSchema = useListFormSchema();

  const form = useForm<CreateListFormData>({
    resolver: standardSchemaResolver(listFormSchema),
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);

  async function onSubmit(values: CreateListFormData) {
    try {
      await updateList({
        listId,
        body: listFormValuesToBody(values),
      });

      toast.success(tLists("updateList.success"));
      onUpdated?.();
    } catch (error) {
      toast.error(tLists("updateList.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <ListFormLayout embedded={embedded}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <ListFormFields control={form.control} />

          <div className={cn("mt-2", embedded && "w-full")}>
            <Button
              type="submit"
              disabled={isPending}
              loading={isPending}
              className={cn(embedded && "w-full")}
            >
              {tLists("edit.submit")}
            </Button>
          </div>
        </form>
      </Form>
    </ListFormLayout>
  );
}
