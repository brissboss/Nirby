import { StarIcon } from "lucide-react";
import { useLocale } from "next-intl";

import { Item, ItemContent, ItemDescription, ItemTitle } from "@/components/ui";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { PoiItem } from "@/types/poi";

type PoiItemComponentProps = {
  item: PoiItem;
  onClick: () => void;
};

export function PoiItemComponent({ item, onClick }: PoiItemComponentProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const locale = useLocale();

  return (
    <Item
      onClick={onClick}
      className="hover:bg-muted rounded-none group relative cursor-pointer"
      size={isMobile ? "default" : "sm"}
    >
      <ItemContent>
        <ItemTitle className="w-full">
          <div className="flex items-start justify-between gap-4 w-full">
            <span className="text-base md:text-sm font-medium">{item.name}</span>
            {item.rating ? (
              <div className="flex items-center min-h-6 md:min-h-5">
                <div className="flex items-center gap-1">
                  <StarIcon className="size-4 md:size-3 text-primary" fill="currentColor" />
                  <p className="text-sm md:text-xs text-muted-foreground">
                    {item.rating.toLocaleString(locale)}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </ItemTitle>
        <ItemDescription className="line-clamp-1 md:line-clamp-2">{item.address}</ItemDescription>
      </ItemContent>
    </Item>
  );
}
