import { ItemGroup, ItemSeparator, PoiItemComponent } from "@/components";
import { useSearchPlace } from "@/features/browse";
import { GooglePlace } from "@/lib/api";
import type { PoiItem } from "@/types/poi";

export function SearchResults() {
  const { data } = useSearchPlace();

  const getPoiItem = (place: GooglePlace): PoiItem => {
    return {
      placeId: place.placeId ?? "",
      name: place.name ?? "",
      address: place.address ?? "",
      rating: place.rating ?? null,
    };
  };

  if (!data || data?.places?.length === 0) {
    return <div>No results found</div>;
  }

  return (
    <ItemGroup>
      {data.places.map((place, index) => (
        <div key={place.placeId}>
          <PoiItemComponent item={getPoiItem(place)} onClick={() => {}} />
          {index < data.places.length - 1 && <ItemSeparator />}
        </div>
      ))}
    </ItemGroup>
  );
}
