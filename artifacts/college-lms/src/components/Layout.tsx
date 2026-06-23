import React from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-8 pt-16 md:pt-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}
