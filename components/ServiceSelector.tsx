"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface Service {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
  precoAPartir: boolean;
  descricao: string | null;
}

interface ServiceSelectorProps {
  professionalId: string;
  onSelect: (serviceIds: string[]) => void;
  multiple?: boolean;
}

export function ServiceSelector({
  professionalId,
  onSelect,
  multiple = true,
}: ServiceSelectorProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchServices() {
      if (!professionalId) {
        setServices([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/servicos?profissionalId=${professionalId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
    setSelected([]); // Reset seleção quando muda o profissional
  }, [professionalId]);

  const handleSelect = (id: string) => {
    let newSelected: string[];

    if (multiple) {
      if (selected.includes(id)) {
        newSelected = selected.filter((s) => s !== id);
      } else {
        newSelected = [...selected, id];
      }
    } else {
      newSelected = [id];
    }

    setSelected(newSelected);
    onSelect(newSelected);
  };

  const totalPrice = services
    .filter((s) => selected.includes(s.id))
    .reduce((acc, s) => acc + s.preco, 0);

  const totalDuration = services
    .filter((s) => selected.includes(s.id))
    .reduce((acc, s) => acc + s.duracao, 0);

  const hasPrecoAPartir = services
    .filter((s) => selected.includes(s.id))
    .some((s) => s.precoAPartir);

  if (!professionalId) {
    return <p className="text-gray-500">Selecione um profissional primeiro</p>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <p className="text-gray-500 text-center py-8">
        Nenhum serviço disponível para este profissional
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {multiple && (
        <p className="text-sm text-gray-400">Selecione um ou mais serviços</p>
      )}

      <div className="space-y-3">
        {services.map((service) => {
          const isSelected = selected.includes(service.id);

          return (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              className={`w-full p-3 rounded-xl text-left transition-all duration-200 ${
                isSelected
                  ? "bg-white text-black ring-2 ring-white"
                  : "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  {/* Checkbox visual */}
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? "bg-black text-white"
                        : "bg-zinc-700 border border-zinc-600"
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm mb-0.5">
                      {service.nome}
                    </div>
                    {service.descricao && (
                      <div
                        className={`text-[10px] mb-1.5 ${
                          isSelected ? "text-black/60" : "text-gray-400"
                        }`}
                      >
                        {service.descricao}
                      </div>
                    )}
                    <div
                      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-black/10 text-black/70"
                          : "bg-white/10 text-gray-400"
                      }`}
                    >
                      <svg
                        className="w-3 h-3"
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
                      {service.duracao} min
                    </div>
                  </div>
                </div>
                <div
                  className={`text-base font-bold whitespace-nowrap ${
                    isSelected ? "text-black" : "text-white"
                  }`}
                >
                  {service.precoAPartir && (
                    <span className="text-xs font-normal mr-1">
                      A partir de
                    </span>
                  )}
                  R$ {service.preco.toFixed(2)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resumo dos serviços selecionados */}
      {selected.length > 0 && (
        <div className="bg-zinc-800/50 rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-400">
              {selected.length} serviço{selected.length > 1 ? "s" : ""}{" "}
              selecionado{selected.length > 1 ? "s" : ""}
            </span>
            <span className="text-gray-400">
              Duração total: {totalDuration} min
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total:</span>
            <span className="text-xl font-bold text-white">
              {hasPrecoAPartir && (
                <span className="text-sm font-normal mr-2">A partir de</span>
              )}
              R$ {totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
