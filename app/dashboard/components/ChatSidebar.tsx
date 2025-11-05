"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  onNewChat: () => void;
  onSelectChat?: (id: string) => void;
  selectedChatId?: string;
  isOpen?: boolean;
}

export function ChatSidebar({ onNewChat, onSelectChat, selectedChatId, isOpen = true }: ChatSidebarProps) {
  // Mock chat history - replace with real data
  const chatHistory = [
    { id: "1", title: "Monthly orders analysis", timestamp: new Date() },
    { id: "2", title: "Top products by sales Q3", timestamp: new Date() },
    { id: "3", title: "Customer demographics report", timestamp: new Date() },
    { id: "4", title: "Inventory levels check", timestamp: new Date() },
    { id: "5", title: "New user signups last week", timestamp: new Date() },
    { id: "6", title: "Marketing campaign performance", timestamp: new Date() },
    { id: "7", title: "Website traffic sources", timestamp: new Date() },
    { id: "8", title: "Average order value by region", timestamp: new Date() },
    { id: "9", title: "Failed transactions review", timestamp: new Date() },
    { id: "10", title: "Database schema overview", timestamp: new Date() },
    { id: "11", title: "Revenue trends analysis", timestamp: new Date() },
    { id: "12", title: "User engagement metrics", timestamp: new Date() },
    { id: "13", title: "Product recommendations", timestamp: new Date() },
    { id: "14", title: "Customer retention analysis", timestamp: new Date() },
    { id: "15", title: "Sales forecast for next quarter", timestamp: new Date() },
  ];

  return (
    <aside 
      className={cn(
        "flex flex-col border-r border-dashed bg-background h-screen transition-all duration-300 ease-in-out overflow-hidden relative",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Organization/Account Selector - Fixed at Top */}
      <div className={cn(
        "flex-shrink-0 transition-all duration-300",
        isOpen ? "p-4" : "p-3"
      )}>
        <div className={cn(
          "flex items-center transition-all duration-300",
          isOpen ? "gap-3" : "justify-center"
        )}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="object-contain dark:invert"
            />
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="font-semibold text-sm truncate">Ask Your Database</div>
              <div className="text-xs text-muted-foreground truncate">Built for Devs</div>
            </div>
          )}
        </div>
      </div>

      {/* Chats Section - Fixed New Chat Button + Scrollable Chat List (Hidden when collapsed) */}
      {isOpen && (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300 pb-20">
          {/* Fixed New Chat Button */}
          <div className="flex-shrink-0 p-3 border-b border-dashed">
            <button
              onClick={onNewChat}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
                "bg-muted hover:bg-muted/90 text-foreground",
                "transition-all duration-200 ease-in-out",
                "font-normal text-sm",
                "hover:shadow-sm active:scale-[0.99]"
              )}
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span>New chat</span>
            </button>
          </div>

          {/* Scrollable Chat List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3">
                {/* Chats Heading */}
                <div className="px-3 py-2 mb-2">
                  <h2 className="text-xs font-semibold text-muted-foreground/70">Chats</h2>
                </div>

                {/* Chat History List */}
                <div className="space-y-0">
                  {chatHistory.map((chat, index) => {
                    const isActive = selectedChatId === chat.id || (selectedChatId === undefined && index === 0);
                    return (
                      <button
                        key={chat.id}
                        onClick={() => onSelectChat?.(chat.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-md text-sm",
                          "transition-all duration-150 ease-in-out",
                          "hover:bg-muted/60",
                          isActive && "bg-muted"
                        )}
                      >
                        <span className={cn(
                          "truncate block text-[13.5px] leading-relaxed",
                          isActive ? "text-foreground font-medium" : "text-foreground/80"
                        )}>
                          {chat.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* User Profile Section - Fixed at Bottom of Screen */}
      <div className={cn(
        "border-t border-dashed flex-shrink-0 transition-all duration-300 absolute bottom-0 left-0 right-0 bg-background",
        isOpen ? "p-4" : "p-3"
      )}>
        <div className={cn(
          "flex items-center transition-all duration-300",
          isOpen ? "gap-3" : "justify-center"
        )}>
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              <span className="text-xs font-semibold">NP</span>
            </AvatarFallback>
          </Avatar>
          {isOpen && (
            <div className="flex-1 min-w-0 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="font-semibold text-sm truncate">Nishal Poojary</div>
              <div className="text-xs text-muted-foreground truncate">nishal@askyourdb.com</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
