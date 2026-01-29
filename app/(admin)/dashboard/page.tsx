"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Users,
  Scissors,
  BarChart3,
  CreditCard,
  Settings,
  DollarSign,
} from "lucide-react";

interface KPI {
  valor: number | string;
  variacao: string;
}

interface ProximoAgendamento {
  id: string;
  cliente: string;
  profissional: string;
  servico: string;
  horario: string;
  status: string;
}

interface DashboardData {
  kpis: {
    agendamentosHoje: KPI;
    receitaMes: KPI;
    clientesAtivos: KPI;
    funcionariosAtivos: KPI;
  };
  proximosAgendamentos: ProximoAgendamento[];
}

const statusColors: Record<string, string> = {
  PENDENTE: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  CONFIRMADO: "bg-blue-900/30 text-blue-400 border border-blue-800",
  CONCLUIDO: "bg-green-900/30 text-green-400 border border-green-800",
  CANCELADO: "bg-red-900/30 text-red-400 border border-red-800",
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const dashboardData = await res.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    agendamentosHoje: { valor: 0, variacao: "0" },
    receitaMes: { valor: 0, variacao: "0%" },
    clientesAtivos: { valor: 0, variacao: "0" },
    funcionariosAtivos: { valor: 0, variacao: "Total" },
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-white tracking-tight">
        Dashboard
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400 mb-1">
            Agendamentos Hoje
          </p>
          <p className="text-2xl font-bold mb-1 text-white tracking-tight">
            {kpis.agendamentosHoje.valor}
          </p>
          <p
            className={`text-xs font-medium ${
              kpis.agendamentosHoje.variacao.startsWith("+")
                ? "text-green-500"
                : kpis.agendamentosHoje.variacao.startsWith("-")
                  ? "text-red-500"
                  : "text-zinc-500"
            }`}
          >
            {kpis.agendamentosHoje.variacao} vs ontem
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400 mb-1">
            Receita do Mês
          </p>
          <p className="text-2xl font-bold mb-1 text-white tracking-tight">
            {typeof kpis.receitaMes.valor === "number"
              ? formatCurrency(kpis.receitaMes.valor)
              : kpis.receitaMes.valor}
          </p>
          <p
            className={`text-xs font-medium ${
              kpis.receitaMes.variacao.startsWith("+")
                ? "text-green-500"
                : kpis.receitaMes.variacao.startsWith("-")
                  ? "text-red-500"
                  : "text-zinc-500"
            }`}
          >
            {kpis.receitaMes.variacao} vs mês anterior
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400 mb-1">
            Clientes Ativos
          </p>
          <p className="text-2xl font-bold mb-1 text-white tracking-tight">
            {kpis.clientesAtivos.valor}
          </p>
          <p
            className={`text-xs font-medium ${
              kpis.clientesAtivos.variacao.startsWith("+")
                ? "text-green-500"
                : kpis.clientesAtivos.variacao.startsWith("-")
                  ? "text-red-500"
                  : "text-zinc-500"
            }`}
          >
            {kpis.clientesAtivos.variacao} novos
          </p>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 hover:border-white/20 transition-colors">
          <p className="text-sm font-medium text-zinc-400 mb-1">Funcionários</p>
          <p className="text-2xl font-bold mb-1 text-white tracking-tight">
            {kpis.funcionariosAtivos.valor}
          </p>
          <p className="text-xs font-medium text-zinc-500">
            {kpis.funcionariosAtivos.variacao}
          </p>
        </div>
      </div>

      {/* Próximos Agendamentos e Ações Rápidas */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Próximos Agendamentos */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white tracking-tight">
              Próximos Agendamentos
            </h3>
            <Link
              href="/dashboard/agendamentos"
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Ver todos
            </Link>
          </div>

          {data?.proximosAgendamentos &&
          data.proximosAgendamentos.length > 0 ? (
            <div className="space-y-3">
              {data.proximosAgendamentos.map((agendamento) => (
                <div
                  key={agendamento.id}
                  className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-white/5 hover:bg-black/60 transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm text-white">
                      {agendamento.cliente}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {agendamento.servico} • {agendamento.profissional}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm text-white">
                      {agendamento.horario}
                    </p>
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded mt-1 ${
                        statusColors[agendamento.status] ||
                        "bg-zinc-800 text-gray-400"
                      }`}
                    >
                      {agendamento.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Calendar className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Nenhum agendamento para hoje</p>
            </div>
          )}
        </div>

        {/* Ações Rápidas */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold mb-6 text-white tracking-tight">
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href="/dashboard/agendamentos"
              className="p-6 border border-white/5 bg-black/20 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group flex flex-col items-center justify-center text-center"
            >
              <Calendar className="w-8 h-8 mb-3 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                Ver Agendamentos
              </span>
            </Link>
            <Link
              href="/dashboard/profissionais"
              className="p-6 border border-white/5 bg-black/20 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group flex flex-col items-center justify-center text-center"
            >
              <Users className="w-8 h-8 mb-3 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                Profissionais
              </span>
            </Link>
            <Link
              href="/dashboard/servicos"
              className="p-6 border border-white/5 bg-black/20 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group flex flex-col items-center justify-center text-center"
            >
              <Scissors className="w-8 h-8 mb-3 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                Serviços
              </span>
            </Link>
            <Link
              href="/dashboard/relatorios"
              className="p-6 border border-white/5 bg-black/20 rounded-xl hover:bg-white/5 hover:border-white/10 transition-all group flex flex-col items-center justify-center text-center"
            >
              <BarChart3 className="w-8 h-8 mb-3 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-all duration-300" />
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white">
                Relatórios
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Links Adicionais */}
      <div className="mt-6 grid lg:grid-cols-3 gap-4">
        <Link
          href="/dashboard/assinaturas"
          className="bg-zinc-900 p-5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-black/40 rounded-lg group-hover:bg-black/60 transition-colors">
            <CreditCard className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
              Assinaturas
            </p>
            <p className="text-sm text-zinc-500">
              Gerenciar planos e assinantes
            </p>
          </div>
        </Link>

        <Link
          href="/dashboard/configuracoes"
          className="bg-zinc-900 p-5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-black/40 rounded-lg group-hover:bg-black/60 transition-colors">
            <Settings className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
              Configurações
            </p>
            <p className="text-sm text-zinc-500">Dados do negócio e horários</p>
          </div>
        </Link>

        <Link
          href="/dashboard/relatorios?tipo=faturamento"
          className="bg-zinc-900 p-5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-zinc-800/80 transition-all flex items-center gap-4 group"
        >
          <div className="p-3 bg-black/40 rounded-lg group-hover:bg-black/60 transition-colors">
            <DollarSign className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <p className="font-medium text-white group-hover:text-blue-400 transition-colors">
              Faturamento
            </p>
            <p className="text-sm text-zinc-500">
              Análise detalhada de receita
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
