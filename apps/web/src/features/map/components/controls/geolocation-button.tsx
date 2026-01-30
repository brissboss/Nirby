"use client";

import { Navigation2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useMap } from "@/features/map";
import { useMediaQuery } from "@/hooks/use-media-query";

export const GeolocationButton = () => {
  const { map } = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleClick = () => {
    if (!map || !navigator.geolocation) return;
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      (error) => {
        if (error.code === 3) {
          navigator.geolocation.getCurrentPosition(
            handleSuccess,
            () => {
              toast.error("Failed to get geolocation");
              setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 }
          );
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSuccess = (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    map?.flyTo({
      center: [longitude, latitude],
      zoom: 15,
      bearing: 0,
      pitch: 0,
      duration: 3000,
    });

    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={!map}
      size={isMobile ? "icon-lg" : "icon"}
      loading={isLoading}
      className="rounded-xl shadow-xl"
    >
      <Navigation2 />
    </Button>
  );
};
