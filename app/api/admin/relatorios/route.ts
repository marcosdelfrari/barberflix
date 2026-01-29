import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/relatorios - Retorna dados para relatórios
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tipo = searchParams.get("tipo") || "geral";
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const profissionalId = searchParams.get("profissionalId");

    // Datas padrão: último mês
    const fim = dataFim ? new Date(`${dataFim}T23:59:59`) : new Date();
    const inicio = dataInicio
      ? new Date(dataInicio)
      : new Date(fim.getFullYear(), fim.getMonth() - 1, fim.getDate());

    if (tipo === "faturamento") {
      return await getRelatorioFaturamento(inicio, fim, profissionalId);
    }

    if (tipo === "performance") {
      return await getRelatorioPerformance(inicio, fim, profissionalId);
    }

    if (tipo === "frequencia") {
      return await getRelatorioFrequencia(inicio, fim, profissionalId);
    }

    // Relatório geral
    return await getRelatorioGeral(inicio, fim, profissionalId);
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return NextResponse.json(
      { error: "Erro ao gerar relatório" },
      { status: 500 },
    );
  }
}

async function getRelatorioGeral(
  inicio: Date,
  fim: Date,
  profissionalId: string | null,
) {
  const whereFilter: any = {
    dataHora: { gte: inicio, lte: fim },
  };

  if (profissionalId) {
    whereFilter.profissionalId = profissionalId;
  }

  // Faturamento do período
  const faturamento = await prisma.agendamento.aggregate({
    where: {
      status: "CONCLUIDO",
      ...whereFilter,
    },
    _sum: { valorTotal: true },
    _count: true,
  });

  // Total de agendamentos por status
  const agendamentosPorStatus = await prisma.agendamento.groupBy({
    by: ["status"],
    where: whereFilter,
    _count: true,
  });

  // Total de clientes ativos (com agendamentos no período)
  const clientesAtivos = await prisma.usuario.count({
    where: {
      role: "USER",
      agendamentos: {
        some: whereFilter,
      },
    },
  });

  // Assinaturas ativas e receita (Global, pois não é vinculado a profissional)
  // Se houver filtro de profissional, podemos optar por não mostrar ou mostrar o global
  // Neste caso, manteremos o global mas talvez o frontend queira tratar diferente
  const assinaturasAtivas = await prisma.assinatura.count({
    where: { status: "ACTIVE" },
  });

  // Receita de assinaturas
  const receitaAssinaturas = await prisma.assinatura.findMany({
    where: { status: "ACTIVE" },
    include: { plano: { select: { preco: true } } },
  });

  const totalReceitaAssinaturas = receitaAssinaturas.reduce(
    (acc, a) => acc + Number(a.plano.preco),
    0,
  );

  return NextResponse.json({
    periodo: { inicio, fim },
    faturamentoServicos: Number(faturamento._sum.valorTotal || 0),
    totalAgendamentos: faturamento._count,
    agendamentosPorStatus,
    clientesAtivos,
    assinaturasAtivas: profissionalId ? 0 : assinaturasAtivas, // Zera se filtrar por profissional
    receitaMensalAssinaturas: profissionalId ? 0 : totalReceitaAssinaturas, // Zera se filtrar por profissional
  });
}

async function getRelatorioFaturamento(
  inicio: Date,
  fim: Date,
  profissionalId: string | null,
) {
  const whereFilter: any = {
    status: "CONCLUIDO",
    dataHora: { gte: inicio, lte: fim },
  };

  if (profissionalId) {
    whereFilter.profissionalId = profissionalId;
  }

  // Faturamento por profissional
  const faturamentoPorProfissional = await prisma.agendamento.groupBy({
    by: ["profissionalId"],
    where: whereFilter,
    _sum: { valorTotal: true },
    _count: true,
  });

  // Buscar nomes dos profissionais
  const profissionais = await prisma.profissional.findMany({
    where: {
      id: { in: faturamentoPorProfissional.map((f) => f.profissionalId) },
    },
    select: { id: true, nome: true },
  });

  const profissionaisMap = new Map(profissionais.map((p) => [p.id, p.nome]));

  // Faturamento por serviço
  const faturamentoPorServico = await prisma.agendamento.groupBy({
    by: ["servicoId"],
    where: whereFilter,
    _sum: { valorTotal: true },
    _count: true,
  });

  const servicos = await prisma.servico.findMany({
    where: {
      id: { in: faturamentoPorServico.map((f) => f.servicoId) },
    },
    select: { id: true, nome: true },
  });

  const servicosMap = new Map(servicos.map((s) => [s.id, s.nome]));

  // Faturamento por dia (últimos 30 dias)
  const agendamentos = await prisma.agendamento.findMany({
    where: whereFilter,
    select: { dataHora: true, valorTotal: true },
  });

  const faturamentoPorDia: Record<string, number> = {};
  agendamentos.forEach((ag) => {
    const data = ag.dataHora.toISOString().split("T")[0];
    faturamentoPorDia[data] =
      (faturamentoPorDia[data] || 0) + Number(ag.valorTotal);
  });

  return NextResponse.json({
    periodo: { inicio, fim },
    porProfissional: faturamentoPorProfissional.map((f) => ({
      profissionalId: f.profissionalId,
      nome: profissionaisMap.get(f.profissionalId) || "Desconhecido",
      total: Number(f._sum.valorTotal || 0),
      quantidade: f._count,
    })),
    porServico: faturamentoPorServico.map((f) => ({
      servicoId: f.servicoId,
      nome: servicosMap.get(f.servicoId) || "Desconhecido",
      total: Number(f._sum.valorTotal || 0),
      quantidade: f._count,
    })),
    porDia: Object.entries(faturamentoPorDia)
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data)),
  });
}

async function getRelatorioPerformance(
  inicio: Date,
  fim: Date,
  profissionalId: string | null,
) {
  // Performance por profissional
  const whereProf = profissionalId ? { id: profissionalId } : { ativo: true };
  const profissionais = await prisma.profissional.findMany({
    where: whereProf,
    select: { id: true, nome: true },
  });

  const performance = await Promise.all(
    profissionais.map(async (prof) => {
      const stats = await prisma.agendamento.groupBy({
        by: ["status"],
        where: {
          profissionalId: prof.id,
          dataHora: { gte: inicio, lte: fim },
        },
        _count: true,
      });

      const total = stats.reduce((acc, s) => acc + s._count, 0);
      const concluidos =
        stats.find((s) => s.status === "CONCLUIDO")?._count || 0;
      const cancelados =
        stats.find((s) => s.status === "CANCELADO")?._count || 0;
      const naoCompareceu =
        stats.find((s) => s.status === "NAO_COMPARECEU")?._count || 0;

      return {
        profissionalId: prof.id,
        nome: prof.nome,
        total,
        concluidos,
        cancelados,
        naoCompareceu,
        taxaConclusao: total > 0 ? Math.round((concluidos / total) * 100) : 0,
        taxaCancelamento:
          total > 0 ? Math.round((cancelados / total) * 100) : 0,
      };
    }),
  );

  return NextResponse.json({
    periodo: { inicio, fim },
    performance: performance.sort((a, b) => b.concluidos - a.concluidos),
  });
}

async function getRelatorioFrequencia(
  inicio: Date,
  fim: Date,
  profissionalId: string | null,
) {
  const whereFilter: any = {
    dataHora: { gte: inicio, lte: fim },
  };

  if (profissionalId) {
    whereFilter.profissionalId = profissionalId;
  }

  // Frequência de clientes
  const agendamentos = await prisma.agendamento.groupBy({
    by: ["usuarioId"],
    where: whereFilter,
    _count: true,
  });

  const usuarios = await prisma.usuario.findMany({
    where: {
      id: { in: agendamentos.map((a) => a.usuarioId) },
    },
    select: { id: true, nome: true, email: true },
  });

  const usuariosMap = new Map(usuarios.map((u) => [u.id, u]));

  // Horários mais procurados
  const todosAgendamentos = await prisma.agendamento.findMany({
    where: {
      ...whereFilter,
      status: { in: ["CONFIRMADO", "CONCLUIDO"] },
    },
    select: { dataHora: true },
  });

  const horariosPorHora: Record<number, number> = {};
  const horariosPorDiaSemana: Record<number, number> = {};

  todosAgendamentos.forEach((ag) => {
    const hora = ag.dataHora.getHours();
    const diaSemana = ag.dataHora.getDay();

    horariosPorHora[hora] = (horariosPorHora[hora] || 0) + 1;
    horariosPorDiaSemana[diaSemana] =
      (horariosPorDiaSemana[diaSemana] || 0) + 1;
  });

  const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return NextResponse.json({
    periodo: { inicio, fim },
    clientesMaisFrequentes: agendamentos
      .map((a) => ({
        usuarioId: a.usuarioId,
        ...usuariosMap.get(a.usuarioId),
        totalAgendamentos: a._count,
      }))
      .sort((a, b) => b.totalAgendamentos - a.totalAgendamentos)
      .slice(0, 20),
    horariosMaisPopulares: Object.entries(horariosPorHora)
      .map(([hora, count]) => ({ hora: `${hora}:00`, count }))
      .sort((a, b) => b.count - a.count),
    diasMaisPopulares: Object.entries(horariosPorDiaSemana)
      .map(([dia, count]) => ({ dia: diasSemana[parseInt(dia)], count }))
      .sort((a, b) => b.count - a.count),
  });
}
