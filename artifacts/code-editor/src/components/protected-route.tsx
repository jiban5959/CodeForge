import React from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Code2 } from "lucide-react";

export function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c0e]">
        <div className="flex flex-col items-center gap-4">
          <Code2 className="h-10 w-10 text-teal-400 animate-pulse" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <Component />;
}
