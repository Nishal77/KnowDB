"use client";

import { ChevronRight, Database } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SchemaPanel() {
  const [isOpen, setIsOpen] = useState(false);

  // Mock schema data
  const schema = {
    collections: [
      {
        name: "users",
        fields: ["_id", "name", "email", "createdAt"],
      },
      {
        name: "orders",
        fields: ["_id", "userId", "total", "status", "createdAt"],
      },
    ],
  };

  return (
    <div
      className={cn(
        "fixed right-0 top-14 bottom-0 w-80 border-l border-border bg-background transition-transform duration-300 z-10",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className={cn(
          "absolute left-0 top-4 -translate-x-full rounded-l-none rounded-r-md border border-l-0",
          "h-12 w-8"
        )}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </Button>

      <div className="p-4 h-full overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5" />
          <h2 className="font-semibold">Database Schema</h2>
        </div>

        <div className="space-y-4">
          {schema.collections.map((collection) => (
            <div key={collection.name} className="border rounded-lg p-3">
              <h3 className="font-medium text-sm mb-2">{collection.name}</h3>
              <div className="space-y-1">
                {collection.fields.map((field) => (
                  <div
                    key={field}
                    className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted"
                  >
                    {field}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

