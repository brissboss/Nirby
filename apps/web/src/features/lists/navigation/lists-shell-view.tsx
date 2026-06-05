"use client";

import { useState } from "react";

import type { ListsSection } from "../types/lists-section.types";
import { DEFAULT_LISTS_SECTION } from "../types/lists-section.types";
import { ListsCreateView } from "../views/lists-create-view";
import { ListsDetailView } from "../views/lists-detail-view";
import { ListsEditView } from "../views/lists-edit-view";
import { ListsIndexView } from "../views/lists-index-view";

export function ListsShellView() {
  const [section, setSection] = useState<ListsSection>(DEFAULT_LISTS_SECTION);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  const goIndex = () => {
    setSelectedListId(null);
    setSection("index");
  };

  const goCreate = () => setSection("create");
  const goEdit = () => setSection("edit");

  const goDetail = (listId: string) => {
    setSelectedListId(listId);
    setSection("detail");
  };

  switch (section) {
    case "detail":
      if (!selectedListId) return <ListsIndexView onCreate={goCreate} onSelectList={goDetail} />;
      return (
        <ListsDetailView
          listId={selectedListId}
          onBack={goIndex}
          onEdit={goEdit}
          onDelete={goIndex}
        />
      );
    case "edit":
      if (!selectedListId) {
        return <ListsIndexView onCreate={goCreate} onSelectList={goDetail} />;
      }
      return <ListsEditView listId={selectedListId} onBack={() => setSection("detail")} />;
    case "create":
      return <ListsCreateView onBack={goIndex} />;
    case "index":
    default:
      return <ListsIndexView onCreate={goCreate} onSelectList={goDetail} />;
  }
}
