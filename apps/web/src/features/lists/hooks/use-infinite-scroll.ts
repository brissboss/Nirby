"use client";

import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  enabled?: boolean;
  rootMargin?: string;
};

export function useInfiniteScroll(
  onLoadMore: () => void,
  { enabled = true, rootMargin = "200px" }: UseInfiniteScrollOptions = {}
) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    if (!enabled) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return sentinelRef;
}
