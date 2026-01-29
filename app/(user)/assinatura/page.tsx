"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";

interface Plano {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  vigencia: string | null;
  features: string[];
  destaque: boolean;
}

interface Subscription {
  plano: string;
  status: string;
  proximaRenovacao: string;
  valor: number;
}

export default function AssinaturaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [confirmacaoPlano, setConfirmacaoPlano] = useState<Plano | null>(null);

  // Buscar planos da API
  useEffect(() => {
    async function fetchPlanos() {
      try {
        const response = await fetch("/api/planos");
        if (response.ok) {
          const data = await response.json();
          setPlanos(data);
        }
      } catch (error) {
        console.error("Erro ao buscar planos:", error);
      } finally {
        setLoadingPlanos(false);
      }
    }

    fetchPlanos();
  }, []);

  // Buscar assinatura do usuário
  useEffect(() => {
    async function fetchSubscription() {
      try {
        const response = await fetch("/api/assinatura");
        if (response.ok) {
          const data = await response.json();
          if (data.assinatura) {
            setSubscription({
              plano: data.assinatura.plano.nome,
              status: data.assinatura.status === "ACTIVE" ? "ativa" : "inativa",
              proximaRenovacao: data.assinatura.proximaCobranca
                ? new Date(data.assinatura.proximaCobranca).toLocaleDateString(
                    "pt-BR",
                  )
                : "-",
              valor: Number(data.assinatura.plano.preco),
            });
          }
        }
      } catch (error) {
        console.error("Erro ao buscar assinatura:", error);
      } finally {
        setLoadingSubscription(false);
      }
    }

    fetchSubscription();
  }, []);

  const hasSubscription = subscription !== null;

  const handleAssinarClick = (plano: (typeof planos)[0]) => {
    setConfirmacaoPlano(plano);
  };

  const confirmarAssinatura = async () => {
    if (!confirmacaoPlano) return;

    const plano = confirmacaoPlano;
    setLoading(plano.id);
    setConfirmacaoPlano(null);

    try {
      const response = await fetch("/api/assinatura", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planoId: plano.id,
          planoNome: plano.nome,
          planoPreco: plano.preco,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirecionar para página de obrigado
        router.push(
          `/assinatura/obrigado?plano=${encodeURIComponent(plano.nome)}`,
        );
      } else {
        alert(data.error || "Erro ao realizar assinatura");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar com o servidor");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold">Assinatura</h2>
        <p className="text-gray-500 text-sm">Gerencie seu plano e pagamentos</p>
      </div>

      {/* Seção Seu Plano (se existir) */}
      <section className="space-y-4">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Seu Plano Atual
          </h3>
          {loadingSubscription ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            !hasSubscription && (
              <span className="text-xs text-gray-500 font-medium">
                Nenhuma assinatura ativa
              </span>
            )
          )}
        </div>
        <SubscriptionStatusCard subscription={subscription} hideButtonOnEmpty />
      </section>

      {/* Seção Planos Disponíveis */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
            Planos Disponíveis
          </h3>
          {!loadingPlanos && planos.length > 1 && (
            <div className="flex items-center text-gray-500 text-xs gap-1 animate-pulse">
              <span>Deslize</span>
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
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          )}
        </div>

        {loadingPlanos ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x snap-mandatory -mx-6 px-6 scrollbar-hide">
            {planos.map((plano) => (
              <div
                key={plano.id}
                className={`min-w-[280px] snap-center bg-zinc-900 p-6 rounded-2xl shadow-sm border flex flex-col justify-between relative overflow-hidden ${
                  plano.destaque
                    ? "border-white/20 ring-1 ring-white/10"
                    : "border-white/5"
                }`}
              >
                {plano.destaque && (
                  <div className="absolute top-0 right-0 bg-white text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                    MAIS POPULAR
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-bold text-white mb-1">
                    {plano.nome}
                  </h4>
                  <p className="text-xs text-gray-400 mb-4">
                    Tempo de vigência: {plano.vigencia || "Indeterminado"}
                  </p>

                  <div className="mb-6">
                    <span className="text-3xl font-bold text-white">
                      R$ {plano.preco.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">/mês</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plano.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <svg
                          className="w-4 h-4 text-green-400"
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
                        {feature}
                      </div>
                    ))}

                    <div className="pt-2 flex flex-col gap-1">
                      <button className="text-xs text-gray-400 hover:text-white text-left transition-colors flex items-center gap-1">
                        Confira as vantagens
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      <button className="text-xs text-gray-400 hover:text-white text-left transition-colors">
                        Termos de uso
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleAssinarClick(plano)}
                  disabled={
                    loading !== null ||
                    (hasSubscription && subscription?.plano === plano.nome)
                  }
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    plano.destaque
                      ? "bg-white text-black hover:bg-gray-200"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {loading === plano.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Processando...
                    </span>
                  ) : hasSubscription ? (
                    subscription?.plano === plano.nome ? (
                      "Seu Plano Atual"
                    ) : plano.preco > (subscription?.valor || 0) ? (
                      "Fazer Upgrade"
                    ) : (
                      "Trocar Plano"
                    )
                  ) : (
                    "Assinar Agora"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Espaçador para o menu flutuante */}
      <div className="h-4" />

      {/* Modal de Confirmação */}
      {confirmacaoPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setConfirmacaoPlano(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-2">Confirmar Assinatura</h3>
              <p className="text-gray-400 text-sm">
                Você está prestes a assinar o plano:
              </p>
            </div>

            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{confirmacaoPlano.nome}</h4>
                <span className="font-bold text-green-400">
                  R$ {confirmacaoPlano.preco.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <p className="text-sm text-gray-300 mb-3">
                {confirmacaoPlano.descricao}
              </p>
              <ul className="space-y-2">
                {confirmacaoPlano.features.slice(0, 3).map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <svg
                      className="w-3 h-3 text-green-400 flex-shrink-0"
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
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmacaoPlano(null)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAssinatura}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
