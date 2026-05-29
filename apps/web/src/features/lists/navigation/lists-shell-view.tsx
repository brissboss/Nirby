"use client";

import { useState } from "react";

import type { ListsSection } from "../types/lists-section.types";
import { DEFAULT_LISTS_SECTION } from "../types/lists-section.types";
import { ListsCreateView } from "../views/lists-create-view";
import { ListsIndexView } from "../views/lists-index-view";

export function ListsShellView() {
  const [section, setSection] = useState<ListsSection>(DEFAULT_LISTS_SECTION);

  const goIndex = () => setSection("index");
  const goCreate = () => setSection("create");

  switch (section) {
    case "create":
      return <ListsCreateView onBack={goIndex} />;
    case "index":
    default:
      return <ListsIndexView onCreate={goCreate} />;
  }
}
