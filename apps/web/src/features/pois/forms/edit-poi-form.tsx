"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  DEFAULT_POI_VISIBILITY,
  POI_CATEGORY_VALUES,
  type PoiCategory,
  type PoiVisibility,
} from "../constants/pois.constants";
import { usePoiFormSchema } from "../hooks/use-poi-form-schema";
import { useUpdatePoi } from "../hooks/use-update-poi";
import { useUploadPoiPhoto } from "../hooks/use-upload-poi-photo";
import type { CreatePoiFormData } from "../schemas/pois.schema";
import { poiFormValuesToBody } from "../utils/poi-form.utils";

import { PoiFormFields } from "./poi-form-fields";

import { Button, Form } from "@/components/ui";
import { poiPhotoFileSchema } from "@/features/upload";
import { useErrorMessage } from "@/hooks/use-error-message";
import type { Poi } from "@/lib/api";
import { cn } from "@/lib/utils";

export type EditPoiFormProps = {
  poi: Poi & { id: string };
  listId?: string;
  closeDialog?: () => void;
};

function toPoiCategory(value: string | null | undefined): PoiCategory | undefined {
  return POI_CATEGORY_VALUES.includes(value as PoiCategory) ? (value as PoiCategory) : undefined;
}

export function EditPoiForm({ poi, listId, closeDialog }: EditPoiFormProps) {
  const tPoi = useTranslations("poi");
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: updatePoi, isPending: isUpdating } = useUpdatePoi();
  const { mutateAsync: uploadPoiPhoto, isPending: isUploading } = useUploadPoiPhoto();
  const poiFormSchema = usePoiFormSchema();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<CreatePoiFormData>({
    resolver: standardSchemaResolver(poiFormSchema),
    defaultValues: {
      name: poi.name ?? "",
      description: poi.description ?? "",
      address: poi.address ?? "",
      latitude: poi.latitude,
      longitude: poi.longitude,
      visibility: (poi.visibility as PoiVisibility | undefined) ?? DEFAULT_POI_VISIBILITY,
      category: toPoiCategory(poi.category),
    },
  });

  const isPending = isUpdating || isUploading;

  async function onSubmit(values: CreatePoiFormData) {
    try {
      let photoUrls: string[] | undefined;

      if (photoFile) {
        const parsedPhoto = poiPhotoFileSchema.safeParse(photoFile);
        if (!parsedPhoto.success) {
          toast.error(tPoi("photo.uploadError"), {
            description: t(parsedPhoto.error.issues[0]?.message ?? "errors.default"),
          });
          return;
        }

        try {
          const uploaded = await uploadPoiPhoto({ file: photoFile });
          photoUrls = [uploaded.url];
        } catch (error) {
          toast.error(tPoi("photo.uploadError"), {
            description: getErrorMessage(error),
          });
          return;
        }
      }

      await updatePoi({
        poiId: poi.id,
        listId,
        body: {
          ...poiFormValuesToBody(values),
          ...(photoUrls ? { photoUrls } : {}),
        },
      });

      toast.success(tPoi("updatePoi.success"));
      setPhotoFile(null);
      closeDialog?.();
    } catch (error) {
      toast.error(tPoi("updatePoi.error"), {
        description: getErrorMessage(error),
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <PoiFormFields
          control={form.control}
          disabled={isPending}
          photoFile={photoFile}
          onPhotoChange={setPhotoFile}
          existingPhotoUrl={poi.photoUrls?.[0]}
        />

        <div className={cn("mt-2 flex flex-col gap-2 md:flex-row md:justify-end")}>
          {closeDialog ? (
            <Button variant="outline" type="button" onClick={closeDialog} disabled={isPending}>
              {t("common.buttons.cancel")}
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending} loading={isPending}>
            {tPoi("edit.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
