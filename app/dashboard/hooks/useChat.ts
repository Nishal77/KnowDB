"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Message } from "../../types/message";
import { sendQuery } from "../../lib/api";
import { generateId } from "@/lib/utils";

const STORAGE_KEY = "knowdb_chat_messages";
const CONVERSATION_ID_KEY = "knowdb_conversation_id";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Load messages from local storage on mount
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(STORAGE_KEY);
      const storedConversationId = localStorage.getItem(CONVERSATION_ID_KEY);
      
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      }
      
      if (storedConversationId) {
        conversationIdRef.current = storedConversationId;
      }
    } catch (error) {
      console.error("Failed to load messages from local storage:", error);
      // If there's an error, clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONVERSATION_ID_KEY);
    }
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } else {
        // Clear storage if messages are empty
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save messages to local storage:", error);
    }
  }, [messages]);


  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendQuery(content, conversationIdRef.current || undefined);
      
      // Store conversation ID from the response (but don't save to database)
      if (response.conversationId) {
        conversationIdRef.current = response.conversationId;
        // Save to local storage
        try {
          localStorage.setItem(CONVERSATION_ID_KEY, response.conversationId);
        } catch (error) {
          console.error("Failed to save conversation ID:", error);
        }
      }
      
      // The backend returns the message with queryResult attached
      const assistantMessage = {
        ...response.message,
        queryResult: response.result,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send message";
      setError(errorMessage);
      
      const errorMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    setError(null);
    // Clear local storage
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(CONVERSATION_ID_KEY);
    } catch (error) {
      console.error("Failed to clear local storage:", error);
    }
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
  };
}
