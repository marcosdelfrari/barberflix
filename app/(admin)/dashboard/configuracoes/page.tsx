"use client";

import { useState, useEffect } from "react";

interface Estabelecimento {
  id: string;
  nome: string;
  endereco: string;
  telefone: string | null;
  email: string | null;
  foto: string | null;
  logo: string | null;
  descricao: string | null;
  horarioAbre: string | null;
  horarioFecha: string | null;
  diasFuncionamento: string[];
  ativo: boolean;
}

const diasSemanaOptions = [
  { value: "dom", label: "Domingo" },
  { value: "seg", label: "Segunda" },
  { value: "ter", label: "Terça" },
  { value: "qua", label: "Quarta" },
  { value: "qui", label: "Quinta" },
  { value: "sex", label: "Sexta" },
  { value: "sab", label: "Sábado" },
];

export default function ConfiguracoesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estabelecimento, setEstabelecimento] =
    useState<Estabelecimento | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Form
  const [form, setForm] = useState({
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    foto: "",
    logo: "",
    descricao: "",
    horarioAbre: "",
    horarioFecha: "",
    diasFuncionamento: [] as string[],
  });

  useEffect(() => {
    fetchConfiguracao();
  }, []);

  async function fetchConfiguracao() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/configuracoes");
      if (res.ok) {
        const data = await res.json();
        setEstabelecimento(data);
        setForm({
          nome: data.nome || "",
          endereco: data.endereco || "",
          telefone: data.telefone || "",
          email: data.email || "",
          foto: data.foto || "",
          logo: data.logo || "",
          descricao: data.descricao || "",
          horarioAbre: data.horarioAbre || "",
          horarioFecha: data.horarioFecha || "",
          diasFuncionamento: data.diasFuncionamento || [],
        });
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!estabelecimento) return;

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: estabelecimento.id,
          ...form,
        }),
      });

      if (res.ok) {
        setMessage({
          type: "success",
          text: "Configurações salvas com sucesso!",
        });
        fetchConfiguracao();
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "Erro ao salvar" });
      }
    } catch (error) {
      console.error("Erro:", error);
      setMessage({ type: "error", text: "Erro ao salvar configurações" });
    } finally {
      setSaving(false);
    }
  }

  function toggleDia(dia: string) {
    if (form.diasFuncionamento.includes(dia)) {
      setForm({
        ...form,
        diasFuncionamento: form.diasFuncionamento.filter((d) => d !== dia),
      });
    } else {
      setForm({
        ...form,
        diasFuncionamento: [...form.diasFuncionamento, dia],
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-400">Carregando...</p>
      </div>
    );
  }

  if (!estabelecimento) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-400">Estabelecimento não encontrado</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Configurações</h2>
      </div>

      {/* Mensagem */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-500/10 text-green-400 border border-green-500/30"
              : "bg-red-500/10 text-red-400 border border-red-500/30"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Dados do Negócio */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Dados do Negócio
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Nome do Estabelecimento *
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Endereço *
              </label>
              <input
                type="text"
                value={form.endereco}
                onChange={(e) => setForm({ ...form, endereco: e.target.value })}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  placeholder="(11) 99999-9999"
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                URL da Foto de Capa
              </label>
              <input
                type="text"
                value={form.foto}
                onChange={(e) => setForm({ ...form, foto: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                URL da Logo
              </label>
              <input
                type="text"
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                placeholder="https://..."
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
                rows={3}
                className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              />
            </div>
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4 text-white">
            Horário de Funcionamento
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Horário de Abertura
                </label>
                <input
                  type="time"
                  value={form.horarioAbre}
                  onChange={(e) =>
                    setForm({ ...form, horarioAbre: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Horário de Fechamento
                </label>
                <input
                  type="time"
                  value={form.horarioFecha}
                  onChange={(e) =>
                    setForm({ ...form, horarioFecha: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Dias de Funcionamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                {diasSemanaOptions.map((dia) => (
                  <label
                    key={dia.value}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.diasFuncionamento.includes(dia.value)
                        ? "bg-white text-black border-white"
                        : "bg-black text-gray-400 border-white/10 hover:bg-zinc-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.diasFuncionamento.includes(dia.value)}
                      onChange={() => toggleDia(dia.value)}
                      className="sr-only"
                    />
                    <span>{dia.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 bg-black/50 border border-white/5 rounded-lg">
              <p className="text-sm font-medium text-white mb-2">Preview:</p>
              <p className="text-sm text-gray-400">
                {form.diasFuncionamento.length > 0 ? (
                  <>
                    {form.diasFuncionamento
                      .map(
                        (d) =>
                          diasSemanaOptions.find((opt) => opt.value === d)
                            ?.label,
                      )
                      .join(", ")}
                    {form.horarioAbre && form.horarioFecha && (
                      <>
                        {" "}
                        • {form.horarioAbre} às {form.horarioFecha}
                      </>
                    )}
                  </>
                ) : (
                  "Selecione os dias de funcionamento"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
        >
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}
