"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DEFAULT_POI_VISIBILITY } from "../constants/pois.constants";
import { useCreatePoi } from "../hooks/use-create-poi";
import { usePoiFormSchema } from "../hooks/use-poi-form-schema";
import { useUploadPoiPhoto } from "../hooks/use-upload-poi-photo";
import type { CreatePoiFormData } from "../schemas/pois.schema";
import { poiFormValuesToBody } from "../utils/poi-form.utils";

import { PoiFormFields } from "./poi-form-fields";

import { Button, Form } from "@/components/ui";
import { poiPhotoFileSchema } from "@/features/upload";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

export type CreatePoiFormProps = {
  closeDialog?: () => void;
  onCreated?: (poiId: string) => void;
};

export function CreatePoiForm({ closeDialog, onCreated }: CreatePoiFormProps) {
  const tPoi = useTranslations("poi");
  const t = useTranslations();
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: createPoi, isPending: isCreating } = useCreatePoi();
  const { mutateAsync: uploadPoiPhoto, isPending: isUploading } = useUploadPoiPhoto();
  const poiFormSchema = usePoiFormSchema();
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const form = useForm<CreatePoiFormData>({
    resolver: standardSchemaResolver(poiFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      latitude: undefined,
      longitude: undefined,
      visibility: DEFAULT_POI_VISIBILITY,
      category: undefined,
    },
  });

  const isPending = isCreating || isUploading;

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

      const { poi } = await createPoi({
        ...poiFormValuesToBody(values),
        ...(photoUrls ? { photoUrls } : {}),
      });

      toast.success(tPoi("createPoi.success"));
      form.reset();
      setPhotoFile(null);
      closeDialog?.();
      if (poi.id) {
        onCreated?.(poi.id);
      }
    } catch (error) {
      toast.error(tPoi("createPoi.error"), {
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
        />

        <div className={cn("mt-2 flex flex-col gap-2 md:flex-row md:justify-end")}>
          {closeDialog ? (
            <Button variant="outline" type="button" onClick={closeDialog} disabled={isPending}>
              {t("common.buttons.cancel")}
            </Button>
          ) : null}
          <Button type="submit" disabled={isPending} loading={isPending}>
            {tPoi("create.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
