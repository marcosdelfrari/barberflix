"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Agendamento {
  id: string;
  estabelecimento: string;
  profissional: string;
  servico: string;
  data: string;
  horario: string;
  status: string;
  dataObj: Date;
}

interface HomeAppointmentsProps {
  initialAgendamentos: Agendamento[];
}

export function HomeAppointments({
  initialAgendamentos,
}: HomeAppointmentsProps) {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState(initialAgendamentos);
  const [selectedAgendamento, setSelectedAgendamento] =
    useState<Agendamento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCardClick = (agendamento: Agendamento) => {
    setSelectedAgendamento(agendamento);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgendamento(null);
  };

  const handleCancelAppointment = async () => {
    if (!selectedAgendamento) return;

    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/agendamentos/${selectedAgendamento.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "CANCELADO" }),
        },
      );

      if (response.ok) {
        // Atualizar lista local
        setAgendamentos((prev) =>
          prev.filter((a) => a.id !== selectedAgendamento.id),
        );
        handleCloseModal();
        router.refresh(); // Atualiza dados do servidor
      } else {
        alert("Erro ao cancelar agendamento");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao cancelar agendamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {agendamentos.length > 0 ? (
        <div className="space-y-4">
          {agendamentos.map((agendamento) => (
            <div
              key={agendamento.id}
              onClick={() => handleCardClick(agendamento)}
              className="bg-zinc-900 p-5 rounded-2xl shadow-sm border border-white/5 flex items-center justify-between cursor-pointer hover:bg-zinc-800 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white text-black w-12 h-12 rounded-xl flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-bold">
                    {agendamento.data.split("/")[1]}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {agendamento.data.split("/")[0]}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white">
                    {agendamento.servico}
                  </h4>
                  <p className="text-xs text-gray-400">
                    {agendamento.profissional} • {agendamento.horario}
                  </p>
                </div>
              </div>
              <div className="bg-green-500/10 text-green-400 p-1.5 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-900 p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
          <p className="text-gray-400 text-sm">Nenhum agendamento futuro.</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedAgendamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-white/10 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white">
                Detalhes do Agendamento
              </h3>
              <p className="text-gray-400 text-sm">
                O que deseja fazer com este agendamento?
              </p>
            </div>

            <div className="bg-black/20 p-4 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Serviço</span>
                <span className="text-white font-medium">
                  {selectedAgendamento.servico}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Profissional</span>
                <span className="text-white font-medium">
                  {selectedAgendamento.profissional}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Data e Hora</span>
                <span className="text-white font-medium">
                  {selectedAgendamento.data} às {selectedAgendamento.horario}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => alert("Funcionalidade de edição em breve!")}
                className="w-full bg-zinc-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={loading}
                className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl font-bold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {loading ? "Cancelando..." : "Cancelar"}
              </button>
            </div>

            <button
              onClick={handleCloseModal}
              className="w-full text-gray-500 text-sm font-medium hover:text-white transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
