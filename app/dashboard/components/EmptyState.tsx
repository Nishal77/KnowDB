"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { EXAMPLE_QUERIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      {/* Icon */}
      <div className="mb-8 flex items-center justify-center">
        <Image
          src="/image1.png"
          alt="Database"
          width={64}
          height={64}
          className="object-contain"
        />
      </div>
      
      {/* Title */}
      <h2 className="text-2xl font-semibold mb-3 text-foreground tracking-tight">
        Ask Your Database
      </h2>
      
      {/* Subtitle */}
      <p className="text-muted-foreground text-center mb-10 max-w-md text-sm">
        Ask questions in natural language and get instant insights from your MongoDB data.
      </p>

      {/* Example Queries */}
      <div className="w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {EXAMPLE_QUERIES.map((query, index) => (
            <div
              key={index}
              className={cn(
                "text-left p-3.5 rounded-lg",
                "border border-border/50 bg-muted/20",
                "overflow-hidden"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-muted-foreground/50" />
                </div>
                <span className="text-foreground/70 text-sm truncate whitespace-nowrap">
                  {query}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

