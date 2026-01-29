"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";

interface ServicoAgendamento {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
}

interface Agendamento {
  id: string;
  dataHora: string;
  dataFim: string;
  status: string;
  valorTotal: number;
  duracaoTotal?: number;
  estabelecimento: {
    nome: string;
    endereco: string;
  };
  profissional: {
    nome: string;
    foto: string | null;
  };
  servicos: ServicoAgendamento[];
}

interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  endereco: string | null;
  assinatura?: {
    status: string;
    plano: {
      nome: string;
    };
  } | null;
}

export default function MeusAgendamentosPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  // Estados para edição de perfil
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
  });

  useEffect(() => {
    // Mostrar mensagem de sucesso se vier do agendamento
    if (searchParams.get("success") === "true") {
      setShowSuccess(true);
      // Remover o parâmetro da URL
      window.history.replaceState({}, "", "/perfil");
      // Esconder após 5 segundos
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Buscar agendamentos
        const agendamentosRes = await fetch("/api/agendamentos");
        if (agendamentosRes.ok) {
          const data = await agendamentosRes.json();
          setAgendamentos(data);
        }

        // Buscar dados do usuário
        const userRes = await fetch("/api/auth/me");
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.usuario);
          setFormData({
            nome: data.usuario.nome || "",
            email: data.usuario.email || "",
            telefone: data.usuario.telefone || "",
            endereco: data.usuario.endereco || "",
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCancelar = async (id: string) => {
    if (!confirm("Deseja cancelar este agendamento?")) return;

    try {
      const response = await fetch(`/api/agendamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELADO" }),
      });

      if (response.ok) {
        setAgendamentos((prev) =>
          prev.map((ag) =>
            ag.id === id ? { ...ag, status: "CANCELADO" } : ag,
          ),
        );
      } else {
        alert("Erro ao cancelar agendamento");
      }
    } catch (error) {
      console.error("Erro ao cancelar:", error);
      alert("Erro ao cancelar agendamento");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUser((prev) => (prev ? { ...prev, ...formData } : null));
        setIsEditing(false);
      } else {
        alert("Erro ao atualizar perfil");
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      alert("Erro ao atualizar perfil");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return "bg-green-500/10 text-green-400";
      case "PENDENTE":
        return "bg-yellow-500/10 text-yellow-400";
      case "CANCELADO":
        return "bg-red-500/10 text-red-400";
      case "CONCLUIDO":
        return "bg-blue-500/10 text-blue-400";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "CONFIRMADO":
        return "Confirmado";
      case "PENDENTE":
        return "Pendente";
      case "CANCELADO":
        return "Cancelado";
      case "CONCLUIDO":
        return "Concluído";
      case "NAO_COMPARECEU":
        return "Não compareceu";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Mensagem de sucesso */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <p className="text-green-400 text-sm font-medium flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Agendamento realizado com sucesso!
          </p>
        </div>
      )}

      {/* Seção Meus Dados */}
      <h1 className="text-2xl font-bold mb-4 text-white">Meus Dados</h1>
      <div
        className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-white/5 mb-8 cursor-pointer hover:border-white/20 transition-colors relative group"
        onClick={() => setIsEditing(true)}
      >
        <div className="absolute top-4 right-4 text-gray-400 group-hover:text-white transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
              Nome
            </p>
            <p className="text-white font-medium">{user?.nome}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
              Email
            </p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
              WhatsApp
            </p>
            <p className="text-white font-medium">
              {user?.telefone || "Não informado"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
              Endereço
            </p>
            <p className="text-white font-medium">
              {user?.endereco || "Não informado"}
            </p>
          </div>

          <div
            className="md:col-span-2 mt-2 pt-4 border-t border-white/5"
            onClick={(e) => {
              e.stopPropagation(); // Evita abrir o modal de edição ao clicar no plano
              router.push("/assinatura");
            }}
          >
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">
              Plano Atual
            </p>
            <div className="flex items-center justify-between group/plan cursor-pointer">
              <p className="text-blue-400 font-bold text-lg group-hover/plan:text-blue-300 transition-colors">
                {user?.assinatura?.plano?.nome || "Sem plano ativo"}
              </p>
              <svg
                className="w-5 h-5 text-gray-500 group-hover/plan:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-6 text-white">Meus Agendamentos</h1>

      {agendamentos.length === 0 ? (
        <div className="bg-zinc-900 p-8 rounded-2xl shadow-sm border border-white/5 text-center">
          <p className="text-gray-400 mb-4">Você não tem agendamentos</p>
          <a
            href="/agendar"
            className="inline-block bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors"
          >
            Agendar agora
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              className={`bg-zinc-900 p-5 rounded-2xl shadow-sm border border-white/5 ${
                agendamento.status === "CANCELADO" ? "opacity-60" : ""
              }`}
            >
              <div className="flex gap-4">
                {/* Foto do profissional */}
                <div className="shrink-0 relative w-14 h-14 rounded-full overflow-hidden bg-zinc-800">
                  {agendamento.profissional.foto ? (
                    <Image
                      src={agendamento.profissional.foto}
                      alt={agendamento.profissional.nome}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-500">
                      {agendamento.profissional.nome.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Informações */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-2">
                        {agendamento.servicos?.length
                          ? agendamento.servicos.map((s) => s.nome).join(" + ")
                          : "Serviço"}
                      </h3>
                      <p className="text-sm text-gray-400 mt-0.5">
                        com {agendamento.profissional.nome}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold ${getStatusStyle(
                        agendamento.status,
                      )}`}
                    >
                      {getStatusLabel(agendamento.status)}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-400">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 shrink-0 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        {formatDate(agendamento.dataHora)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 shrink-0 text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {formatTime(agendamento.dataHora)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3.5 h-3.5 shrink-0 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="truncate">
                        {agendamento.estabelecimento.nome}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-base font-bold text-white">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(agendamento.valorTotal)}
                    </span>

                    {agendamento.status === "PENDENTE" && (
                      <button
                        onClick={() => handleCancelar(agendamento.id)}
                        className="px-3 py-1.5 text-xs font-bold border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edição */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md border border-white/10 overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                Editar Meus Dados
              </h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Endereço
                  </label>
                  <textarea
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
