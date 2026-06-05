import {
  buildListsNavigationSearchParams,
  LIST_ID_PARAM,
  parseListId,
} from "../constants/lists.constants";

import { useUrlParamState } from "@/lib/navigation";

export function useListSectionUrl(
  listId: string | null,
  setListIdState: (listId: string | null) => void
) {
  const { setValueAndPush: setListId } = useUrlParamState({
    param: LIST_ID_PARAM,
    value: listId,
    setValue: setListIdState,
    parse: parseListId,
    buildHref: (current, next) => buildListsNavigationSearchParams(current, next),
  });

  return { setListId };
}
