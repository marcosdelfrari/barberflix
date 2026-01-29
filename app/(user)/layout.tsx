"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { BottomNav } from "@/components/BottomNav";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleLogout = () => {
    if (confirm("Deseja realmente sair?")) {
      signOut({ callbackUrl: "/login" });
    }
  };

  return (
    <div className="min-h-screen bg-black pb-24 text-gray-100">
      {/* Header Superior - Logo apenas */}
      <header className="bg-black/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-20">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-white">
            Barbearia Cavalheiros
          </h1>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="Sair"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-md mx-auto">{children}</main>

      {/* Menu Inferior Flutuante Reutilizável */}
      <BottomNav />
    </div>
  );
}
