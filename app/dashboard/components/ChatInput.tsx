"use client";

import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { EXAMPLE_QUERIES } from "@/lib/constants";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const inputValueRef = useRef<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isLoading && !disabled) {
      inputValueRef.current = e.target.value;
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Get the value from the form's textarea or input element directly
    const form = e.currentTarget;
    const textarea = form.querySelector('textarea') as HTMLTextAreaElement;
    const input = form.querySelector('input[type="text"]') as HTMLInputElement;
    const value = (textarea?.value || input?.value || inputValueRef.current)?.trim();
    
    if (!value || isLoading || disabled) return;
    
    // The component handles the vanish animation and clears the input internally
    // Send the value before it gets cleared
    onSend(value);
    
    // Reset the ref after sending
    inputValueRef.current = "";
  };

  // Create placeholders array with default + example queries
  const placeholders = [
    "Ask a question about your database...",
    ...EXAMPLE_QUERIES,
  ];

  return (
    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 w-full">
      <div className="w-full max-w-[52rem] mx-auto p-4">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-background/80 rounded-full pointer-events-none">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={handleChange}
            onSubmit={handleSubmit}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 px-1 text-center">
        KnowDB · Press Enter to run query · Shift+Enter for new line · v1.0
        </p>
      </div>
    </div>
  );
}

