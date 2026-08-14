"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
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
import {
  buildListsNavigationSearchParams,
  canEditList,
  useAddPoiToList,
  useLists,
} from "@/features/lists";
import { poiPhotoFileSchema } from "@/features/upload";
import { useErrorMessage } from "@/hooks/use-error-message";
import { cn } from "@/lib/utils";

/** The picker is not paginated: lists are fetched in a single page. */
const MAX_PICKER_LISTS = 100;

export type CreatePoiFormProps = {
  closeDialog?: () => void;
  onCreated?: (poiId: string) => void;
  /** When set, the created POI is added to this list after create. */
  listId?: string;
  /** Map-picked coordinates; never shown in the form UI. */
  coordinates: { latitude: number; longitude: number };
};

export function CreatePoiForm({ closeDialog, onCreated, listId, coordinates }: CreatePoiFormProps) {
  const tPoi = useTranslations("poi");
  const tLists = useTranslations("lists");
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const getErrorMessage = useErrorMessage();
  const { mutateAsync: createPoi, isPending: isCreating } = useCreatePoi();
  const { mutateAsync: uploadPoiPhoto, isPending: isUploading } = useUploadPoiPhoto();
  const { mutateAsync: addPoiToList, isPending: isAdding } = useAddPoiToList();
  const shouldPickList = !listId;
  const poiFormSchema = usePoiFormSchema({ requireListId: shouldPickList });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const {
    data: listsData,
    isPending: isListsPending,
    isError: isListsError,
  } = useLists({ limit: MAX_PICKER_LISTS });

  const editableLists = useMemo(
    () => (listsData?.lists ?? []).filter((list) => canEditList(list.role)),
    [listsData?.lists]
  );

  const form = useForm<CreatePoiFormData>({
    resolver: standardSchemaResolver(poiFormSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      visibility: DEFAULT_POI_VISIBILITY,
      category: undefined,
      listId: listId ?? "",
    },
  });

  const isPending = isCreating || isUploading || isAdding;
  const canSubmit =
    !isPending &&
    (!shouldPickList || (!isListsPending && !isListsError && editableLists.length > 0));

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

      const targetListId = listId ?? values.listId?.trim();

      if (targetListId && poi.id) {
        try {
          await addPoiToList({ listId: targetListId, body: { poiId: poi.id } });
        } catch (error) {
          toast.error(tLists("addPoi.error"), {
            description: getErrorMessage(error),
          });
          return;
        }

        if (shouldPickList) {
          toast.success(tLists("addPoi.success"), {
            action: {
              label: tLists("addPoi.viewList"),
              onClick: () =>
                router.push(buildListsNavigationSearchParams(searchParams, targetListId)),
            },
          });
        } else {
          toast.success(tLists("addPoi.success"));
        }
      } else {
        toast.success(tPoi("createPoi.success"));
      }

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
          listSelect={
            shouldPickList
              ? {
                  lists: editableLists.map((list) => ({ id: list.id, name: list.name })),
                  isLoading: isListsPending,
                  isError: isListsError,
                }
              : undefined
          }
        />

        <div className={cn("mt-2 flex flex-col gap-2 md:flex-row md:justify-end")}>
          {closeDialog ? (
            <Button variant="outline" type="button" onClick={closeDialog} disabled={isPending}>
              {t("common.buttons.cancel")}
            </Button>
          ) : null}
          <Button type="submit" disabled={!canSubmit} loading={isPending}>
            {tPoi("create.submit")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
