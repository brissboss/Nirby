"use client";

import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import {
  LIST_VISIBILITY_VALUES,
  listConstraints,
} from "@/features/lists/constants/lists.constants";
import type { ListVisibility } from "@/features/lists/constants/lists.constants";
import type { CreateListFormData } from "@/features/lists/schemas/lists.schema";

type ListFormFieldsProps = {
  control: Control<CreateListFormData>;
  disabled?: boolean;
};

/** Shared name, description, and visibility fields for list create/edit forms. */
export function ListFormFields({ control, disabled = false }: ListFormFieldsProps) {
  const tLists = useTranslations("lists");

  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tLists("fields.name")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                maxLength={listConstraints.name.max}
                autoComplete="off"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tLists("fields.description")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                disabled={disabled}
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
        control={control}
        name="visibility"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tLists("fields.visibility")}</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as ListVisibility)}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger disabled={disabled}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
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
    </>
  );
}
