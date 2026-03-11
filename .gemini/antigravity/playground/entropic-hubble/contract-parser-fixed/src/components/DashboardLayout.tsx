"use client";

import { Sidebar } from "./Sidebar";
import { usePathname } from "next/navigation";
import React from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Se for a página de login, não exibe a barra lateral (Sidebar)
  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
