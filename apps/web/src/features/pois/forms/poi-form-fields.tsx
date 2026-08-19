"use client";

import { ImagePlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import type { Control } from "react-hook-form";

import { PoiPhoto } from "../components/poi-photo";
import {
  POI_CATEGORY_VALUES,
  POI_VISIBILITY_VALUES,
  poiConstraints,
  type PoiCategory,
  type PoiVisibility,
} from "../constants/pois.constants";
import type { CreatePoiFormData } from "../schemas/pois.schema";

import {
  Button,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@/components/ui";

export type PoiFormListOption = {
  id: string;
  name: string;
};

type PoiFormListSelect = {
  lists: PoiFormListOption[];
  isLoading: boolean;
  isError: boolean;
};

type PoiFormFieldsProps = {
  control: Control<CreatePoiFormData>;
  disabled?: boolean;
  photoFile: File | null;
  onPhotoChange: (file: File | null) => void;
  /** Current POI photo shown while editing, until a new file is picked. */
  existingPhotoUrl?: string;
  /** When set, the user picks a destination list (no list is currently open). */
  listSelect?: PoiFormListSelect;
};

/** Shared fields for custom POI create and edit forms. Lat/lng are map-picked, not shown. */
export function PoiFormFields({
  control,
  disabled = false,
  photoFile,
  onPhotoChange,
  existingPhotoUrl,
  listSelect,
}: PoiFormFieldsProps) {
  const tPoi = useTranslations("poi");
  const photoInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {listSelect ? (
        <PoiListField control={control} disabled={disabled} listSelect={listSelect} />
      ) : null}

      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tPoi("fields.name")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                disabled={disabled}
                maxLength={poiConstraints.name.max}
                autoComplete="off"
                placeholder={tPoi("placeholders.name")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tPoi("fields.address")}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                disabled={disabled}
                maxLength={poiConstraints.address.max}
                autoComplete="street-address"
                placeholder={tPoi("placeholders.address")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tPoi("fields.category")}</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as PoiCategory)}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger disabled={disabled}>
                  <SelectValue placeholder={tPoi("fields.category")} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {POI_CATEGORY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {tPoi(`categories.${value}.label`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-md lg:text-sm">{tPoi("fields.description")}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                disabled={disabled}
                rows={3}
                maxLength={poiConstraints.description.max}
                className="min-h-22 resize-y"
                placeholder={tPoi("placeholders.description")}
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
            <FormLabel className="text-md lg:text-sm">{tPoi("fields.visibility")}</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => field.onChange(value as PoiVisibility)}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger disabled={disabled}>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {POI_VISIBILITY_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {tPoi(`visibility.${value}.label`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-2">
        <p className="text-md font-medium lg:text-sm">{tPoi("photo.title")}</p>
        <p className="text-sm text-muted-foreground">{tPoi("photo.formats")}</p>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          disabled={disabled}
          aria-label={tPoi("photo.title")}
          onChange={(event) => {
            onPhotoChange(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        {existingPhotoUrl && !photoFile ? (
          <div className="relative size-20 overflow-hidden rounded-md">
            <PoiPhoto photo={{ kind: "url", url: existingPhotoUrl }} alt={tPoi("photo.title")} />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => photoInputRef.current?.click()}
          >
            <ImagePlusIcon className="size-4" aria-hidden />
            {existingPhotoUrl ? tPoi("photo.replaceHint") : tPoi("photo.hint")}
          </Button>
          {photoFile ? (
            <span className="text-sm text-muted-foreground">{photoFile.name}</span>
          ) : null}
        </div>
      </div>
    </>
  );
}

function PoiListField({
  control,
  disabled,
  listSelect,
}: {
  control: Control<CreatePoiFormData>;
  disabled: boolean;
  listSelect: PoiFormListSelect;
}) {
  const tPoi = useTranslations("poi");
  const hasLists = listSelect.lists.length > 0;
  const showEmpty = !listSelect.isLoading && (listSelect.isError || !hasLists);

  return (
    <FormField
      control={control}
      name="listId"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-md lg:text-sm">{tPoi("fields.list")}</FormLabel>
          {showEmpty ? (
            <p className="text-sm text-muted-foreground">
              {listSelect.isError ? tPoi("create.listError") : tPoi("create.listEmpty")}
            </p>
          ) : (
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
              disabled={disabled || listSelect.isLoading}
            >
              <FormControl>
                <SelectTrigger disabled={disabled || listSelect.isLoading}>
                  <SelectValue
                    placeholder={
                      listSelect.isLoading ? tPoi("create.listLoading") : tPoi("placeholders.list")
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {listSelect.lists.map((list) => (
                  <SelectItem key={list.id} value={list.id}>
                    {list.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
