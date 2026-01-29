"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MapPin, Phone, User, Clock } from "lucide-react";

interface Estabelecimento {
  id: string;
  nome: string;
  endereco: string;
  telefone: string;
  email: string;
  responsavel: string;
  horarioAbre: string;
  horarioFecha: string;
  ativo: boolean;
  _count: {
    profissionais: number;
    agendamentos: number;
  };
}

export default function EstabelecimentosPage() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEstabelecimentos();
  }, []);

  async function fetchEstabelecimentos() {
    try {
      const res = await fetch("/api/admin/estabelecimentos");
      if (res.ok) {
        const data = await res.json();
        setEstabelecimentos(data);
      }
    } catch (error) {
      console.error("Erro ao buscar estabelecimentos:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Estabelecimentos</h2>
        <Link
          href="/dashboard/estabelecimentos/novo"
          className="bg-white text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <Plus size={20} />
          Novo Estabelecimento
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">Carregando...</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estabelecimentos.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-zinc-900 rounded-xl border border-white/10">
              <p className="text-gray-400 mb-4">
                Nenhum estabelecimento cadastrado
              </p>
              <Link
                href="/dashboard/estabelecimentos/novo"
                className="text-white underline hover:text-gray-300"
              >
                Cadastre o primeiro
              </Link>
            </div>
          ) : (
            estabelecimentos.map((estab) => (
              <div
                key={estab.id}
                className="bg-zinc-900 rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-white">
                      {estab.nome}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        estab.ativo
                          ? "bg-green-500/10 text-green-400"
                          : "bg-red-500/10 text-red-400"
                      }`}
                    >
                      {estab.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0" />
                      <span>{estab.endereco}</span>
                    </div>
                    {estab.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} />
                        <span>{estab.telefone}</span>
                      </div>
                    )}
                    {estab.responsavel && (
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>Resp: {estab.responsavel}</span>
                      </div>
                    )}
                    {estab.horarioAbre && (
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>
                          {estab.horarioAbre} - {estab.horarioFecha}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {estab._count.profissionais}
                      </p>
                      <p className="text-xs text-gray-500">Profissionais</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {estab._count.agendamentos}
                      </p>
                      <p className="text-xs text-gray-500">Agendamentos</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
