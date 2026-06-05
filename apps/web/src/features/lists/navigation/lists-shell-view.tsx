"use client";

import { useState } from "react";

import { useListSectionUrl } from "../hooks/use-list-section-url";
import type { ListsSection } from "../types/lists-section.types";
import { ListsCreateView } from "../views/lists-create-view";
import { ListsDetailView } from "../views/lists-detail-view";
import { ListsEditView } from "../views/lists-edit-view";
import { ListsIndexView } from "../views/lists-index-view";

type ListsOverlaySection = "create" | "edit" | null;

function resolveSection(listId: string | null, overlay: ListsOverlaySection): ListsSection {
  if (overlay === "create") return "create";
  if (overlay === "edit" && listId) return "edit";
  if (listId) return "detail";
  return "index";
}

export function ListsShellView() {
  const [overlaySection, setOverlaySection] = useState<ListsOverlaySection>(null);
  const [listId, setListIdState] = useState<string | null>(null);
  const { setListId } = useListSectionUrl(listId, setListIdState);
  const section = resolveSection(listId, overlaySection);

  const goIndex = () => {
    setListId(null);
    setOverlaySection(null);
  };

  const goCreate = () => setOverlaySection("create");
  const goEdit = () => setOverlaySection("edit");

  const goDetail = (id: string) => {
    setListId(id);
    setOverlaySection(null);
  };

  switch (section) {
    case "detail":
      if (!listId) return <ListsIndexView onCreate={goCreate} onSelectList={goDetail} />;
      return (
        <ListsDetailView listId={listId} onBack={goIndex} onEdit={goEdit} onDelete={goIndex} />
      );
    case "edit":
      if (!listId) {
        return <ListsIndexView onCreate={goCreate} onSelectList={goDetail} />;
      }
      return <ListsEditView listId={listId} onBack={() => setOverlaySection(null)} />;
    case "create":
      return <ListsCreateView onBack={goIndex} />;
    case "index":
    default:
      return <ListsIndexView onCreate={goCreate} onSelectList={goDetail} />;
  }
}
