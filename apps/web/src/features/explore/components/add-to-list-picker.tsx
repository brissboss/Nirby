"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  Skeleton,
} from "@/components/ui";
import {
  buildListsNavigationSearchParams,
  canEditList,
  useAddPoiToList,
  useLists,
  type ListSummary,
} from "@/features/lists";
import { ListVisibilityBadge } from "@/features/lists/components/list-visibility-badge";
import { useErrorMessage } from "@/hooks/use-error-message";
import { useMediaQuery } from "@/hooks/use-media-query";
import { getErrorCode } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

/** The picker is not paginated: lists are fetched in a single page. */
const MAX_PICKER_LISTS = 100;

export type AddToListTarget = {
  googlePlaceId: string;
  placeName: string;
};

type AddToListPickerProps = AddToListTarget & {
  savedListIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Saves a Google place into one of the user's editable lists. */
export function AddToListPicker(props: AddToListPickerProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? <AddToListDrawer {...props} /> : <AddToListDialog {...props} />;
}

function useAddToListPicker({ googlePlaceId, onOpenChange }: AddToListPickerProps) {
  const tExplore = useTranslations("explore");
  const getErrorMessage = useErrorMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const { data, isPending, isError } = useLists({ limit: MAX_PICKER_LISTS });
  const { mutateAsync: addPoi, isPending: isAdding } = useAddPoiToList();

  const editableLists = useMemo(
    () => (data?.lists ?? []).filter((list) => canEditList(list.role)),
    [data?.lists]
  );

  function close() {
    setSelectedListId(null);
    onOpenChange(false);
  }

  async function handleAdd() {
    const selectedList = editableLists.find((list) => list.id === selectedListId);
    if (!selectedList || isAdding) return;

    try {
      await addPoi({ listId: selectedList.id, body: { googlePlaceId } });
      toast.success(tExplore("addToList.success", { listName: selectedList.name }), {
        action: {
          label: tExplore("addToList.viewList"),
          onClick: () => router.push(buildListsNavigationSearchParams(searchParams, selectedList.id)),
        },
      });
      close();
    } catch (error) {
      if (getErrorCode(error) === "POI_ALREADY_SAVED") {
        toast.info(tExplore("addToList.alreadySaved"));
        close();
        return;
      }

      toast.error(tExplore("addToList.error"), { description: getErrorMessage(error) });
    }
  }

  return {
    editableLists,
    isPending,
    isError,
    selectedListId,
    setSelectedListId,
    isAdding,
    canSubmit: selectedListId !== null && !isAdding,
    handleAdd,
    handleOpenChange: (nextOpen: boolean) => (nextOpen ? onOpenChange(true) : close()),
  };
}

type PickerState = ReturnType<typeof useAddToListPicker>;

function AddToListPickerBody({
  editableLists,
  isPending,
  isError,
  selectedListId,
  setSelectedListId,
  savedListIds,
}: PickerState & { savedListIds: string[] }) {
  const tExplore = useTranslations("explore");

  if (isPending) {
    return (
      <div className="flex flex-col gap-2 py-2" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-md" />
        ))}
        <p className="text-center text-xs text-muted-foreground">
          {tExplore("addToList.picker.loading")}
        </p>
      </div>
    );
  }

  if (isError || editableLists.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {tExplore("addToList.picker.empty")}
      </p>
    );
  }

  return (
    <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto py-1">
      {editableLists.map((list) => (
        <li key={list.id}>
          <ListOption
            list={list}
            isSelected={selectedListId === list.id}
            isAlreadySaved={savedListIds.includes(list.id)}
            onSelect={() => setSelectedListId(list.id)}
          />
        </li>
      ))}
    </ul>
  );
}

function ListOption({
  list,
  isSelected,
  isAlreadySaved,
  onSelect,
}: {
  list: ListSummary;
  isSelected: boolean;
  isAlreadySaved: boolean;
  onSelect: () => void;
}) {
  const tExplore = useTranslations("explore");

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-foreground/15 hover:bg-muted/40"
      )}
    >
      <span className="min-w-0 truncate font-medium">{list.name}</span>
      <div className="flex shrink-0 items-center gap-2">
        {isAlreadySaved ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {tExplore("addToList.picker.alreadyInList")}
          </Badge>
        ) : null}
        <ListVisibilityBadge visibility={list.visibility} />
      </div>
    </button>
  );
}

function PickerActions({ state }: { state: PickerState }) {
  const tExplore = useTranslations("explore");
  const tCommon = useTranslations("common");

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => state.handleOpenChange(false)}
        disabled={state.isAdding}
      >
        {tCommon("buttons.cancel")}
      </Button>
      <Button
        type="button"
        disabled={!state.canSubmit}
        loading={state.isAdding}
        onClick={state.handleAdd}
      >
        {tExplore("addToList.picker.submit")}
      </Button>
    </>
  );
}

function AddToListDialog(props: AddToListPickerProps) {
  const tExplore = useTranslations("explore");
  const state = useAddToListPicker(props);

  return (
    <Dialog open={props.open} onOpenChange={state.handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tExplore("addToList.picker.title")}</DialogTitle>
          <DialogDescription>
            {tExplore("addToList.picker.description", { placeName: props.placeName })}
          </DialogDescription>
        </DialogHeader>

        <AddToListPickerBody {...state} savedListIds={props.savedListIds} />

        <DialogFooter>
          <PickerActions state={state} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddToListDrawer(props: AddToListPickerProps) {
  const tExplore = useTranslations("explore");
  const state = useAddToListPicker(props);

  return (
    <Drawer open={props.open} onOpenChange={state.handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{tExplore("addToList.picker.title")}</DrawerTitle>
          <DrawerDescription>
            {tExplore("addToList.picker.description", { placeName: props.placeName })}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4">
          <AddToListPickerBody {...state} savedListIds={props.savedListIds} />
        </div>

        {/* Reversed so the primary action sits on top, within thumb reach. */}
        <DrawerFooter className="flex-col-reverse">
          <PickerActions state={state} />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
