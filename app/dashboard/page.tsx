"use client";

import { useState } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatMessages } from "./components/ChatMessages";
import { ChatInput } from "./components/ChatInput";
import { EmptyState } from "./components/EmptyState";
import { SchemaPanel } from "./components/SchemaPanel";
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
      
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out">
        <BreadcrumbNav 
          items={breadcrumbItems} 
          status="connected" 
          onToggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            <EmptyState />
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} scrollRef={scrollRef} />
          )}
          
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </main>

      <SchemaPanel />
    </div>
  );
}

