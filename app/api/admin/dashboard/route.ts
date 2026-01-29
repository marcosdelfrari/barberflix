import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Verifica se é admin via sessão NextAuth
async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/dashboard - Retorna KPIs do dashboard
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    // Primeiro dia do mês atual
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    // Primeiro dia do mês anterior
    const inicioMesAnterior = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 1,
      1,
    );
    const fimMesAnterior = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      0,
      23,
      59,
      59,
    );

    // Agendamentos de hoje
    const agendamentosHoje = await prisma.agendamento.count({
      where: {
        dataHora: { gte: hoje, lt: amanha },
        status: { in: ["PENDENTE", "CONFIRMADO", "CONCLUIDO"] },
      },
    });

    // Agendamentos de ontem para comparação
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const agendamentosOntem = await prisma.agendamento.count({
      where: {
        dataHora: { gte: ontem, lt: hoje },
        status: { in: ["PENDENTE", "CONFIRMADO", "CONCLUIDO"] },
      },
    });

    // Receita do mês atual
    const receitaMes = await prisma.agendamento.aggregate({
      where: {
        status: "CONCLUIDO",
        dataHora: { gte: inicioMes },
      },
      _sum: { valorTotal: true },
    });

    // Receita do mês anterior
    const receitaMesAnterior = await prisma.agendamento.aggregate({
      where: {
        status: "CONCLUIDO",
        dataHora: { gte: inicioMesAnterior, lte: fimMesAnterior },
      },
      _sum: { valorTotal: true },
    });

    // Clientes ativos (com assinatura ativa)
    const clientesAtivos = await prisma.assinatura.count({
      where: { status: "ACTIVE" },
    });

    // Clientes do mês anterior
    const clientesMesAnterior = await prisma.assinatura.count({
      where: {
        status: "ACTIVE",
        createdAt: { lt: inicioMes },
      },
    });

    // Funcionários ativos
    const funcionariosAtivos = await prisma.profissional.count({
      where: { ativo: true },
    });

    // Próximos agendamentos do dia
    const proximosAgendamentos = await prisma.agendamento.findMany({
      where: {
        dataHora: { gte: new Date(), lt: amanha },
        status: { in: ["PENDENTE", "CONFIRMADO"] },
      },
      orderBy: { dataHora: "asc" },
      take: 5,
      include: {
        usuario: { select: { nome: true } },
        profissional: { select: { nome: true } },
        servicos: { include: { servico: { select: { nome: true } } } },
      },
    });

    // Calcular variações
    const variacaoAgendamentos = agendamentosHoje - agendamentosOntem;
    const receitaAtual = Number(receitaMes._sum.valorTotal || 0);
    const receitaAnterior = Number(receitaMesAnterior._sum.valorTotal || 0);
    const variacaoReceita =
      receitaAnterior > 0
        ? Math.round(((receitaAtual - receitaAnterior) / receitaAnterior) * 100)
        : 0;
    const variacaoClientes = clientesAtivos - clientesMesAnterior;

    return NextResponse.json({
      kpis: {
        agendamentosHoje: {
          valor: agendamentosHoje,
          variacao:
            variacaoAgendamentos >= 0
              ? `+${variacaoAgendamentos}`
              : `${variacaoAgendamentos}`,
        },
        receitaMes: {
          valor: receitaAtual,
          variacao:
            variacaoReceita >= 0
              ? `+${variacaoReceita}%`
              : `${variacaoReceita}%`,
        },
        clientesAtivos: {
          valor: clientesAtivos,
          variacao:
            variacaoClientes >= 0
              ? `+${variacaoClientes}`
              : `${variacaoClientes}`,
        },
        funcionariosAtivos: {
          valor: funcionariosAtivos,
          variacao: "Total",
        },
      },
      proximosAgendamentos: proximosAgendamentos.map((ag) => ({
        id: ag.id,
        cliente: ag.usuario.nome,
        profissional: ag.profissional.nome,
        servico: ag.servicos.map((as) => as.servico.nome).join(", ") || "—",
        horario: ag.dataHora.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: ag.status,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar KPIs:", error);
    return NextResponse.json({ error: "Erro ao buscar KPIs" }, { status: 500 });
  }
}
