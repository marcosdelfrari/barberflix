"use client";

import { useState, useEffect, useRef } from "react";
import {
  Plus,
  X,
  MoreHorizontal,
  Check,
  CheckCircle,
  Ban,
  Edit,
  AlertCircle,
  Search,
  Calendar,
  User,
  Filter,
} from "lucide-react";

interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number;
}

interface Agendamento {
  id: string;
  dataHora: string;
  dataFim: string;
  status: string;
  valorTotal: number;
  duracaoTotal: number;
  observacoes: string | null;
  usuario: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
  };
  profissional: {
    id: string;
    nome: string;
  };
  servicos: Servico[];
}

interface Profissional {
  id: string;
  nome: string;
  servicos?: Servico[];
}

const statusOptions = [
  { value: "todos", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "CONFIRMADO", label: "Confirmado" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "NAO_COMPARECEU", label: "Não Compareceu" },
];

const statusColors: Record<string, string> = {
  PENDENTE: "bg-yellow-900/30 text-yellow-400 border border-yellow-800",
  CONFIRMADO: "bg-blue-900/30 text-blue-400 border border-blue-800",
  CONCLUIDO: "bg-green-900/30 text-green-400 border border-green-800",
  CANCELADO: "bg-red-900/30 text-red-400 border border-red-800",
  NAO_COMPARECEU: "bg-zinc-800 text-gray-400 border border-zinc-700",
};

export default function AgendamentosAdminPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Estado para controlar o menu dropdown ativo
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  // Fechar menu ao clicar fora ou rolar
  useEffect(() => {
    const handleScroll = () => setActiveMenuId(null);
    const handleClickOutside = (e: MouseEvent) => {
      if (
        activeMenuId &&
        !(e.target as Element).closest(".actions-menu-trigger")
      ) {
        setActiveMenuId(null);
      }
    };

    window.addEventListener("scroll", handleScroll, true);
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeMenuId]);

  const handleOpenMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeMenuId === id) {
      setActiveMenuId(null);
      return;
    }

    const button = e.currentTarget as HTMLButtonElement;
    const rect = button.getBoundingClientRect();

    // Ajustar posição para não sair da tela
    const menuHeight = 200; // Altura estimada
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight;

    setMenuPosition({
      top: showAbove ? rect.top - 10 : rect.bottom + 10,
      left: rect.right - 180, // Alinhar à direita do botão, assumindo largura do menu ~180px
    });

    setActiveMenuId(id);
  };

  // Filtros
  const [status, setStatus] = useState("todos");
  const [profissionalId, setProfissionalId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [busca, setBusca] = useState("");

  // Modal de remarcar/editar
  const [showEditModal, setShowEditModal] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] =
    useState<Agendamento | null>(null);
  const [novaDataHora, setNovaDataHora] = useState("");
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    [],
  );
  const [servicosDisponiveis, setServicosDisponiveis] = useState<Servico[]>([]);

  useEffect(() => {
    fetchProfissionais();
    fetchAgendamentos();
  }, []);

  useEffect(() => {
    fetchAgendamentos();
  }, [status, profissionalId, dataInicio, dataFim]);

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

  async function fetchAgendamentos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status !== "todos") params.set("status", status);
      if (profissionalId) params.set("profissionalId", profissionalId);
      if (dataInicio) params.set("dataInicio", dataInicio);
      if (dataFim) params.set("dataFim", dataFim);
      if (busca) params.set("busca", busca);

      const res = await fetch(`/api/admin/agendamentos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAgendamentos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmar(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/agendamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONFIRMADO" }),
      });

      if (res.ok) {
        fetchAgendamentos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao confirmar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao confirmar agendamento");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConcluir(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/agendamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CONCLUIDO" }),
      });

      if (res.ok) {
        fetchAgendamentos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao concluir");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao concluir agendamento");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancelar(id: string) {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/agendamentos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchAgendamentos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao cancelar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao cancelar agendamento");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSalvarEdicao() {
    if (!agendamentoSelecionado) return;

    if (servicosSelecionados.length === 0) {
      alert("Selecione pelo menos um serviço");
      return;
    }

    setActionLoading(agendamentoSelecionado.id);
    try {
      const res = await fetch(
        `/api/admin/agendamentos/${agendamentoSelecionado.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dataHora: novaDataHora || undefined,
            servicosIds: servicosSelecionados,
          }),
        },
      );

      if (res.ok) {
        setShowEditModal(false);
        setAgendamentoSelecionado(null);
        setNovaDataHora("");
        setServicosSelecionados([]);
        fetchAgendamentos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar agendamento");
    } finally {
      setActionLoading(null);
    }
  }

  function handleNaoCompareceu(id: string) {
    setActionLoading(id);
    fetch(`/api/admin/agendamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "NAO_COMPARECEU" }),
    })
      .then((res) => {
        if (res.ok) {
          fetchAgendamentos();
        }
      })
      .finally(() => setActionLoading(null));
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return {
      data: date.toLocaleDateString("pt-BR"),
      hora: date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  }

  function abrirEditarServicos(agendamento: Agendamento) {
    setAgendamentoSelecionado(agendamento);
    setNovaDataHora(agendamento.dataHora.slice(0, 16));
    setServicosSelecionados(agendamento.servicos.map((s) => s.id));

    // Buscar serviços disponíveis do profissional
    const profissional = profissionais.find(
      (p) => p.id === agendamento.profissional.id,
    );
    if (profissional?.servicos) {
      setServicosDisponiveis(profissional.servicos);
    } else {
      // Fallback: usar os serviços atuais do agendamento
      setServicosDisponiveis(agendamento.servicos);
    }

    setShowEditModal(true);
  }

  function toggleServico(servicoId: string) {
    setServicosSelecionados((prev) =>
      prev.includes(servicoId)
        ? prev.filter((id) => id !== servicoId)
        : [...prev, servicoId],
    );
  }

  function calcularTotalSelecionado() {
    return servicosDisponiveis
      .filter((s) => servicosSelecionados.includes(s.id))
      .reduce((acc, s) => acc + s.preco, 0);
  }

  function calcularDuracaoSelecionada() {
    return servicosDisponiveis
      .filter((s) => servicosSelecionados.includes(s.id))
      .reduce((acc, s) => acc + s.duracao, 0);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Agendamentos
        </h2>
      </div>

      {/* Filtros Modernos */}
      <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-white/10 mb-8 shadow-xl">
        <div className="flex flex-col gap-6">
          {/* Cabeçalho com Busca Principal */}
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div className="flex items-center gap-2 text-white/80 font-medium">
              <Filter size={20} className="text-blue-400" />
              <span>Filtros</span>
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <div className="relative flex-1 md:w-80 group">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome, email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>
              <button
                onClick={fetchAgendamentos}
                className="px-5 py-2.5 bg-white text-black rounded-xl hover:bg-zinc-200 font-semibold transition-colors flex items-center gap-2 active:scale-95"
              >
                <Search size={18} />
                <span className="hidden sm:inline">Buscar</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Grid de Filtros Secundários */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Status
              </label>
              <div className="relative group">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer hover:border-white/20"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-white transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Profissional
              </label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-white transition-colors">
                  <User size={16} />
                </div>
                <select
                  value={profissionalId}
                  onChange={(e) => setProfissionalId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-white/20 transition-all cursor-pointer hover:border-white/20"
                >
                  <option value="">Todos os profissionais</option>
                  {profissionais.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.nome}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 group-hover:text-white transition-colors">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                De
              </label>
              <div className="relative group">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors"
                  size={16}
                />
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 scheme-dark transition-all hover:border-white/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Até
              </label>
              <div className="relative group">
                <Calendar
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors"
                  size={16}
                />
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white/20 scheme-dark transition-all hover:border-white/20"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : agendamentos.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Nenhum agendamento encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-black/50 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Profissional
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Serviços
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Data/Hora
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {agendamentos.map((agendamento) => {
                  const { data, hora } = formatDateTime(agendamento.dataHora);
                  const isLoading = actionLoading === agendamento.id;

                  return (
                    <tr
                      key={agendamento.id}
                      className={isLoading ? "opacity-50" : "hover:bg-white/5"}
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-sm text-white">
                            {agendamento.usuario.nome}
                          </p>
                          <p className="text-xs text-gray-500">
                            {agendamento.usuario.email}
                          </p>
                          {agendamento.usuario.telefone && (
                            <p className="text-xs text-gray-500">
                              {agendamento.usuario.telefone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-300">
                        {agendamento.profissional.nome}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {agendamento.servicos.map((servico) => (
                            <div
                              key={servico.id}
                              className="flex items-center gap-2"
                            >
                              <span className="text-sm text-gray-300">
                                {servico.nome}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({servico.duracao}min - R${" "}
                                {servico.preco.toFixed(2)})
                              </span>
                            </div>
                          ))}
                          <p className="text-xs text-gray-500 mt-1">
                            Total: {agendamento.duracaoTotal} min
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {data}
                          </p>
                          <p className="text-xs text-gray-500">{hora}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-white">
                        R$ {agendamento.valorTotal.toFixed(2)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${statusColors[agendamento.status] || ""}`}
                        >
                          {agendamento.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-4 relative">
                        <button
                          onClick={(e) => handleOpenMenu(agendamento.id, e)}
                          className={`actions-menu-trigger p-2 rounded-lg transition-colors ${
                            activeMenuId === agendamento.id
                              ? "bg-white text-black"
                              : "text-gray-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {isLoading ? (
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <MoreHorizontal size={20} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Portal do Menu Dropdown (Renderizado fora da tabela para evitar overflow) */}
      {activeMenuId && (
        <div
          className="fixed z-50 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-1 animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: menuPosition.top,
            left: menuPosition.left,
            transform:
              menuPosition.top > window.innerHeight / 2
                ? "translateY(-100%)"
                : "none",
          }}
        >
          {(() => {
            const agendamento = agendamentos.find((a) => a.id === activeMenuId);
            if (!agendamento) return null;

            return (
              <div className="flex flex-col">
                {agendamento.status === "PENDENTE" && (
                  <button
                    onClick={() => {
                      handleConfirmar(agendamento.id);
                      setActiveMenuId(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-green-400 flex items-center gap-2 transition-colors"
                  >
                    <Check size={16} />
                    Confirmar
                  </button>
                )}

                {agendamento.status === "CONFIRMADO" && (
                  <>
                    <button
                      onClick={() => {
                        handleConcluir(agendamento.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-green-400 flex items-center gap-2 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Concluir
                    </button>
                    <button
                      onClick={() => {
                        handleNaoCompareceu(agendamento.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-orange-400 flex items-center gap-2 transition-colors"
                    >
                      <AlertCircle size={16} />
                      Faltou
                    </button>
                  </>
                )}

                {["PENDENTE", "CONFIRMADO"].includes(agendamento.status) && (
                  <>
                    <div className="h-px bg-white/10 my-1 mx-2" />
                    <button
                      onClick={() => {
                        abrirEditarServicos(agendamento);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-blue-400 flex items-center gap-2 transition-colors"
                    >
                      <Edit size={16} />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        handleCancelar(agendamento.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-red-400 flex items-center gap-2 transition-colors"
                    >
                      <Ban size={16} />
                      Cancelar
                    </button>
                  </>
                )}

                {/* Opção padrão caso não haja ações ou para visualizar detalhes se necessário */}
                {!["PENDENTE", "CONFIRMADO"].includes(agendamento.status) && (
                  <span className="px-4 py-2 text-xs text-gray-500 italic text-center">
                    Sem ações disponíveis
                  </span>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal Editar Serviços */}
      {showEditModal && agendamentoSelecionado && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                Editar Agendamento
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setAgendamentoSelecionado(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-sm text-gray-400 mb-4">
              <p>
                <span className="text-gray-500">Cliente:</span>{" "}
                {agendamentoSelecionado.usuario.nome}
              </p>
              <p>
                <span className="text-gray-500">Profissional:</span>{" "}
                {agendamentoSelecionado.profissional.nome}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Data e Hora
              </label>
              <input
                type="datetime-local"
                value={novaDataHora}
                onChange={(e) => setNovaDataHora(e.target.value)}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 scheme-dark"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Serviços
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {servicosDisponiveis.map((servico) => (
                  <label
                    key={servico.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      servicosSelecionados.includes(servico.id)
                        ? "bg-white/10 border-white/30"
                        : "bg-black/30 border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={servicosSelecionados.includes(servico.id)}
                        onChange={() => toggleServico(servico.id)}
                        className="w-4 h-4 rounded border-gray-600 bg-black text-white focus:ring-white/20"
                      />
                      <div>
                        <p className="text-sm text-white">{servico.nome}</p>
                        <p className="text-xs text-gray-500">
                          {servico.duracao} min
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-white">
                      R$ {servico.preco.toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Resumo */}
            <div className="bg-black/30 rounded-lg p-4 mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Duração total:</span>
                <span className="text-white">
                  {calcularDuracaoSelecionada()} min
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Valor total:</span>
                <span className="text-white font-bold">
                  R$ {calcularTotalSelecionado().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setAgendamentoSelecionado(null);
                }}
                className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarEdicao}
                disabled={
                  actionLoading === agendamentoSelecionado.id ||
                  servicosSelecionados.length === 0
                }
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
