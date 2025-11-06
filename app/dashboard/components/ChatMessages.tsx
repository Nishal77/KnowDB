"use client";

import { User, Bot, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn, formatDate } from "@/lib/utils";
import type { Message } from "../../types/message";

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
}

export function ChatMessages({ messages, isLoading, scrollRef }: ChatMessagesProps) {
  return (
    <ScrollArea className="h-full w-full">
      <div className="flex flex-col gap-6 p-6 pb-32" ref={scrollRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-4 max-w-3xl",
              message.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className={cn(
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              )}>
                {message.role === "user" ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "flex flex-col gap-1",
              message.role === "user" ? "items-end" : "items-start"
            )}>
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[80%] break-words",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>

              {message.queryResult && (
                <div className="mt-2 w-full max-w-[80%] rounded-lg border border-border bg-card p-4">
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(message.queryResult.result, null, 2)}
                  </pre>
                </div>
              )}

              <span className="text-xs text-muted-foreground px-1">
                {formatDate(message.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 max-w-3xl mr-auto">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback className="bg-muted">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="rounded-2xl bg-muted px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

