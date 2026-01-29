"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProfessionalSelector } from "@/components/ProfessionalSelector";
import { ServiceSelector } from "@/components/ServiceSelector";
import { CalendarAvailability } from "@/components/CalendarAvailability";

type Step = 1 | 2 | 3 | 4;

interface Establishment {
  id: string;
  nome: string;
  endereco: string;
  foto: string | null;
  horarioAbre: string | null;
  horarioFecha: string | null;
}

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedEstablishment, setSelectedEstablishment] =
    useState<string>("");
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Buscar estabelecimentos da API
  useEffect(() => {
    async function fetchEstablishments() {
      try {
        const response = await fetch("/api/estabelecimentos");
        if (response.ok) {
          const data = await response.json();
          setEstablishments(data);
        }
      } catch (error) {
        console.error("Erro ao buscar estabelecimentos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchEstablishments();
  }, []);

  const steps = [
    { number: 1, title: "Local" },
    { number: 2, title: "Profissional" },
    { number: 3, title: "Serviços" },
    { number: 4, title: "Horário" },
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep((step + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleEstablishmentSelect = (id: string) => {
    setSelectedEstablishment(id);
    // Reset seleções dependentes
    setSelectedProfessional("");
    setSelectedServices([]);
    setSelectedDateTime("");
  };

  const handleServicesSelect = (serviceIds: string[]) => {
    setSelectedServices(serviceIds);
    // Reset data/hora quando muda os serviços
    setSelectedDateTime("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="mb-10 pt-2">
        <div className="flex items-start justify-between relative max-w-lg mx-auto">
          {steps.map((s, index) => (
            <div
              key={s.number}
              className="flex-1 flex flex-col items-center relative"
            >
              {/* Linha conectora (exceto para o último) */}
              {index < steps.length - 1 && (
                <div className="absolute top-6 left-[50%] right-[-50%] h-[2px] bg-zinc-800 -z-10">
                  <div
                    className={`h-full bg-white transition-all duration-500 ease-out ${
                      step > s.number ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              )}

              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 z-10 ${
                  step >= s.number
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-110"
                    : "bg-zinc-900 text-zinc-600 border-2 border-zinc-800"
                }`}
              >
                {s.number}
              </div>
              <span
                className={`mt-3 text-[10px] font-bold tracking-widest uppercase transition-colors duration-300 ${
                  step >= s.number ? "text-white" : "text-zinc-600"
                }`}
              >
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-white/5">
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Selecione o Estabelecimento
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            ) : (
              /* Buttons/Cards Mode */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {establishments.map((establishment) => (
                  <button
                    key={establishment.id}
                    onClick={() => handleEstablishmentSelect(establishment.id)}
                    className={`group relative overflow-hidden rounded-xl text-left transition-all duration-200 ${
                      selectedEstablishment === establishment.id
                        ? "ring-2 ring-white"
                        : "hover:ring-1 hover:ring-white/30"
                    }`}
                  >
                    {/* Imagem do Estabelecimento */}
                    <div className="relative h-28 w-full bg-zinc-800">
                      {establishment.foto ? (
                        <Image
                          src={establishment.foto}
                          alt={establishment.nome}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <svg
                            className="w-10 h-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Horário de Funcionamento Flutuante */}
                      <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1">
                        <svg
                          className="w-3 h-3 text-white/70"
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
                        <span className="text-[10px] font-medium text-white">
                          {establishment.horarioAbre} -{" "}
                          {establishment.horarioFecha}
                        </span>
                      </div>

                      {/* Overlay de seleção */}
                      {selectedEstablishment === establishment.id && (
                        <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                          <div className="bg-white rounded-full p-1.5">
                            <svg
                              className="w-4 h-4 text-black"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Informações */}
                    <div
                      className={`p-3 ${
                        selectedEstablishment === establishment.id
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-white"
                      }`}
                    >
                      <h3 className="font-bold text-sm mb-0.5 truncate">
                        {establishment.nome}
                      </h3>
                      <p
                        className={`text-[10px] truncate ${
                          selectedEstablishment === establishment.id
                            ? "text-black/60"
                            : "text-gray-400"
                        }`}
                      >
                        {establishment.endereco}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">
              Selecione o Profissional
            </h2>
            <ProfessionalSelector
              establishmentId={selectedEstablishment}
              onSelect={setSelectedProfessional}
            />
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">
              Selecione os Serviços
            </h2>
            <ServiceSelector
              professionalId={selectedProfessional}
              onSelect={handleServicesSelect}
              multiple={true}
            />
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">
              Selecione Data e Horário
            </h2>
            <CalendarAvailability
              professionalId={selectedProfessional}
              servicosIds={selectedServices}
              onSelect={setSelectedDateTime}
            />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="fixed bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-30" />

        {/* Navigation Buttons - Floating */}
        <div className="fixed bottom-28 left-0 right-0 px-6 z-40 flex justify-center pointer-events-none">
          <div className="w-full max-w-md flex gap-3 pointer-events-auto">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 py-3.5 border border-white/10 bg-zinc-900/90 backdrop-blur-md rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-95"
              >
                Voltar
              </button>
            )}

            {step < 4 ? (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !selectedEstablishment) ||
                  (step === 2 && !selectedProfessional) ||
                  (step === 3 && selectedServices.length === 0)
                }
                className="flex-[2] py-3.5 bg-white text-black rounded-2xl text-sm font-bold shadow-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center justify-center gap-2"
              >
                Continuar
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={!selectedDateTime || submitting}
                className="flex-[2] py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold shadow-xl hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-95 flex items-center justify-center gap-2"
              >
                {submitting ? "Confirmando..." : "Confirmar Agendamento"}
                {!submitting && (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spacer for floating elements */}
      <div className="h-32"></div>
    </div>
  );

  async function handleConfirm() {
    if (!selectedDateTime || selectedServices.length === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/agendamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          estabelecimentoId: selectedEstablishment,
          profissionalId: selectedProfessional,
          servicosIds: selectedServices,
          dataHora: selectedDateTime,
        }),
      });

      if (response.ok) {
        router.push("/perfil?success=true");
      } else {
        const error = await response.json();
        alert(error.error || "Erro ao criar agendamento");
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      alert("Erro ao criar agendamento. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }
}
