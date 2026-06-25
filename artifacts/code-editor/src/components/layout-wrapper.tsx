import React from "react";
import { Link } from "wouter";
import { Code2, Settings, Home, Plus } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 border-b bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
            <Code2 className="h-6 w-6 text-primary" />
            <span>CodeForge</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link href="/new" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}