import { buildShellMapModeSearchParams, parseShellMapMode } from "../constants/shell.constants";

import { useUrlParamState } from "@/lib/navigation";
import { SHELL_MAP_MODE_PARAM } from "@/lib/navigation/search-params";

export function useShellMapModeUrl(mapMode: boolean, setMapModeState: (mapMode: boolean) => void) {
  const { setValueAndPush: setMapMode } = useUrlParamState({
    param: SHELL_MAP_MODE_PARAM,
    value: mapMode,
    setValue: setMapModeState,
    parse: (raw) => parseShellMapMode(raw),
    buildHref: (current, next) => buildShellMapModeSearchParams(current, next),
  });
  return { setMapMode };
}
