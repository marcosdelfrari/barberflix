"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

export default function NovoEstabelecimentoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    endereco: "",
    telefone: "",
    email: "",
    cnpj: "",
    responsavel: "",
    descricao: "",
    horarioAbre: "09:00",
    horarioFecha: "18:00",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/estabelecimentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/dashboard/estabelecimentos");
        router.refresh();
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao criar estabelecimento");
      }
    } catch (error) {
      console.error("Erro ao criar estabelecimento:", error);
      alert("Erro ao criar estabelecimento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/dashboard/estabelecimentos"
          className="p-2 hover:bg-zinc-900 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-2xl font-bold text-white">Novo Estabelecimento</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Informações Básicas
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Nome do Estabelecimento *
            </label>
            <input
              type="text"
              name="nome"
              required
              value={formData.nome}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Ex: Barbearia Central"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Endereço Completo *
            </label>
            <input
              type="text"
              name="endereco"
              required
              value={formData.endereco}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Telefone
              </label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="contato@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                CNPJ
              </label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Responsável
              </label>
              <input
                type="text"
                name="responsavel"
                value={formData.responsavel}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                placeholder="Nome do responsável"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Descrição
            </label>
            <textarea
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              placeholder="Breve descrição do estabelecimento..."
            />
          </div>
        </div>

        <div className="bg-zinc-900 p-6 rounded-xl border border-white/10 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">
            Horário de Funcionamento
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Horário de Abertura
              </label>
              <input
                type="time"
                name="horarioAbre"
                value={formData.horarioAbre}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 scheme-dark"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Horário de Fechamento
              </label>
              <input
                type="time"
                name="horarioFecha"
                value={formData.horarioFecha}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20 scheme-dark"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/dashboard/estabelecimentos"
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-black px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? "Salvando..." : "Salvar Estabelecimento"}
          </button>
        </div>
      </form>
    </div>
  );
}
