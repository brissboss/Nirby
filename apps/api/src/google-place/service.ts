import { Prisma } from "@prisma/client";

import { prisma } from "../db";
import { env } from "../env";
import { ErrorCodes } from "../utils/error-codes";
import { ApiError } from "../utils/errors";

interface GooglePlacePhoto {
  name: string;
  widthPx: number;
  heightPx: number;
}

interface GooglePlaceResponse {
  id: string;
  displayName?: { text: string; languageCode: string };
  editorialSummary?: { text: string; languageCode: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  websiteUri?: string;
  internationalPhoneNumber?: string;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  googleMapsUri?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text: string; languageCode: string };
  photos?: GooglePlacePhoto[];
}

function mapPriceLevelToInt(priceLevel?: string): number | null {
  if (!priceLevel) return null;
  const mapping: Record<string, number> = {
    PRICE_LEVEL_FREE: 0,
    PRICE_LEVEL_INEXPENSIVE: 1,
    PRICE_LEVEL_MODERATE: 2,
    PRICE_LEVEL_EXPENSIVE: 3,
    PRICE_LEVEL_VERY_EXPENSIVE: 4,
  };
  return mapping[priceLevel] ?? null;
}

export function mapGooglePlaceToCache(place: GooglePlaceResponse, language: string) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

  return {
    placeId: place.id,
    name: place.displayName?.text ?? "Unknown",
    nameLang: place.displayName?.languageCode ?? language,
    description: place.editorialSummary?.text ?? null,
    descriptionLang: place.editorialSummary?.languageCode ?? null,
    address: place.formattedAddress ?? null,
    latitude: place.location?.latitude ?? 0,
    longitude: place.location?.longitude ?? 0,
    category: place.primaryType ?? null,
    categoryDisplayName: place.primaryTypeDisplayName?.text ?? null,
    categoryDisplayNameLang: place.primaryTypeDisplayName?.languageCode ?? null,
    website: place.websiteUri ?? null,
    phone: place.internationalPhoneNumber ?? null,
    priceLevel: mapPriceLevelToInt(place.priceLevel),
    openingHours: place.regularOpeningHours ?? Prisma.JsonNull,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
    photoReferences: place.photos?.map((p) => p.name) ?? [],
    googleMapsUri: place.googleMapsUri ?? null,
    cachedAt: now,
    expiresAt,
  };
}

/**
 * Get a place from cache, or fetch from Google API and cache it
 */
export async function getOrFetchPlace(placeId: string, language?: string) {
  const lang = language ?? "en-US";

  const cached = await prisma.googlePlaceCache.findUnique({
    where: { placeId },
  });

  if (cached && cached.expiresAt && cached.expiresAt > new Date()) {
    return cached;
  }

  const googleData = await fetchPlaceDetails(placeId, lang);

  const cacheData = mapGooglePlaceToCache(googleData, lang);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { placeId: _unused, ...updateData } = cacheData;

  const upserted = await prisma.googlePlaceCache.upsert({
    where: { placeId },
    create: cacheData,
    update: updateData,
  });

  return upserted;
}

/**
 * Map Google Places API HTTP status codes to our error codes
 */
function mapGooglePlacesError(
  status: number,
  errorBody: { error?: { message?: string } }
): { code: string; message: string; statusCode: number } {
  switch (status) {
    case 400:
      return {
        code: ErrorCodes.GOOGLE_PLACE_INVALID_ID,
        message: errorBody?.error?.message || "Invalid request to Google Places API",
        statusCode: 400,
      };
    case 401:
      return {
        code: ErrorCodes.GOOGLE_PLACE_API_KEY_REQUIRED,
        message: "Invalid or missing Google Places API key",
        statusCode: 401,
      };
    case 403:
      return {
        code: ErrorCodes.GOOGLE_PLACE_FETCH_ERROR,
        message:
          errorBody?.error?.message ||
          "Google Places API access forbidden (quota exceeded or API not enabled)",
        statusCode: 403,
      };
    case 404:
      return {
        code: ErrorCodes.GOOGLE_PLACE_NOT_FOUND,
        message: "Google Place not found",
        statusCode: 404,
      };
    default:
      return {
        code: ErrorCodes.GOOGLE_PLACE_FETCH_ERROR,
        message: errorBody?.error?.message || `Google Places API error: ${status}`,
        statusCode: status >= 500 ? 500 : status,
      };
  }
}

export async function fetchPlaceDetails(placeId: string, language?: string) {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new ApiError(
      400,
      ErrorCodes.GOOGLE_PLACE_API_KEY_REQUIRED,
      "GOOGLE_PLACES_API_KEY is required"
    );
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?languageCode=${language ?? "en-US"}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask":
            "id,internationalPhoneNumber,formattedAddress,location,rating,googleMapsUri,websiteUri,regularOpeningHours,priceLevel,userRatingCount,displayName,primaryTypeDisplayName,primaryType,editorialSummary,photos",
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const { code, message, statusCode } = mapGooglePlacesError(response.status, errorBody);
      throw new ApiError(statusCode, code, message, errorBody);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    // Re-throw ApiError as-is (already properly formatted)
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors or other unexpected errors
    throw new ApiError(
      500,
      ErrorCodes.GOOGLE_PLACE_FETCH_ERROR,
      "Failed to fetch place details from Google Places API"
    );
  }
}

export async function searchPlaces(
  query: string,
  language?: string,
  location?: { lat: number; lng: number }
) {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new ApiError(
      400,
      ErrorCodes.GOOGLE_PLACE_API_KEY_REQUIRED,
      "GOOGLE_PLACES_API_KEY is required"
    );
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask":
          "places.id,places.internationalPhoneNumber,places.formattedAddress,places.location,places.rating,places.googleMapsUri,places.websiteUri,places.regularOpeningHours,places.priceLevel,places.userRatingCount,places.displayName,places.primaryTypeDisplayName,places.primaryType,places.editorialSummary,places.photos",
      },
      body: JSON.stringify({
        textQuery: query,
        languageCode: language ?? "en-US",
        ...(location && {
          locationBias: {
            circle: {
              center: {
                latitude: location?.lat,
                longitude: location?.lng,
              },
              radius: 1000,
            },
          },
        }),
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const { code, message, statusCode } = mapGooglePlacesError(response.status, errorBody);
      throw new ApiError(statusCode, code, message, errorBody);
    }

    const data = await response.json();

    const transformedPlaces = (data.places ?? []).map((place: GooglePlaceResponse) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { cachedAt, expiresAt, ...rest } = mapGooglePlaceToCache(place, language ?? "en-US");
      return rest;
    });

    return { places: transformedPlaces };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      ErrorCodes.GOOGLE_PLACE_SEARCH_ERROR,
      "Failed to search for Google Places"
    );
  }
}

export async function getPhoto(photoReference: string, maxWidth: number = 400): Promise<Buffer> {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new ApiError(400, ErrorCodes.GOOGLE_PLACE_API_KEY_REQUIRED, "API key required");
  }

  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/${photoReference}/media?maxWidthPx=${maxWidth}&skipHttpRedirect=true&key=${env.GOOGLE_PLACES_API_KEY}`,
      { method: "GET" }
    );

    if (!response.ok) {
      throw new ApiError(
        response.status,
        ErrorCodes.GOOGLE_PLACE_PHOTO_ERROR,
        "Failed to fetch photo"
      );
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      500,
      ErrorCodes.GOOGLE_PLACE_PHOTO_ERROR,
      "Failed to fetch photo from Google Places API"
    );
  }
}
