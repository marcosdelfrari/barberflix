"use client";

import { useState, useEffect } from "react";

interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  duracao: number;
  preco: number;
  precoAPartir: boolean;
  ativo: boolean;
  estabelecimento: {
    id: string;
    nome: string;
  };
  profissionais: Array<{
    id: string;
    nome: string;
  }>;
  _count: {
    agendamentoServicos: number;
  };
}

interface Estabelecimento {
  id: string;
  nome: string;
}

export default function ServicosAdminPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Servico | null>(null);
  const [saving, setSaving] = useState(false);

  // Filtro
  const [filtroEstabelecimento, setFiltroEstabelecimento] = useState("");

  // Form
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    duracao: "30",
    preco: "",
    precoAPartir: false,
    estabelecimentoId: "",
  });

  useEffect(() => {
    fetchEstabelecimentos();
    fetchServicos();
  }, []);

  useEffect(() => {
    fetchServicos();
  }, [filtroEstabelecimento]);

  async function fetchEstabelecimentos() {
    try {
      const res = await fetch("/api/admin/estabelecimentos");
      if (res.ok) {
        const data = await res.json();
        setEstabelecimentos(data);
        if (data.length > 0 && !form.estabelecimentoId) {
          setForm((f) => ({ ...f, estabelecimentoId: data[0].id }));
        }
      }
    } catch (error) {
      console.error("Erro ao buscar estabelecimentos:", error);
    }
  }

  async function fetchServicos() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroEstabelecimento)
        params.set("estabelecimentoId", filtroEstabelecimento);

      const res = await fetch(`/api/admin/servicos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setServicos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    } finally {
      setLoading(false);
    }
  }

  function abrirNovoModal() {
    setEditando(null);
    setForm({
      nome: "",
      descricao: "",
      duracao: "30",
      preco: "",
      precoAPartir: false,
      estabelecimentoId: estabelecimentos[0]?.id || "",
    });
    setShowModal(true);
  }

  function abrirEditarModal(servico: Servico) {
    setEditando(servico);
    setForm({
      nome: servico.nome,
      descricao: servico.descricao || "",
      duracao: servico.duracao.toString(),
      preco: servico.preco.toString(),
      precoAPartir: servico.precoAPartir,
      estabelecimentoId: servico.estabelecimento.id,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.nome || !form.preco || !form.duracao || !form.estabelecimentoId) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const url = editando
        ? `/api/admin/servicos/${editando.id}`
        : "/api/admin/servicos";

      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowModal(false);
        fetchServicos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar serviço");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleAtivo(servico: Servico) {
    try {
      const res = await fetch(`/api/admin/servicos/${servico.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !servico.ativo }),
      });

      if (res.ok) {
        fetchServicos();
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja desativar este serviço?")) return;

    try {
      const res = await fetch(`/api/admin/servicos/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchServicos();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao desativar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao desativar serviço");
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Catálogo de Serviços</h2>
        <button
          onClick={abrirNovoModal}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
        >
          Novo Serviço
        </button>
      </div>

      {/* Filtro */}
      <div className="bg-zinc-900 p-4 rounded-xl border border-white/10 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-400">
            Filtrar por Estabelecimento:
          </label>
          <select
            value={filtroEstabelecimento}
            onChange={(e) => setFiltroEstabelecimento(e.target.value)}
            className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
          >
            <option value="">Todos</option>
            {estabelecimentos.map((estab) => (
              <option key={estab.id} value={estab.id}>
                {estab.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de Serviços */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : servicos.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Nenhum serviço cadastrado
        </div>
      ) : (
        <div className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-gray-400 uppercase bg-black/50">
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Duração</th>
                <th className="px-4 py-3">Preço</th>
                <th className="px-4 py-3">Profissionais</th>
                <th className="px-4 py-3">Agendamentos</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {servicos.map((servico) => (
                <tr
                  key={servico.id}
                  className={`hover:bg-white/5 ${
                    !servico.ativo ? "opacity-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-medium text-white">
                        {servico.nome}
                      </span>
                      {servico.descricao && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {servico.descricao}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {servico.duracao} min
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-white">
                    {servico.precoAPartir && (
                      <span className="text-xs font-normal text-gray-400 mr-1">
                        A partir de
                      </span>
                    )}
                    R$ {servico.preco.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {servico.profissionais.length === 0 ? (
                      <span className="text-xs text-gray-500">Nenhum</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {servico.profissionais.slice(0, 3).map((prof) => (
                          <span
                            key={prof.id}
                            className="px-2 py-0.5 bg-white/10 text-xs rounded-full text-gray-300"
                          >
                            {prof.nome}
                          </span>
                        ))}
                        {servico.profissionais.length > 3 && (
                          <span className="px-2 py-0.5 bg-white/10 text-xs rounded-full text-gray-400">
                            +{servico.profissionais.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {servico._count.agendamentoServicos}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded font-medium ${
                        servico.ativo
                          ? "bg-green-500/10 text-green-400 border border-green-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {servico.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => abrirEditarModal(servico)}
                        className="px-2 py-1 text-xs border border-white/10 text-blue-400 hover:bg-white/5 rounded"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleAtivo(servico)}
                        className={`px-2 py-1 text-xs border border-white/10 rounded hover:bg-white/5 ${
                          servico.ativo ? "text-red-400" : "text-green-400"
                        }`}
                      >
                        {servico.ativo ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4 text-white">
              {editando ? "Editar Serviço" : "Novo Serviço"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Estabelecimento *
                </label>
                <select
                  value={form.estabelecimentoId}
                  onChange={(e) =>
                    setForm({ ...form, estabelecimentoId: e.target.value })
                  }
                  disabled={!!editando}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
                >
                  {estabelecimentos.map((estab) => (
                    <option key={estab.id} value={estab.id}>
                      {estab.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Ex: Corte Masculino"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Descrição
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) =>
                    setForm({ ...form, descricao: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Duração (min) *
                  </label>
                  <input
                    type="number"
                    value={form.duracao}
                    onChange={(e) =>
                      setForm({ ...form, duracao: e.target.value })
                    }
                    min="5"
                    step="5"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    value={form.preco}
                    onChange={(e) =>
                      setForm({ ...form, preco: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="precoAPartir"
                  checked={form.precoAPartir}
                  onChange={(e) =>
                    setForm({ ...form, precoAPartir: e.target.checked })
                  }
                  className="rounded border-white/10 bg-black"
                />
                <label htmlFor="precoAPartir" className="text-sm text-gray-400">
                  Preço "A partir de" (valor variável)
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
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
