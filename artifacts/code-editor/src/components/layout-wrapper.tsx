import React from "react";
import { Link } from "wouter";
import { Code2, Home, Plus, LogIn } from "lucide-react";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 border-b border-teal-900/40 bg-[#020c0e] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
            <Code2 className="h-5 w-5 text-teal-400" />
            <span className="text-white">Code<span className="text-teal-400">Forge</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-950/50 text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/new"
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-950/50 text-gray-400 hover:text-teal-300 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/auth">
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-400 border border-teal-800/60 rounded-lg hover:border-teal-500 hover:bg-teal-950/40 transition-all">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
