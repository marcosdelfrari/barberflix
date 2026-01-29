"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Professional {
  id: string;
  nome: string;
  especialidade: string | null;
  foto: string | null;
  bio: string | null;
}

interface ProfessionalSelectorProps {
  establishmentId: string;
  onSelect: (professionalId: string) => void;
}

export function ProfessionalSelector({
  establishmentId,
  onSelect,
}: ProfessionalSelectorProps) {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchProfessionals() {
      if (!establishmentId) {
        setProfessionals([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/profissionais?estabelecimentoId=${establishmentId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setProfessionals(data);
        }
      } catch (error) {
        console.error("Erro ao buscar profissionais:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfessionals();
    setSelected(""); // Reset seleção quando muda o estabelecimento
  }, [establishmentId]);

  const handleSelect = (id: string) => {
    setSelected(id);
    onSelect(id);
  };

  if (!establishmentId) {
    return (
      <p className="text-gray-500">Selecione um estabelecimento primeiro</p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Nenhum profissional disponível neste estabelecimento
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {professionals.map((professional) => (
        <button
          key={professional.id}
          onClick={() => handleSelect(professional.id)}
          className={`p-3 rounded-xl text-left transition-all duration-200 ${
            selected === professional.id
              ? "bg-white text-black ring-2 ring-white"
              : "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            {/* Informações (Esquerda) */}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm mb-1 truncate">
                {professional.nome}
              </div>

              <div
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mb-1.5 ${
                  selected === professional.id
                    ? "bg-black/10 text-black/70"
                    : "bg-white/10 text-gray-400"
                }`}
              >
                {professional.especialidade}
              </div>

              {professional.bio && (
                <div
                  className={`text-[10px] line-clamp-2 ${
                    selected === professional.id
                      ? "text-black/60"
                      : "text-gray-500"
                  }`}
                >
                  {professional.bio}
                </div>
              )}
            </div>

            {/* Foto do Profissional (Direita) */}
            <div className="relative shrink-0 w-14 h-14 rounded-full overflow-hidden bg-zinc-700">
              {professional.foto ? (
                <Image
                  src={professional.foto}
                  alt={professional.nome}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-bold text-zinc-500">
                  {professional.nome.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
