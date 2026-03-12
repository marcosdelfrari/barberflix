import { SubscriptionStatusCard } from "@/components/SubscriptionStatusCard";
import { HomeAppointments } from "@/components/HomeAppointments";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role === "ADMIN") {
    redirect("/dashboard");
  }

  const userId = session.user.id;

  // Buscar dados em paralelo
  const [usuario, assinatura, agendamentos, planos] = await Promise.all([
    prisma.usuario.findUnique({
      where: { id: userId },
      select: { nome: true },
    }),
    prisma.assinatura.findUnique({
      where: { usuarioId: userId },
      include: { plano: true },
    }),
    prisma.agendamento.findMany({
      where: {
        usuarioId: userId,
        dataHora: {
          gte: new Date(), // Apenas agendamentos futuros
        },
        status: {
          notIn: ["CANCELADO", "NAO_COMPARECEU"],
        },
      },
      include: {
        estabelecimento: true,
        profissional: true,
        servicos: {
          include: {
            servico: true,
          },
        },
      },
      orderBy: {
        dataHora: "asc",
      },
      take: 5, // Limitar a 5 próximos agendamentos
    }),
    prisma.plano.findMany({
      where: { ativo: true },
      orderBy: { preco: "asc" },
    }),
  ]);

  if (!usuario) {
    redirect("/login");
  }

  // Formatar dados da assinatura
  const hasSubscription = assinatura?.status === "ACTIVE";
  const subscriptionData = assinatura
    ? {
        plano: assinatura.plano.nome,
        status: assinatura.status === "ACTIVE" ? "ativa" : "inativa",
        proximaRenovacao: assinatura.proximaCobranca
          ? new Intl.DateTimeFormat("pt-BR").format(assinatura.proximaCobranca)
          : "-",
        valor: Number(assinatura.plano.preco),
      }
    : null;

  // Encontrar plano de upgrade (o próximo mais caro)
  const upgradePlan =
    hasSubscription && assinatura?.plano
      ? planos.find(
          (p: (typeof planos)[number]) =>
            Number(p.preco) > Number(assinatura.plano.preco),
        )
      : null;

  // Formatar dados dos agendamentos
  const agendamentosFormatados = agendamentos.map(
    (agendamento: (typeof agendamentos)[number]) => {
      const dataObj = new Date(agendamento.dataHora);
      const dataFormatada = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(dataObj);

      const horarioFormatado = new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(dataObj);

      // Pegar o primeiro serviço ou listar todos
      const servicosNomes = agendamento.servicos
        .map((s: { servico: { nome: string } }) => s.servico.nome)
        .join(", ");

      return {
        id: agendamento.id,
        estabelecimento: agendamento.estabelecimento.nome,
        profissional: agendamento.profissional.nome,
        servico: servicosNomes || "Serviço",
        data: dataFormatada,
        horario: horarioFormatado,
        status: agendamento.status.toLowerCase(),
        // Dados originais para uso na renderização
        dataObj: dataObj,
      };
    },
  );

  const primeiroNome = usuario.nome.split(" ")[0];

  const newAppointmentButton = (
    <a
      href="/agendar"
      className="flex items-center justify-center gap-2 w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors shadow-lg shadow-white/5"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <line x1="12" y1="14" x2="12" y2="18"></line>
        <line x1="10" y1="16" x2="14" y2="16"></line>
      </svg>
      NOVO AGENDAMENTO
    </a>
  );

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Saudação */}
      <div>
        <h2 className="text-2xl font-bold">Olá, {primeiroNome}! 👋</h2>
        <p className="text-gray-500 text-sm">O que vamos fazer hoje?</p>
      </div>

      {hasSubscription ? (
        // LAYOUT COM ASSINATURA ATIVA
        <>
          {/* Botão de Novo Agendamento (Prioridade) */}
          <div>{newAppointmentButton}</div>

          {/* Seção de Agendamentos */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Próximo Horário
            </h3>
            <HomeAppointments initialAgendamentos={agendamentosFormatados} />
          </section>

          {/* Seção de Upgrade (se houver plano superior) */}
          {upgradePlan && (
            <section className="bg-gradient-to-r from-yellow-600/20 to-yellow-900/20 border border-yellow-500/30 p-6 rounded-3xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div>
                  <div className="inline-block bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wide">
                    Recomendado
                  </div>
                  <h3 className="font-bold text-lg text-white">
                    Upgrade para {upgradePlan.nome}
                  </h3>
                  <p className="text-yellow-100/70 text-xs mt-1">
                    Desbloqueie mais benefícios por apenas R${" "}
                    {Number(upgradePlan.preco).toFixed(2)}/mês
                  </p>
                </div>
                <a
                  href="/assinatura"
                  className="block w-full bg-yellow-500 text-black text-center py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-400 transition-colors"
                >
                  Fazer Upgrade
                </a>
              </div>
            </section>
          )}

          {/* Seção de Plano Atual (Por último) */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Seu Plano
              </h3>
            </div>
            <SubscriptionStatusCard subscription={subscriptionData} />
          </section>
        </>
      ) : (
        // LAYOUT SEM ASSINATURA (Original)
        <>
          {/* 1. Seção de Plano */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                Seu Plano
              </h3>
              <span className="text-xs text-red-500 font-medium animate-pulse">
                Pendente
              </span>
            </div>
            <SubscriptionStatusCard subscription={subscriptionData} />
            <div className="mt-4">{newAppointmentButton}</div>
          </section>

          {/* 2. Seção de Agendamentos */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Próximo Horário
            </h3>
            <HomeAppointments initialAgendamentos={agendamentosFormatados} />
          </section>

          {/* 3. CTA Rápido */}
          <section className="bg-zinc-900 border border-white/10 p-6 rounded-3xl text-white space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Vire Premium</h3>
              <p className="text-gray-400 text-xs">
                Cortes ilimitados e prioridade na agenda.
              </p>
            </div>
            <a
              href="/assinatura"
              className="block w-full bg-white text-black text-center py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
            >
              Ver Planos
            </a>
          </section>
        </>
      )}

      {/* Espaçador para o menu flutuante */}
      <div className="h-4" />
    </div>
  );
}
