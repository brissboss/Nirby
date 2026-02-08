import { useEffect, useRef } from "react";

import { ItemGroup, ItemSeparator, PoiItemComponent } from "@/components";
import { useSearchPlace } from "@/features/browse";
import { useMapSelection } from "@/features/map";
import { GooglePlace } from "@/lib/api";
import type { PoiItem } from "@/types/poi";

export function SearchResults() {
  const { data } = useSearchPlace();
  const { selectedPoiId, selectedSource, setSelected } = useMapSelection();
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedSource === "search" && selectedPoiId) {
      selectedRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedSource, selectedPoiId]);

  const getPoiItem = (place: GooglePlace): PoiItem => {
    return {
      placeId: place.placeId ?? "",
      name: place.name ?? "",
      address: place.address ?? "",
      rating: place.rating ?? null,
    };
  };

  const handleClick = (placeId: string | null) => {
    if (placeId == null) return;
    setSelected(placeId, "search");
  };

  if (!data || data?.places?.length === 0) {
    return <div>No results found</div>;
  }

  return (
    <ItemGroup>
      {data.places.map((place, index) => {
        const placeId = place.placeId ?? "";
        const isSelected = selectedSource === "search" && selectedPoiId === placeId;

        return (
          <div ref={isSelected ? selectedRef : null} key={place.placeId}>
            <PoiItemComponent
              item={getPoiItem(place)}
              onClick={() => handleClick(placeId)}
              isSelected={isSelected}
            />
            {index < data.places.length - 1 && <ItemSeparator />}
          </div>
        );
      })}
    </ItemGroup>
  );
}
