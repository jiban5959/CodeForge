import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Code2, Home, Plus, LogOut, ChevronDown, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setLocation("/auth");
  };

  return (
    <div className="min-h-screen bg-[#020c0e] text-white flex flex-col">
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
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-teal-900/50 hover:border-teal-600/50 bg-[#040f11] hover:bg-teal-950/40 transition-all"
              >
                <div className="h-6 w-6 rounded-full bg-teal-500 flex items-center justify-center text-black text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-medium text-white leading-none">{user.name}</span>
                  {user.role === "admin" && (
                    <span className="text-[10px] text-teal-400 leading-none mt-0.5">Admin</span>
                  )}
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-52 z-20 rounded-xl border border-teal-900/50 bg-[#040f11] shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-teal-900/30">
                      <p className="text-sm font-medium text-white truncate">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {user.role === "admin" && (
                        <div className="mt-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-950 border border-teal-800/60">
                          <Shield className="h-3 w-3 text-teal-400" />
                          <span className="text-[10px] text-teal-400 font-medium">Administrator</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/20 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/auth">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-teal-400 border border-teal-800/60 rounded-lg hover:border-teal-500 hover:bg-teal-950/40 transition-all">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
