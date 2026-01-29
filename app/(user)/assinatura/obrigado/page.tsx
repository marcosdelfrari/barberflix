"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";

export default function ThankYouPage() {
  const searchParams = useSearchParams();
  const planoNome = searchParams.get("plano") || "seu plano";

  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Conteúdo */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Ícone de sucesso animado */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
            <div className="w-16 h-16 rounded-full bg-green-500/40 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-green-400"
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
            </div>
          </div>

          {/* Confetti simples */}
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 rounded-full animate-ping"
                  style={{
                    backgroundColor: [
                      "#22c55e",
                      "#3b82f6",
                      "#eab308",
                      "#ec4899",
                    ][i % 4],
                    left: `${50 + Math.cos((i * 30 * Math.PI) / 180) * 60}%`,
                    top: `${50 + Math.sin((i * 30 * Math.PI) / 180) * 60}%`,
                    animationDelay: `${i * 100}ms`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mensagem */}
        <h1 className="text-3xl font-bold text-center mb-3">Parabéns!</h1>
        <p className="text-gray-400 text-center mb-2">
          Sua assinatura do plano
        </p>
        <p className="text-xl font-bold text-white mb-6">{planoNome}</p>
        <p className="text-gray-400 text-center mb-8">
          foi realizada com sucesso!
        </p>

        {/* Card de resumo */}
        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-white/10 p-6 mb-8">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
            Próximos passos
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-300">
                Acesse a aba <strong>Agendar</strong> para marcar seu primeiro
                horário
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-300">
                Escolha o profissional e o horário que preferir
              </p>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-300">
                Aproveite seus benefícios exclusivos!
              </p>
            </li>
          </ul>
        </div>

        {/* Botões */}
        <div className="w-full max-w-sm space-y-3">
          <Link
            href="/agendar"
            className="block w-full bg-white text-black text-center py-4 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Agendar Agora
          </Link>
          <Link
            href="/home"
            className="block w-full bg-zinc-800 text-white text-center py-4 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-colors border border-white/10"
          >
            Ir para Início
          </Link>
        </div>
      </div>

      {/* Espaçador para o menu */}
      <div className="h-24" />

      {/* Menu Inferior */}
      <BottomNav />
    </div>
  );
}
