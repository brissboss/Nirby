import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useSearchPlace } from "@/features/browse/hooks";
import { useMap, useSearchLocation, getDistanceMeters } from "@/features/map";
import { useErrorMessage } from "@/hooks/use-error-message";

const SEARCH_HERE_DISTANCE_THRESHOLD_METERS = 1000;

export function SearchHereButton() {
  const { map } = useMap();
  const { lastSearchQueryText, lastSearchLocation, data, mutate, isPending } = useSearchPlace();
  const getSearchLocation = useSearchLocation();
  const getErrorMessage = useErrorMessage();
  const t = useTranslations();
  const [shouldShow, setShouldShow] = useState(false);
  const ignoreMoveendUntilRef = useRef(0);

  useEffect(() => {
    if (data?.places?.length) {
      ignoreMoveendUntilRef.current = Date.now() + 2000;
    }
  }, [data?.places?.length]);

  useEffect(() => {
    if (!map || !lastSearchLocation) return;

    const checkDistance = () => {
      if (Date.now() < ignoreMoveendUntilRef.current) return;

      const center = map.getCenter();
      const dist = getDistanceMeters(lastSearchLocation, { lat: center.lat, lng: center.lng });
      setShouldShow(dist > SEARCH_HERE_DISTANCE_THRESHOLD_METERS);
    };

    checkDistance();
    map.on("moveend", checkDistance);

    return () => {
      map.off("moveend", checkDistance);
    };
  }, [map, lastSearchLocation, lastSearchQueryText, data?.places?.length]);

  if (!map || !lastSearchQueryText || !lastSearchLocation || !data?.places?.length) {
    return null;
  }

  if (!shouldShow) return null;

  return (
    <Button
      variant="outline"
      className="rounded-xl shadow-xl"
      onClick={() => {
        const location = getSearchLocation();
        mutate(
          {
            searchQuery: lastSearchQueryText,
            ...(location && { lat: location.lat, lng: location.lng }),
          },
          {
            onError: (error) => {
              toast.error(getErrorMessage(error));
            },
            onSettled: () => {
              setShouldShow(false);
            },
          }
        );
      }}
      loading={isPending}
    >
      <Search />
      {t("common.buttons.searchHere")}
    </Button>
  );
}
