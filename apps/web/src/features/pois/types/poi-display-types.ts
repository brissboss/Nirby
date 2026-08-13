import type { GetSavedPoisResponse, GooglePlace, Poi } from "@/lib/api";

export type SavedPoiListItem = GetSavedPoisResponse["savedPois"][number];

export type PoiSource = "custom" | "google";

export type PoiPhoto = { kind: "url"; url: string } | { kind: "google-ref"; photoRef: string };

export type OpeningHoursPeriod = {
  open: { day: number; hour: number; minute: number };
  close: { day: number; hour: number; minute: number };
};

export type PoiOpeningHours = {
  isOpen: boolean;
  nextOpenAt: string | null;
};

export type PoiDisplayData = {
  id: string;
  name: string;
  address: string | null;
  category: string | null;
  source: PoiSource;
  photo: PoiPhoto | null;
  openingHours: PoiOpeningHours | null;
};

export type { Poi, GooglePlace };
