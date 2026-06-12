import {
  buildShellViewSearchParams,
  parseShellView,
  SHELL_VIEW_PARAM,
} from "../constants/shell.constants";
import type { ShellView } from "../types/shell.types";

import { useUrlParamState } from "@/lib/navigation";

export function useShellViewUrl(view: ShellView, setViewState: (view: ShellView) => void) {
  const { setValueAndPush: setView } = useUrlParamState({
    param: SHELL_VIEW_PARAM,
    value: view,
    setValue: setViewState,
    parse: (raw) => parseShellView(raw),
    buildHref: (current, next) => buildShellViewSearchParams(current, next),
  });
  return { setView };
}
