"use client";

import { useState, useEffect } from "react";
import { 
  PanelLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Database, 
  Loader2,
  Settings,
  Sun,
  Moon,
  Keyboard,
  Download,
  HelpCircle,
  MessageSquare,
  Bell,
  Search,
  Eye
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";

interface BreadcrumbNavProps {
  items: string[];
  status?: "connected" | "connecting" | "disconnected" | "syncing" | "warning";
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function BreadcrumbNav({ items, onToggleSidebar, isSidebarOpen = true }: BreadcrumbNavProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [dbStatus, setDbStatus] = useState<"connected" | "connecting" | "disconnected" | "warning">("connecting");
  const [dbMessage, setDbMessage] = useState<string>("Checking database connection...");

  useEffect(() => {
    setMounted(true);
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (prefersDark ? "dark" : "light");
    setTheme(initialTheme);
    updateTheme(initialTheme);
  }, []);

  // Poll database status every 3 seconds
  useEffect(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/status`);
        if (response.ok) {
          const data = await response.json();
          setDbStatus(data.status || "disconnected");
          setDbMessage(data.message || "Database status unknown");
        } else {
          setDbStatus("disconnected");
          setDbMessage("Unable to check database status");
        }
      } catch (error) {
        setDbStatus("disconnected");
        setDbMessage("Connection error • Backend unavailable");
      }
    };

    // Check immediately
    checkStatus();

    // Then poll every 3 seconds
    const interval = setInterval(checkStatus, 3000);

    return () => clearInterval(interval);
  }, []);

  const updateTheme = (newTheme: "light" | "dark") => {
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    updateTheme(newTheme);
  };

  const statusConfig = {
    connected: {
      text: dbMessage || "Database connected • All systems operational",
      icon: CheckCircle2,
      color: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50/80 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200/80 dark:border-emerald-800/50",
      pulse: false,
      dotColor: "bg-emerald-500",
      dotGlow: "bg-emerald-400",
    },
    connecting: {
      text: dbMessage || "Establishing database connection...",
      icon: Loader2,
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50/80 dark:bg-amber-950/40",
      borderColor: "border-amber-200/80 dark:border-amber-800/50",
      pulse: true,
      dotColor: "bg-amber-500",
      dotGlow: "bg-amber-400",
    },
    warning: {
      text: dbMessage || "Database connection unstable • Minor issues detected",
      icon: Database,
      color: "text-orange-700 dark:text-orange-400",
      bgColor: "bg-orange-50/80 dark:bg-orange-950/40",
      borderColor: "border-orange-200/80 dark:border-orange-800/50",
      pulse: true,
      dotColor: "bg-orange-500",
      dotGlow: "bg-orange-400",
    },
    disconnected: {
      text: dbMessage || "Connection lost • Database unavailable",
      icon: Circle,
      color: "text-red-700 dark:text-red-400",
      bgColor: "bg-red-50/80 dark:bg-red-950/40",
      borderColor: "border-red-200/80 dark:border-red-800/50",
      pulse: false,
      dotColor: "bg-red-500",
      dotGlow: "bg-red-400",
    },
  };

  const currentStatus = statusConfig[dbStatus];
  const StatusIcon = currentStatus.icon;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-dashed bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="h-8 w-8 flex-shrink-0 hover:bg-muted transition-colors"
          aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <PanelLeft className="w-5 h-5 text-muted-foreground" />
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <nav className="flex items-center gap-2 text-sm">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
              )}
              <span
                className={cn(
                  "transition-colors",
                  index === items.length - 1
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item}
              </span>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-medium",
            "backdrop-blur-sm transition-all border",
            currentStatus.bgColor,
            currentStatus.borderColor,
            currentStatus.color,
            currentStatus.pulse && "animate-pulse"
          )}
        >
          {/* Live Status Dot */}
          {dbStatus === "connected" && (
            <div className="relative flex items-center justify-center w-3 h-3">
              <div className={`absolute w-full h-full ${currentStatus.dotGlow} rounded-full animate-ping opacity-60`} />
              <div className={`absolute w-full h-full ${currentStatus.dotGlow} rounded-full animate-pulse opacity-40`} />
              <div className={`relative w-2.5 h-2.5 ${currentStatus.dotColor} rounded-full shadow-md ${currentStatus.dotColor}/30`} />
            </div>
          )}
          {(dbStatus === "connecting" || dbStatus === "warning") && (
            <div className="relative flex items-center justify-center w-3 h-3">
              <div className={`absolute w-full h-full ${currentStatus.dotGlow} rounded-full animate-ping opacity-60`} />
              <div className={`relative w-2.5 h-2.5 ${currentStatus.dotColor} rounded-full shadow-md ${currentStatus.dotColor}/30`} />
            </div>
          )}
          {dbStatus === "disconnected" && (
            <div className={`w-2.5 h-2.5 ${currentStatus.dotColor} rounded-full shadow-md ${currentStatus.dotColor}/30`} />
          )}
          
          <span className="whitespace-nowrap tracking-tight">{currentStatus.text}</span>
        </div>

        {/* Premium Settings Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg hover:bg-muted/80 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 bg-popover/95 backdrop-blur-sm border border-border shadow-lg rounded-lg p-1.5"
          >
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Preferences
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="cursor-pointer focus:bg-accent rounded-md px-2 py-2"
              >
                {mounted && theme === "dark" ? (
                  <Sun className="w-4 h-4 text-foreground mr-2" />
                ) : (
                  <Moon className="w-4 h-4 text-foreground mr-2" />
                )}
                <span className="text-sm flex-1">Theme</span>
                <DropdownMenuShortcut className="text-xs text-muted-foreground">
                  {mounted && theme === "dark" ? "Light" : "Dark"}
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <Eye className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">View Preferences</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <Bell className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">Notifications</span>
                <DropdownMenuShortcut className="text-xs text-muted-foreground">
                  Off
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-border my-1" />
            
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Actions
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <Download className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">Export Data</span>
                <DropdownMenuShortcut className="text-xs text-muted-foreground">
                  Ctrl+E
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <Search className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">Search</span>
                <DropdownMenuShortcut className="text-xs text-muted-foreground">
                  Ctrl+K
                </DropdownMenuShortcut>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <Keyboard className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">Keyboard Shortcuts</span>
                <DropdownMenuShortcut className="text-xs text-muted-foreground">
                  ?
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-border my-1" />
            
            <DropdownMenuLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
              Support
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border" />
            
            <DropdownMenuGroup>
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <HelpCircle className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">Help & Documentation</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="cursor-pointer focus:bg-accent rounded-md px-2 py-2">
                <MessageSquare className="w-4 h-4 text-foreground mr-2" />
                <span className="text-sm">Send Feedback</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

