"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Disponibilidade {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
}

interface Servico {
  id: string;
  nome: string;
  preco: number;
}

interface Profissional {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  foto: string | null;
  especialidade: string | null;
  bio: string | null;
  ativo: boolean;
  estabelecimento: {
    id: string;
    nome: string;
  };
  disponibilidade: Disponibilidade[];
  servicos: Servico[];
  stats: {
    totalAgendamentos: number;
    agendamentosConcluidos: number;
    faturamento: number;
  };
}

interface Estabelecimento {
  id: string;
  nome: string;
}

interface ServicoEstabelecimento {
  id: string;
  nome: string;
  preco: number;
  precoAPartir: boolean;
}

const diasSemana = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
];

export default function ProfissionaisAdminPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(
    [],
  );
  const [servicosDisponiveis, setServicosDisponiveis] = useState<
    ServicoEstabelecimento[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDisponibilidadeModal, setShowDisponibilidadeModal] =
    useState(false);
  const [editando, setEditando] = useState<Profissional | null>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    foto: "",
    especialidade: "",
    bio: "",
    estabelecimentoId: "",
  });

  // Disponibilidades temporárias
  const [disponibilidades, setDisponibilidades] = useState<
    { diaSemana: number; horaInicio: string; horaFim: string }[]
  >([]);

  // Serviços selecionados
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>(
    [],
  );

  useEffect(() => {
    fetchProfissionais();
    fetchEstabelecimentos();
    fetchServicos();
  }, []);

  async function fetchProfissionais() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profissionais");
      if (res.ok) {
        const data = await res.json();
        setProfissionais(data);
      }
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEstabelecimentos() {
    try {
      const res = await fetch("/api/estabelecimentos");
      if (res.ok) {
        const data = await res.json();
        setEstabelecimentos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar estabelecimentos:", error);
    }
  }

  async function fetchServicos() {
    try {
      const res = await fetch("/api/admin/servicos");
      if (res.ok) {
        const data = await res.json();
        setServicosDisponiveis(data);
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    }
  }

  function abrirNovoModal() {
    setEditando(null);
    setForm({
      nome: "",
      email: "",
      telefone: "",
      foto: "",
      especialidade: "",
      bio: "",
      estabelecimentoId: estabelecimentos[0]?.id || "",
    });
    setDisponibilidades([]);
    setServicosSelecionados([]);
    setShowModal(true);
  }

  function abrirEditarModal(profissional: Profissional) {
    setEditando(profissional);
    setForm({
      nome: profissional.nome,
      email: profissional.email || "",
      telefone: profissional.telefone || "",
      foto: profissional.foto || "",
      especialidade: profissional.especialidade || "",
      bio: profissional.bio || "",
      estabelecimentoId: profissional.estabelecimento.id,
    });
    setDisponibilidades(
      profissional.disponibilidade.map((d) => ({
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
      })),
    );
    setServicosSelecionados(profissional.servicos.map((s) => s.id));
    setShowModal(true);
  }

  function abrirDisponibilidadeModal(profissional: Profissional) {
    setEditando(profissional);
    setDisponibilidades(
      profissional.disponibilidade.map((d) => ({
        diaSemana: d.diaSemana,
        horaInicio: d.horaInicio,
        horaFim: d.horaFim,
      })),
    );
    setShowDisponibilidadeModal(true);
  }

  async function handleSave() {
    if (!form.nome || !form.estabelecimentoId) {
      alert("Nome e estabelecimento são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const url = editando
        ? `/api/admin/profissionais/${editando.id}`
        : "/api/admin/profissionais";

      const res = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          disponibilidades: editando ? undefined : disponibilidades,
          servicosIds: servicosSelecionados,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        fetchProfissionais();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar profissional");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDisponibilidade() {
    if (!editando) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/profissionais/${editando.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disponibilidades }),
      });

      if (res.ok) {
        setShowDisponibilidadeModal(false);
        fetchProfissionais();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao salvar disponibilidades");
    } finally {
      setSaving(false);
    }
  }

  function toggleServico(servicoId: string) {
    if (servicosSelecionados.includes(servicoId)) {
      setServicosSelecionados(
        servicosSelecionados.filter((id) => id !== servicoId),
      );
    } else {
      setServicosSelecionados([...servicosSelecionados, servicoId]);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja desativar este profissional?")) return;

    try {
      const res = await fetch(`/api/admin/profissionais/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchProfissionais();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao desativar");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao desativar profissional");
    }
  }

  async function handleToggleAtivo(profissional: Profissional) {
    try {
      const res = await fetch(`/api/admin/profissionais/${profissional.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !profissional.ativo }),
      });

      if (res.ok) {
        fetchProfissionais();
      }
    } catch (error) {
      console.error("Erro:", error);
    }
  }

  function addDisponibilidade() {
    setDisponibilidades([
      ...disponibilidades,
      { diaSemana: 1, horaInicio: "08:00", horaFim: "18:00" },
    ]);
  }

  function removeDisponibilidade(index: number) {
    setDisponibilidades(disponibilidades.filter((_, i) => i !== index));
  }

  function updateDisponibilidade(
    index: number,
    field: string,
    value: string | number,
  ) {
    const updated = [...disponibilidades];
    updated[index] = { ...updated[index], [field]: value };
    setDisponibilidades(updated);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Profissionais</h2>
        <button
          onClick={abrirNovoModal}
          className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 font-medium"
        >
          Novo Profissional
        </button>
      </div>

      {/* Cards de Profissionais */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : profissionais.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          Nenhum profissional cadastrado
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profissionais.map((profissional) => (
            <div
              key={profissional.id}
              className={`bg-zinc-900 rounded-xl border border-white/10 overflow-hidden ${
                !profissional.ativo ? "opacity-60" : ""
              }`}
            >
              {/* Header com foto */}
              <div className="p-4 border-b border-white/10 flex items-center gap-4">
                {profissional.foto ? (
                  <Image
                    src={profissional.foto}
                    alt={profissional.nome}
                    width={60}
                    height={60}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-15 h-15 rounded-full bg-zinc-800 flex items-center justify-center text-xl font-bold text-gray-400 border border-white/5">
                    {profissional.nome.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-white">{profissional.nome}</h3>
                  <p className="text-sm text-gray-400">
                    {profissional.especialidade || "—"}
                  </p>
                  {!profissional.ativo && (
                    <span className="text-xs text-red-500 font-medium">
                      Inativo
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span>{profissional.email || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Telefone:</span>
                  <span>{profissional.telefone || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Serviços:</span>
                  <span>{profissional.servicos.length}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="px-4 py-3 bg-black/30 border-t border-b border-white/10 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-bold text-lg text-white">
                    {profissional.stats.totalAgendamentos}
                  </p>
                  <p className="text-gray-500">Agendamentos</p>
                </div>
                <div>
                  <p className="font-bold text-lg text-white">
                    {profissional.stats.agendamentosConcluidos}
                  </p>
                  <p className="text-gray-500">Concluídos</p>
                </div>
                <div>
                  <p className="font-bold text-lg text-white">
                    R$ {(profissional.stats.faturamento / 1000).toFixed(1)}k
                  </p>
                  <p className="text-gray-500">Faturado</p>
                </div>
              </div>

              {/* Horários */}
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-xs font-medium text-gray-500 mb-2">
                  Horários Disponíveis:
                </p>
                {profissional.disponibilidade.length === 0 ? (
                  <p className="text-xs text-gray-600">
                    Nenhum horário configurado
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {profissional.disponibilidade.slice(0, 4).map((d, i) => (
                      <span
                        key={i}
                        className="text-xs bg-white/5 border border-white/10 px-2 py-1 rounded text-gray-300"
                      >
                        {diasSemana[d.diaSemana]?.slice(0, 3)} {d.horaInicio}-
                        {d.horaFim}
                      </span>
                    ))}
                    {profissional.disponibilidade.length > 4 && (
                      <span className="text-xs text-gray-500">
                        +{profissional.disponibilidade.length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="px-4 py-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => abrirEditarModal(profissional)}
                  className="flex-1 px-3 py-1.5 text-sm border border-white/10 rounded hover:bg-white/5 text-gray-300 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => abrirDisponibilidadeModal(profissional)}
                  className="flex-1 px-3 py-1.5 text-sm border border-white/10 rounded hover:bg-white/5 text-gray-300 transition-colors"
                >
                  Horários
                </button>
                <button
                  onClick={() => handleToggleAtivo(profissional)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    profissional.ativo
                      ? "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                      : "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                  }`}
                >
                  {profissional.ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-white">
              {editando ? "Editar Profissional" : "Novo Profissional"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    value={form.telefone}
                    onChange={(e) =>
                      setForm({ ...form, telefone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Estabelecimento *
                </label>
                <select
                  value={form.estabelecimentoId}
                  onChange={(e) =>
                    setForm({ ...form, estabelecimentoId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {estabelecimentos.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Especialidade
                </label>
                <input
                  type="text"
                  value={form.especialidade}
                  onChange={(e) =>
                    setForm({ ...form, especialidade: e.target.value })
                  }
                  placeholder="Ex: Corte + Barba"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  URL da Foto
                </label>
                <input
                  type="text"
                  value={form.foto}
                  onChange={(e) => setForm({ ...form, foto: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Biografia
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Serviços Prestados
                </label>
                <div className="space-y-2 border border-white/10 rounded-lg p-3 bg-black max-h-60 overflow-y-auto">
                  {servicosDisponiveis.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Nenhum serviço disponível.
                    </p>
                  ) : (
                    servicosDisponiveis.map((servico) => {
                      const isSelected = servicosSelecionados.includes(
                        servico.id,
                      );
                      return (
                        <button
                          key={servico.id}
                          type="button"
                          onClick={() => toggleServico(servico.id)}
                          className={`w-full p-2 rounded text-left transition-all duration-200 flex items-center justify-between text-sm ${
                            isSelected
                              ? "bg-zinc-800 text-white border border-white/20"
                              : "text-gray-400 hover:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                isSelected
                                  ? "bg-white border-white text-black"
                                  : "border-zinc-700"
                              }`}
                            >
                              {isSelected && (
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <span>{servico.nome}</span>
                          </div>
                          <span>
                            {servico.precoAPartir && "A partir de "}
                            R$ {servico.preco.toFixed(2)}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {servicosSelecionados.length} selecionado(s)
                </p>
              </div>

              {!editando && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-400">
                      Horários Disponíveis
                    </label>
                    <button
                      type="button"
                      onClick={addDisponibilidade}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      + Adicionar
                    </button>
                  </div>
                  {disponibilidades.map((d, i) => (
                    <div key={i} className="flex gap-2 mb-2 items-center">
                      <select
                        value={d.diaSemana}
                        onChange={(e) =>
                          updateDisponibilidade(
                            i,
                            "diaSemana",
                            parseInt(e.target.value),
                          )
                        }
                        className="flex-1 px-2 py-1 text-sm bg-black border border-white/10 rounded-lg text-white"
                      >
                        {diasSemana.map((dia, idx) => (
                          <option key={idx} value={idx}>
                            {dia}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={d.horaInicio}
                        onChange={(e) =>
                          updateDisponibilidade(i, "horaInicio", e.target.value)
                        }
                        className="px-2 py-1 text-sm bg-black border border-white/10 rounded-lg text-white scheme-dark"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        value={d.horaFim}
                        onChange={(e) =>
                          updateDisponibilidade(i, "horaFim", e.target.value)
                        }
                        className="px-2 py-1 text-sm bg-black border border-white/10 rounded-lg text-white scheme-dark"
                      />
                      <button
                        type="button"
                        onClick={() => removeDisponibilidade(i)}
                        className="text-red-500 hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
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

      {/* Modal Disponibilidade */}
      {showDisponibilidadeModal && editando && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4 text-white">
              Horários de {editando.nome}
            </h3>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-400">
                  Horários Disponíveis
                </label>
                <button
                  type="button"
                  onClick={addDisponibilidade}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  + Adicionar
                </button>
              </div>
              {disponibilidades.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nenhum horário configurado. Clique em adicionar.
                </p>
              ) : (
                disponibilidades.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-2 items-center">
                    <select
                      value={d.diaSemana}
                      onChange={(e) =>
                        updateDisponibilidade(
                          i,
                          "diaSemana",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1 px-2 py-1 text-sm bg-black border border-white/10 rounded-lg text-white"
                    >
                      {diasSemana.map((dia, idx) => (
                        <option key={idx} value={idx}>
                          {dia}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={d.horaInicio}
                      onChange={(e) =>
                        updateDisponibilidade(i, "horaInicio", e.target.value)
                      }
                      className="px-2 py-1 text-sm bg-black border border-white/10 rounded-lg text-white scheme-dark"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={d.horaFim}
                      onChange={(e) =>
                        updateDisponibilidade(i, "horaFim", e.target.value)
                      }
                      className="px-2 py-1 text-sm bg-black border border-white/10 rounded-lg text-white scheme-dark"
                    />
                    <button
                      type="button"
                      onClick={() => removeDisponibilidade(i)}
                      className="text-red-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDisponibilidadeModal(false)}
                className="px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveDisponibilidade}
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
