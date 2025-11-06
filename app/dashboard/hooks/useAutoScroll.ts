"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

export function useAutoScroll<T>(deps: T[]): RefObject<HTMLDivElement> {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      // Find the ScrollArea viewport if it exists, otherwise use the element itself
      const viewport = scrollRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
      const scrollElement = viewport || scrollRef.current;
      
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [deps]);

  return scrollRef;
}

