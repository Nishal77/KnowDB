"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export function useAutoScroll<T>(deps: T[]): RefObject<HTMLDivElement> {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [deps]);

  return scrollRef;
}

