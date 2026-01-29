export function SubscriptionStatusCard({
  subscription,
  hideButtonOnEmpty = false,
}: {
  subscription?: any;
  hideButtonOnEmpty?: boolean;
}) {
  // Mock data se não for passado
  const defaultSubscription = {
    plano: "Premium",
    status: "ativa",
    proximaRenovacao: "28/02/2026",
    valor: 99.0,
  };

  const data = subscription === undefined ? defaultSubscription : subscription;

  if (!data) {
    return (
      <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-white/5">
        <h3 className="text-md font-bold mb-2 text-white">Sua Assinatura</h3>
        <p className="text-gray-400 text-xs mb-4 leading-relaxed">
          Você ainda não possui um plano ativo. Assine agora para ter acesso aos
          nossos serviços.
        </p>
        {!hideButtonOnEmpty && (
          <a
            href="/assinatura"
            className="inline-block w-full text-center bg-white text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
          >
            Adquirir Plano
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl shadow-sm border border-white/5">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            Status
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              data.status === "ativa"
                ? "bg-green-500/10 text-green-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {data.status === "ativa" ? "Ativo" : "Inativo"}
          </span>
        </div>
        <div className="text-right">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            Plano
          </h3>
          <span className="font-bold text-white">{data.plano}</span>
        </div>
      </div>

      <div className="space-y-3 pt-4 border-t border-white/5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Renovação</span>
          <span className="font-semibold text-white">
            {data.proximaRenovacao}
          </span>
        </div>
        <div className="flex justify-between items-center pt-2">
          <span className="text-gray-400 text-sm">Investimento</span>
          <span className="font-black text-xl text-white">
            R$ {data.valor.toFixed(2)}
          </span>
        </div>
      </div>

      <a
        href="/assinatura"
        className="block mt-6 text-center text-xs font-bold text-gray-400 hover:text-white transition-colors"
      >
        GERENCIAR ASSINATURA →
      </a>
    </div>
  );
}
