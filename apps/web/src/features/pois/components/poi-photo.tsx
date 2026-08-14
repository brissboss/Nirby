"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPinIcon } from "lucide-react";
import Image from "next/image";

import type { PoiPhoto as PoiPhotoType } from "../types/poi-display-types";

import { getGooglePlacePhoto } from "@/lib/api";
import { cn } from "@/lib/utils";

type PoiPhotoProps = {
  photo: PoiPhotoType;
  alt: string;
  className?: string;
};

function isLocalUploadUrl(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

export function PoiPhoto({ photo, alt, className }: PoiPhotoProps) {
  if (photo.kind === "url") {
    return (
      <Image
        src={photo.url}
        alt={alt}
        width={400}
        height={400}
        loading="lazy"
        // Next.js 16 image optimizer rejects private IPs (local MinIO).
        unoptimized={isLocalUploadUrl(photo.url)}
        className={cn("size-full object-cover", className)}
      />
    );
  }

  return <GooglePlacePhoto photoRef={photo.photoRef} alt={alt} className={className} />;
}

function GooglePlacePhoto({
  photoRef,
  alt,
  className,
}: {
  photoRef: string;
  alt: string;
  className?: string;
}) {
  const {
    data: objectUrl,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["google-place-photo", photoRef],
    queryFn: async () => {
      const response = await getGooglePlacePhoto({
        query: { ref: photoRef, maxWidth: 400 },
        parseAs: "blob",
        cache: "no-store",
      });

      const blob = response.data as Blob | undefined;

      if (blob) {
        const isJpeg = await isValidJpegBlob(blob);
        if (!isJpeg) {
          throw new Error("Invalid JPEG response from photo API");
        }

        return URL.createObjectURL(blob);
      }

      throw response.error;
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  });

  // Blob URLs are not revoked here: React Strict Mode unmount/remount would revoke
  // the URL before <img> finishes loading, causing spurious onError events.

  if (isPending) {
    return <PhotoPlaceholder className={className} />;
  }

  if (isError || !objectUrl) {
    return <PhotoPlaceholder className={className} />;
  }

  return (
    <Image
      src={objectUrl}
      alt={alt}
      width={400}
      height={400}
      loading="lazy"
      className={cn("size-full object-cover", className)}
      unoptimized
    />
  );
}

function PhotoPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn("grid size-full place-items-center bg-muted text-muted-foreground", className)}
      aria-hidden
    >
      <MapPinIcon className="size-5" />
    </div>
  );
}

async function isValidJpegBlob(blob: Blob): Promise<boolean> {
  if (blob.size < 3) return false;

  const header = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
  return header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
}
