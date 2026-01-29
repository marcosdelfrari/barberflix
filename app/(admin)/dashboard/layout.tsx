"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Building2,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/agendamentos", label: "Agendamentos", icon: Calendar },
  {
    href: "/dashboard/estabelecimentos",
    label: "Estabelecimentos",
    icon: Building2,
  },
  { href: "/dashboard/profissionais", label: "Profissionais", icon: Users },
  { href: "/dashboard/servicos", label: "Serviços", icon: Scissors },
  { href: "/dashboard/assinaturas", label: "Assinaturas", icon: CreditCard },
  { href: "/dashboard/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/dashboard/configuracoes", label: "Configurações", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-black sticky top-0 z-20">
        <Link href="/dashboard">
          <h1 className="text-xl font-semibold tracking-tight">
            Barbearia Cavalheiros
          </h1>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-white hover:bg-zinc-900 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:fixed inset-y-0 left-0 z-10
          w-64 bg-black border-r border-white/10 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          flex flex-col
          mt-14 md:mt-0
        `}
      >
        <div className="p-6 border-b border-white/10 hidden md:block">
          <Link href="/dashboard">
            <h1 className="text-xl font-semibold tracking-tight">
              Barbearia Cavalheiros
            </h1>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm ${
                  isActive
                    ? "bg-zinc-900 text-white font-medium shadow-sm border border-white/5"
                    : "text-zinc-400 hover:bg-zinc-900/50 hover:text-white"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-3 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </Link>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-0 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 min-h-[calc(100vh-60px)] md:min-h-screen overflow-x-hidden bg-black">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
