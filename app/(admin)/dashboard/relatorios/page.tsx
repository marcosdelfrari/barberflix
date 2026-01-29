"use client";

import { useState, useEffect } from "react";

interface RelatorioGeral {
  periodo: { inicio: string; fim: string };
  faturamentoServicos: number;
  totalAgendamentos: number;
  agendamentosPorStatus: Array<{ status: string; _count: number }>;
  clientesAtivos: number;
  assinaturasAtivas: number;
  receitaMensalAssinaturas: number;
}

interface RelatorioFaturamento {
  periodo: { inicio: string; fim: string };
  porProfissional: Array<{
    profissionalId: string;
    nome: string;
    total: number;
    quantidade: number;
  }>;
  porServico: Array<{
    servicoId: string;
    nome: string;
    total: number;
    quantidade: number;
  }>;
  porDia: Array<{ data: string; total: number }>;
}

interface RelatorioPerformance {
  periodo: { inicio: string; fim: string };
  performance: Array<{
    profissionalId: string;
    nome: string;
    total: number;
    concluidos: number;
    cancelados: number;
    naoCompareceu: number;
    taxaConclusao: number;
    taxaCancelamento: number;
  }>;
}

interface RelatorioFrequencia {
  periodo: { inicio: string; fim: string };
  clientesMaisFrequentes: Array<{
    usuarioId: string;
    nome: string;
    email: string;
    totalAgendamentos: number;
  }>;
  horariosMaisPopulares: Array<{ hora: string; count: number }>;
  diasMaisPopulares: Array<{ dia: string; count: number }>;
}

type TipoRelatorio = "geral" | "faturamento" | "performance" | "frequencia";

const statusLabels: Record<string, string> = {
  PENDENTE: "Pendentes",
  CONFIRMADO: "Confirmados",
  CONCLUIDO: "Concluídos",
  CANCELADO: "Cancelados",
  NAO_COMPARECEU: "Não Compareceram",
};

export default function RelatoriosAdminPage() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>("geral");
  const [loading, setLoading] = useState(true);

  // Datas
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const [dataInicio, setDataInicio] = useState(
    primeiroDiaMes.toISOString().split("T")[0],
  );
  const [dataFim, setDataFim] = useState(hoje.toISOString().split("T")[0]);

  // Dados
  const [relatorioGeral, setRelatorioGeral] = useState<RelatorioGeral | null>(
    null,
  );
  const [relatorioFaturamento, setRelatorioFaturamento] =
    useState<RelatorioFaturamento | null>(null);
  const [relatorioPerformance, setRelatorioPerformance] =
    useState<RelatorioPerformance | null>(null);
  const [relatorioFrequencia, setRelatorioFrequencia] =
    useState<RelatorioFrequencia | null>(null);

  // Profissionais
  const [profissionais, setProfissionais] = useState<
    Array<{ id: string; nome: string }>
  >([]);
  const [profissionalId, setProfissionalId] = useState("");

  useEffect(() => {
    fetchProfissionais();
  }, []);

  async function fetchProfissionais() {
    try {
      const res = await fetch("/api/admin/profissionais");
      if (res.ok) {
        const data = await res.json();
        setProfissionais(data);
      }
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
    }
  }

  useEffect(() => {
    fetchRelatorio();
  }, [tipoRelatorio, dataInicio, dataFim, profissionalId]);

  async function fetchRelatorio() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tipo: tipoRelatorio,
        dataInicio,
        dataFim,
      });

      if (profissionalId) {
        params.append("profissionalId", profissionalId);
      }

      const res = await fetch(`/api/admin/relatorios?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();

        switch (tipoRelatorio) {
          case "geral":
            setRelatorioGeral(data);
            break;
          case "faturamento":
            setRelatorioFaturamento(data);
            break;
          case "performance":
            setRelatorioPerformance(data);
            break;
          case "frequencia":
            setRelatorioFrequencia(data);
            break;
        }
      }
    } catch (error) {
      console.error("Erro ao buscar relatório:", error);
    } finally {
      setLoading(false);
    }
  }

  // Gráfico de barras simples
  function BarChart({
    data,
    valueKey,
    labelKey,
    maxValue,
  }: {
    data: Array<Record<string, unknown>>;
    valueKey: string;
    labelKey: string;
    maxValue?: number;
  }) {
    const max =
      maxValue || Math.max(...data.map((d) => d[valueKey] as number), 1);

    return (
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 text-sm text-gray-400 truncate">
              {String(item[labelKey])}
            </div>
            <div className="flex-1 bg-zinc-800 rounded-full h-6 overflow-hidden border border-white/5">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{
                  width: `${((item[valueKey] as number) / max) * 100}%`,
                }}
              />
            </div>
            <div className="w-16 text-sm font-medium text-right text-white">
              {typeof item[valueKey] === "number" && valueKey.includes("total")
                ? `R$ ${(item[valueKey] as number).toFixed(0)}`
                : item[valueKey]}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Relatórios</h2>
      </div>

      {/* Filtros */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Tipo de Relatório
            </label>
            <select
              value={tipoRelatorio}
              onChange={(e) =>
                setTipoRelatorio(e.target.value as TipoRelatorio)
              }
              className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <option value="geral">Geral</option>
              <option value="faturamento">Faturamento</option>
              <option value="performance">Performance</option>
              <option value="frequencia">Frequência</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Profissional
            </label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 w-40"
            >
              <option value="">Todos</option>
              {profissionais.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
            />
          </div>

          <button
            onClick={fetchRelatorio}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : (
        <>
          {/* Relatório Geral */}
          {tipoRelatorio === "geral" && relatorioGeral && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400">Faturamento Serviços</p>
                  <p className="text-2xl font-bold text-white">
                    R$ {relatorioGeral.faturamentoServicos.toFixed(2)}
                  </p>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400">Total Agendamentos</p>
                  <p className="text-2xl font-bold text-white">
                    {relatorioGeral.totalAgendamentos}
                  </p>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-white">
                    {relatorioGeral.clientesAtivos}
                  </p>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <p className="text-sm text-gray-400">
                    Receita Assinaturas/mês
                  </p>
                  <p className="text-2xl font-bold text-white">
                    R$ {relatorioGeral.receitaMensalAssinaturas.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Agendamentos por Status */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Agendamentos por Status
                </h3>
                <div className="grid md:grid-cols-5 gap-4">
                  {relatorioGeral.agendamentosPorStatus.map((item) => (
                    <div
                      key={item.status}
                      className="text-center p-4 bg-black/50 border border-white/5 rounded-lg"
                    >
                      <p className="text-2xl font-bold text-white">
                        {item._count}
                      </p>
                      <p className="text-sm text-gray-400">
                        {statusLabels[item.status] || item.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Assinaturas
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Assinaturas Ativas</span>
                    <span className="text-2xl font-bold text-white">
                      {relatorioGeral.assinaturasAtivas}
                    </span>
                  </div>
                </div>
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Receita Total
                  </h3>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">
                      Serviços + Assinaturas
                    </span>
                    <span className="text-2xl font-bold text-white">
                      R${" "}
                      {(
                        relatorioGeral.faturamentoServicos +
                        relatorioGeral.receitaMensalAssinaturas
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Relatório de Faturamento */}
          {tipoRelatorio === "faturamento" && relatorioFaturamento && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Por Profissional */}
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Faturamento por Profissional
                  </h3>
                  {relatorioFaturamento.porProfissional.length === 0 ? (
                    <p className="text-gray-400">Sem dados no período</p>
                  ) : (
                    <BarChart
                      data={relatorioFaturamento.porProfissional}
                      valueKey="total"
                      labelKey="nome"
                    />
                  )}
                </div>

                {/* Por Serviço */}
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Faturamento por Serviço
                  </h3>
                  {relatorioFaturamento.porServico.length === 0 ? (
                    <p className="text-gray-400">Sem dados no período</p>
                  ) : (
                    <BarChart
                      data={relatorioFaturamento.porServico}
                      valueKey="total"
                      labelKey="nome"
                    />
                  )}
                </div>
              </div>

              {/* Por Dia */}
              <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                <h3 className="text-lg font-semibold mb-4 text-white">
                  Faturamento Diário
                </h3>
                {relatorioFaturamento.porDia.length === 0 ? (
                  <p className="text-gray-400">Sem dados no período</p>
                ) : (
                  <div className="h-64 flex items-end gap-1">
                    {relatorioFaturamento.porDia.map((item, i) => {
                      const max = Math.max(
                        ...relatorioFaturamento.porDia.map((d) => d.total),
                        1,
                      );
                      const height = (item.total / max) * 100;

                      return (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end"
                        >
                          <div
                            className="w-full bg-white rounded-t transition-all duration-300 hover:bg-gray-300"
                            style={{ height: `${height}%` }}
                            title={`${item.data}: R$ ${item.total.toFixed(2)}`}
                          />
                          <p className="text-xs text-gray-500 mt-1 rotate-45 origin-left">
                            {item.data.slice(5)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tabela Detalhada */}
              <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black/50 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Profissional
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Quantidade
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Ticket Médio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {relatorioFaturamento.porProfissional.map((prof) => (
                      <tr
                        key={prof.profissionalId}
                        className="hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {prof.nome}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          {prof.quantidade}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          R$ {prof.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          R${" "}
                          {prof.quantidade > 0
                            ? (prof.total / prof.quantidade).toFixed(2)
                            : "0.00"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Relatório de Performance */}
          {tipoRelatorio === "performance" && relatorioPerformance && (
            <div className="space-y-6">
              <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-black/50 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Profissional
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                        Concluídos
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                        Cancelados
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                        Não Compareceu
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                        Taxa Conclusão
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                        Taxa Cancelamento
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {relatorioPerformance.performance.map((prof) => (
                      <tr
                        key={prof.profissionalId}
                        className="hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {prof.nome}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">
                          {prof.total}
                        </td>
                        <td className="px-4 py-3 text-center text-green-500 font-medium">
                          {prof.concluidos}
                        </td>
                        <td className="px-4 py-3 text-center text-red-500">
                          {prof.cancelados}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-500">
                          {prof.naoCompareceu}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              prof.taxaConclusao >= 80
                                ? "bg-green-500/10 text-green-400"
                                : prof.taxaConclusao >= 60
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {prof.taxaConclusao}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              prof.taxaCancelamento <= 10
                                ? "bg-green-500/10 text-green-400"
                                : prof.taxaCancelamento <= 20
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {prof.taxaCancelamento}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Relatório de Frequência */}
          {tipoRelatorio === "frequencia" && relatorioFrequencia && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Horários Populares */}
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Horários Mais Procurados
                  </h3>
                  {relatorioFrequencia.horariosMaisPopulares.length === 0 ? (
                    <p className="text-gray-400">Sem dados no período</p>
                  ) : (
                    <BarChart
                      data={relatorioFrequencia.horariosMaisPopulares.slice(
                        0,
                        10,
                      )}
                      valueKey="count"
                      labelKey="hora"
                    />
                  )}
                </div>

                {/* Dias Populares */}
                <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold mb-4 text-white">
                    Dias Mais Procurados
                  </h3>
                  {relatorioFrequencia.diasMaisPopulares.length === 0 ? (
                    <p className="text-gray-400">Sem dados no período</p>
                  ) : (
                    <BarChart
                      data={relatorioFrequencia.diasMaisPopulares}
                      valueKey="count"
                      labelKey="dia"
                    />
                  )}
                </div>
              </div>

              {/* Clientes Mais Frequentes */}
              <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white">
                    Clientes Mais Frequentes
                  </h3>
                </div>
                {relatorioFrequencia.clientesMaisFrequentes.length === 0 ? (
                  <div className="p-4 text-gray-400">Sem dados no período</div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-black/50 border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Cliente
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                          Email
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">
                          Agendamentos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {relatorioFrequencia.clientesMaisFrequentes.map(
                        (cliente, i) => (
                          <tr
                            key={cliente.usuarioId}
                            className="hover:bg-white/5"
                          >
                            <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                            <td className="px-4 py-3 font-medium text-white">
                              {cliente.nome}
                            </td>
                            <td className="px-4 py-3 text-gray-400">
                              {cliente.email}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-white">
                              {cliente.totalAgendamentos}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
