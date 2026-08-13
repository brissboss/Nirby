import type { GetListsResponse } from "@/lib/api";

/** A list as returned by `GET /list`. */
export type ListSummary = GetListsResponse["lists"][number];
