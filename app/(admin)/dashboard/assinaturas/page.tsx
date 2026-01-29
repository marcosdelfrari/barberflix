"use client";

import { useState, useEffect } from "react";

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  vigencia: string | null;
  features: string[];
  destaque: boolean;
  ordem: number;
  ativo: boolean;
  assinaturasAtivas: number;
  _count: {
    assinaturas: number;
  };
}

interface Assinatura {
  id: string;
  status: string;
  dataInicio: string;
  dataFim: string | null;
  proximaCobranca: string | null;
  usuario: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
  };
  plano: {
    id: string;
    nome: string;
    preco: number;
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border border-green-500/30",
  INACTIVE: "bg-zinc-800 text-gray-400 border border-zinc-700",
  PENDING: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30",
  CANCELED: "bg-red-500/10 text-red-400 border border-red-500/30",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  PENDING: "Pendente",
  CANCELED: "Cancelado",
};

export default function AssinaturasAdminPage() {
  const [tab, setTab] = useState<"planos" | "assinaturas">("planos");
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlanoModal, setShowPlanoModal] = useState(false);
  const [editandoPlano, setEditandoPlano] = useState<Plano | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtro de assinaturas
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroPlano, setFiltroPlano] = useState("");

  // Form do plano
  const [formPlano, setFormPlano] = useState({
    nome: "",
    descricao: "",
    preco: "",
    vigencia: "Mensal",
    features: "",
    destaque: false,
    ordem: 0,
  });

  useEffect(() => {
    fetchPlanos();
    fetchAssinaturas();
  }, []);

  useEffect(() => {
    fetchAssinaturas();
  }, [filtroStatus, filtroPlano]);

  async function fetchPlanos() {
    try {
      const res = await fetch("/api/admin/planos");
      if (res.ok) {
        const data = await res.json();
        setPlanos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
    }
  }

  async function fetchAssinaturas() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroStatus !== "todos") params.set("status", filtroStatus);
      if (filtroPlano) params.set("planoId", filtroPlano);

      const res = await fetch(`/api/admin/assinaturas?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAssinaturas(data);
      }
    } catch (error) {
      console.error("Erro ao buscar assinaturas:", error);
    } finally {
      setLoading(false);
    }
  }

  function abrirNovoPlanoModal() {
    setEditandoPlano(null);
    setFormPlano({
      nome: "",
      descricao: "",
      preco: "",
      vigencia: "Mensal",
      features: "",
      destaque: false,
      ordem: planos.length,
    });
    setShowPlanoModal(true);
  }

  function abrirEditarPlanoModal(plano: Plano) {
    setEditandoPlano(plano);
    setFormPlano({
      nome: plano.nome,
      descricao: plano.descricao || "",
      preco: plano.preco.toString(),
      vigencia: plano.vigencia || "Mensal",
      features: plano.features.join("\n"),
      destaque: plano.destaque,
      ordem: plano.ordem,
    });
    setShowPlanoModal(true);
  }

  async function handleSavePlano() {
    if (!formPlano.nome || !formPlano.preco) {
      alert("Nome e preço são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const url = editandoPlano
        ? `/api/admin/planos/${editandoPlano.id}`
        : "/api/admin/planos";

      const features = formPlano.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean);

      const res = await fetch(url, {
        method: editandoPlano ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formPlano,
          features,
        }),
      });

      if (res.ok) {
        setShowPlanoModal(false);
        fetchPlanos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePlanoAtivo(plano: Plano) {
    try {
      const res = await fetch(`/api/admin/planos/${plano.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !plano.ativo }),
      });

      if (res.ok) {
        fetchPlanos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar");
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  async function handleUpdateAssinaturaStatus(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/assinaturas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchAssinaturas();
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  // Estatísticas
  const totalAssinaturas = assinaturas.length;
  const assinaturasAtivas = assinaturas.filter(
    (a) => a.status === "ACTIVE",
  ).length;
  const inadimplentes = assinaturas.filter(
    (a) =>
      a.status === "ACTIVE" &&
      a.proximaCobranca &&
      new Date(a.proximaCobranca) < new Date(),
  ).length;
  const receitaMensal = planos.reduce(
    (acc, p) => acc + p.preco * p.assinaturasAtivas,
    0,
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Assinaturas</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">Total de Assinaturas</p>
          <p className="text-2xl font-bold text-white">{totalAssinaturas}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">Assinaturas Ativas</p>
          <p className="text-2xl font-bold text-green-500">
            {assinaturasAtivas}
          </p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">Inadimplentes</p>
          <p className="text-2xl font-bold text-red-500">{inadimplentes}</p>
        </div>
        <div className="bg-zinc-900 p-4 rounded-xl border border-white/10">
          <p className="text-sm text-gray-400">Receita Mensal</p>
          <p className="text-2xl font-bold text-white">R$ {receitaMensal.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("planos")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "planos"
              ? "bg-white text-black"
              : "bg-transparent border border-white/10 text-white hover:bg-white/5"
          }`}
        >
          Planos
        </button>
        <button
          onClick={() => setTab("assinaturas")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            tab === "assinaturas"
              ? "bg-white text-black"
              : "bg-transparent border border-white/10 text-white hover:bg-white/5"
          }`}
        >
          Usuários Assinantes
        </button>
      </div>

      {/* Tab: Planos */}
      {tab === "planos" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={abrirNovoPlanoModal}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
            >
              Novo Plano
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={`bg-zinc-900 rounded-xl border border-white/10 overflow-hidden ${
                  !plano.ativo ? "opacity-60" : ""
                } ${plano.destaque ? "ring-2 ring-white/50" : ""}`}
              >
                {plano.destaque && (
                  <div className="bg-white text-black text-center text-xs py-1 font-medium">
                    Mais Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2 text-white">{plano.nome}</h3>
                  <p className="text-3xl font-bold mb-1 text-white">
                    R$ {plano.preco.toFixed(2)}
                    <span className="text-sm font-normal text-gray-400">
                      /{plano.vigencia?.toLowerCase() || "mês"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-400 mb-4">
                    {plano.descricao}
                  </p>

                  <ul className="space-y-2 mb-4">
                    {plano.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="text-green-500">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-white/10 pt-4 mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Assinaturas Ativas:</span>
                      <span className="font-bold text-white">
                        {plano.assinaturasAtivas}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Histórico:</span>
                      <span className="text-white">{plano._count.assinaturas}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => abrirEditarPlanoModal(plano)}
                      className="flex-1 px-3 py-2 text-sm border border-white/10 text-white rounded hover:bg-white/5"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleTogglePlanoAtivo(plano)}
                      className={`px-3 py-2 text-sm rounded border ${
                        plano.ativo
                          ? "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20"
                      }`}
                    >
                      {plano.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Assinaturas */}
      {tab === "assinaturas" && (
        <div>
          {/* Filtros */}
          <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 mb-6">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Status
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="todos">Todos</option>
                  <option value="ACTIVE">Ativos</option>
                  <option value="PENDING">Pendentes</option>
                  <option value="INACTIVE">Inativos</option>
                  <option value="CANCELED">Cancelados</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Plano
                </label>
                <select
                  value={filtroPlano}
                  onChange={(e) => setFiltroPlano(e.target.value)}
                  className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="">Todos</option>
                  {planos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Carregando...</div>
            ) : assinaturas.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                Nenhuma assinatura encontrada
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-black/50 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Usuário
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Plano
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Valor
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Início
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                        Próx. Cobrança
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
                    {assinaturas.map((assinatura) => {
                      const isInadimplente =
                        assinatura.status === "ACTIVE" &&
                        assinatura.proximaCobranca &&
                        new Date(assinatura.proximaCobranca) < new Date();

                      return (
                        <tr
                          key={assinatura.id}
                          className={`hover:bg-white/5 ${
                            isInadimplente ? "bg-red-500/5" : ""
                          }`}
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-sm text-white">
                                {assinatura.usuario.nome}
                              </p>
                              <p className="text-xs text-gray-500">
                                {assinatura.usuario.email}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-300">
                            {assinatura.plano.nome}
                          </td>
                          <td className="px-4 py-4 text-sm font-medium text-white">
                            R$ {assinatura.plano.preco.toFixed(2)}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-400">
                            {new Date(assinatura.dataInicio).toLocaleDateString(
                              "pt-BR",
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {assinatura.proximaCobranca ? (
                              <div>
                                <p className="text-sm text-gray-300">
                                  {new Date(
                                    assinatura.proximaCobranca,
                                  ).toLocaleDateString("pt-BR")}
                                </p>
                                {isInadimplente && (
                                  <p className="text-xs text-red-500 font-medium">
                                    Vencido
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                statusColors[assinatura.status] || ""
                              }`}
                            >
                              {statusLabels[assinatura.status] ||
                                assinatura.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-end gap-1">
                              {assinatura.status !== "ACTIVE" && (
                                <button
                                  onClick={() =>
                                    handleUpdateAssinaturaStatus(
                                      assinatura.id,
                                      "ACTIVE",
                                    )
                                  }
                                  className="px-2 py-1 text-xs border border-green-500/30 text-green-400 rounded hover:bg-green-500/10"
                                >
                                  Ativar
                                </button>
                              )}
                              {assinatura.status === "ACTIVE" && (
                                <button
                                  onClick={() =>
                                    handleUpdateAssinaturaStatus(
                                      assinatura.id,
                                      "INACTIVE",
                                    )
                                  }
                                  className="px-2 py-1 text-xs border border-white/10 text-gray-300 rounded hover:bg-white/5"
                                >
                                  Suspender
                                </button>
                              )}
                              {assinatura.status !== "CANCELED" && (
                                <button
                                  onClick={() =>
                                    handleUpdateAssinaturaStatus(
                                      assinatura.id,
                                      "CANCELED",
                                    )
                                  }
                                  className="px-2 py-1 text-xs border border-red-500/30 text-red-400 rounded hover:bg-red-500/10"
                                >
                                  Cancelar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Plano */}
      {showPlanoModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-white">
              {editandoPlano ? "Editar Plano" : "Novo Plano"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formPlano.nome}
                  onChange={(e) =>
                    setFormPlano({ ...formPlano, nome: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formPlano.descricao}
                  onChange={(e) =>
                    setFormPlano({ ...formPlano, descricao: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Preço *
                  </label>
                  <input
                    type="number"
                    value={formPlano.preco}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, preco: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Vigência
                  </label>
                  <select
                    value={formPlano.vigencia}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, vigencia: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                    <option value="Indeterminado">Indeterminado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Benefícios (um por linha)
                </label>
                <textarea
                  value={formPlano.features}
                  onChange={(e) =>
                    setFormPlano({ ...formPlano, features: e.target.value })
                  }
                  rows={4}
                  placeholder="Cortes ilimitados&#10;Barba incluída&#10;Prioridade no agendamento"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={formPlano.destaque}
                    onChange={(e) =>
                      setFormPlano({ ...formPlano, destaque: e.target.checked })
                    }
                    className="rounded bg-black border-white/10"
                  />
                  <span className="text-sm">Plano em destaque</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={formPlano.ordem}
                  onChange={(e) =>
                    setFormPlano({
                      ...formPlano,
                      ordem: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowPlanoModal(false)}
                className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlano}
                disabled={saving}
                className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
