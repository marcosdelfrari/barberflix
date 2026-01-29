"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Disponibilidade {
  id: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}

interface Agendamento {
  id: string;
  dataHora: string;
  dataFim: string;
}

interface Servico {
  id: string;
  nome: string;
  duracao: number;
  preco: number;
}

interface CalendarAvailabilityProps {
  professionalId: string;
  servicosIds: string[];
  onSelect: (dateTime: string) => void;
}

export function CalendarAvailability({
  professionalId,
  servicosIds,
  onSelect,
}: CalendarAvailabilityProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>(
    [],
  );
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const horarioSectionRef = useRef<HTMLDivElement>(null);

  // Calcular duração total dos serviços selecionados
  const duracaoTotal = servicos
    .filter((s) => servicosIds.includes(s.id))
    .reduce((acc, s) => acc + s.duracao, 0);

  // Buscar serviços do profissional
  useEffect(() => {
    async function fetchServicos() {
      if (!professionalId) return;

      try {
        const response = await fetch(
          `/api/servicos?profissionalId=${professionalId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setServicos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar serviços:", error);
      }
    }

    fetchServicos();
  }, [professionalId]);

  // Buscar disponibilidades do profissional
  useEffect(() => {
    async function fetchDisponibilidades() {
      if (!professionalId) return;

      setLoading(true);
      try {
        const response = await fetch(
          `/api/disponibilidade?profissionalId=${professionalId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setDisponibilidades(data);
        }
      } catch (error) {
        console.error("Erro ao buscar disponibilidades:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDisponibilidades();
  }, [professionalId]);

  // Gerar slots de horário baseado na disponibilidade e agendamentos
  const generateTimeSlots = useCallback(
    async (date: string, disp: Disponibilidade, duracao: number) => {
      const slots: string[] = [];
      const [horaInicio, minInicio] = disp.horaInicio.split(":").map(Number);
      const [horaFim, minFim] = disp.horaFim.split(":").map(Number);

      // Buscar agendamentos do dia
      let agendamentos: Agendamento[] = [];
      try {
        const response = await fetch(
          `/api/agendamentos?profissionalId=${professionalId}&data=${date}`,
        );
        if (response.ok) {
          agendamentos = await response.json();
        }
      } catch (error) {
        console.error("Erro ao buscar agendamentos:", error);
      }

      // Gerar slots de 30 em 30 minutos
      let hora = horaInicio;
      let min = minInicio;

      // Calcular o horário máximo para agendar (considerando a duração total)
      const fimEmMinutos = horaFim * 60 + minFim;

      while (true) {
        const slotInicioEmMinutos = hora * 60 + min;
        const slotFimEmMinutos = slotInicioEmMinutos + duracao;

        // Verificar se o slot + duração cabe dentro do horário de trabalho
        if (slotFimEmMinutos > fimEmMinutos) {
          break;
        }

        const timeStr = `${hora.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        const slotDateTime = new Date(`${date}T${timeStr}:00`);
        const slotEndDateTime = new Date(
          slotDateTime.getTime() + duracao * 60000,
        );

        // Verificar se o slot não está no passado
        const now = new Date();
        if (slotDateTime > now) {
          // Verificar se o slot + duração não conflita com agendamentos existentes
          const hasConflict = agendamentos.some((ag) => {
            const agStart = new Date(ag.dataHora);
            const agEnd = new Date(ag.dataFim);

            // Verifica sobreposição de intervalos
            return slotDateTime < agEnd && slotEndDateTime > agStart;
          });

          if (!hasConflict) {
            slots.push(timeStr);
          }
        }

        // Incrementar 30 minutos
        min += 30;
        if (min >= 60) {
          min = 0;
          hora += 1;
        }
      }

      return slots;
    },
    [professionalId],
  );

  // Atualizar slots quando a data for selecionada
  useEffect(() => {
    async function updateSlots() {
      if (
        !selectedDate ||
        disponibilidades.length === 0 ||
        duracaoTotal === 0
      ) {
        setAvailableSlots([]);
        return;
      }

      const dateObj = new Date(selectedDate + "T12:00:00");
      const diaSemana = dateObj.getDay(); // 0 = Domingo

      const disp = disponibilidades.find((d) => d.diaSemana === diaSemana);
      if (!disp) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      const slots = await generateTimeSlots(selectedDate, disp, duracaoTotal);
      setAvailableSlots(slots);
      setLoadingSlots(false);
    }

    updateSlots();
    setSelectedTime(""); // Reset horário quando muda a data
  }, [selectedDate, disponibilidades, generateTimeSlots, duracaoTotal]);

  // Notificar seleção
  useEffect(() => {
    if (selectedDate && selectedTime) {
      const dateTime = `${selectedDate}T${selectedTime}:00`;
      onSelect(dateTime);
    }
  }, [selectedDate, selectedTime, onSelect]);

  // Gerar próximos 14 dias (mais opções)
  const getNextDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDateDisplay = (date: Date) => {
    const weekday = date.toLocaleDateString("pt-BR", { weekday: "short" });
    const day = date.getDate();
    return { weekday, day };
  };

  // Verificar se o dia tem disponibilidade
  const isDayAvailable = (date: Date) => {
    const diaSemana = date.getDay();
    return disponibilidades.some((d) => d.diaSemana === diaSemana);
  };

  if (!professionalId || servicosIds.length === 0) {
    return (
      <p className="text-gray-500">
        Selecione profissional e serviços primeiro
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info de duração */}
      <div className="bg-zinc-800/50 rounded-lg p-3 border border-white/10">
        <p className="text-sm text-gray-400">
          Duração total dos serviços:{" "}
          <span className="text-white font-bold">{duracaoTotal} min</span>
        </p>
      </div>

      {/* Seleção de Data */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-white">Selecione a Data</h3>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {getNextDays().map((day) => {
            const dateStr = formatDate(day);
            const isSelected = selectedDate === dateStr;
            const isAvailable = isDayAvailable(day);
            const { weekday, day: dayNum } = formatDateDisplay(day);

            return (
              <button
                key={dateStr}
                onClick={() => {
                  if (isAvailable) {
                    setSelectedDate(dateStr);
                    // Rolar para a seção de horários após a data ser selecionada
                    setTimeout(() => {
                      horarioSectionRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 100);
                  }
                }}
                disabled={!isAvailable}
                className={`p-2 rounded-xl text-center transition-all duration-200 ${
                  isSelected
                    ? "bg-white text-black ring-2 ring-white scale-105 font-bold"
                    : isAvailable
                      ? "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                      : "bg-zinc-900 text-zinc-600 cursor-not-allowed opacity-50"
                }`}
              >
                <div className="text-[10px] uppercase font-medium mb-1">
                  {weekday}
                </div>
                <div className="text-lg font-bold">{dayNum}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seleção de Horário */}
      {selectedDate && (
        <div ref={horarioSectionRef}>
          <h3 className="text-sm font-medium mb-3 text-white">
            Selecione o Horário
          </h3>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              Nenhum horário disponível nesta data para a duração total dos
              serviços
            </p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {availableSlots.map((time) => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "bg-white text-black ring-2 ring-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {selectedDate && selectedTime && (
        <div className="p-4 bg-white/10 border border-white/20 rounded-xl">
          <p className="text-sm text-white">
            <span className="font-bold">Agendamento selecionado:</span>{" "}
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            às <span className="font-bold">{selectedTime}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Término previsto:{" "}
            {(() => {
              const start = new Date(`${selectedDate}T${selectedTime}:00`);
              const end = new Date(start.getTime() + duracaoTotal * 60000);
              return end.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
            })()}
          </p>
        </div>
      )}
    </div>
  );
}
