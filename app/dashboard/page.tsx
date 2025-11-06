"use client";

import { useState } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { EmptyState } from "./components/EmptyState";
import { BreadcrumbNav } from "./components/BreadcrumbNav";
import { useChat } from "./hooks/useChat";
import { useAutoScroll } from "./hooks/useAutoScroll";

export default function DashboardPage() {
  const { messages, isLoading, sendMessage, clearMessages } = useChat();
  const scrollRef = useAutoScroll(messages);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Breadcrumb items - premium feel with database context
  const breadcrumbItems = ["Database Intelligence", "Query Interface"];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ChatSidebar onNewChat={clearMessages} isOpen={isSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative transition-all duration-300 ease-in-out">
        <div className="flex-shrink-0">
          <BreadcrumbNav 
            items={breadcrumbItems} 
            onToggleSidebar={toggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
        
        <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex-1 overflow-hidden min-h-0">
              <ChatMessages messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
            </div>
          )}
          
          <div className="flex-shrink-0 relative z-10">
            <ChatInput onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}

