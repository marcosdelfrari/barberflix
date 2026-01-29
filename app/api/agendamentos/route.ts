import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Função auxiliar para obter usuário autenticado via NextAuth (Google)
async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, role: session.user.role };
}

// GET /api/agendamentos - Lista agendamentos ou verifica horários ocupados
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const profissionalId = searchParams.get("profissionalId");
    const data = searchParams.get("data"); // formato: YYYY-MM-DD

    // Se profissionalId e data forem passados, busca horários ocupados (PÚBLICO)
    if (profissionalId && data) {
      const dataInicio = new Date(`${data}T00:00:00`);
      const dataFim = new Date(`${data}T23:59:59`);

      const agendamentos = await prisma.agendamento.findMany({
        where: {
          profissionalId,
          dataHora: {
            gte: dataInicio,
            lte: dataFim,
          },
          status: {
            in: ["PENDENTE", "CONFIRMADO"],
          },
        },
        select: {
          id: true,
          dataHora: true,
          dataFim: true,
        },
      });

      return NextResponse.json(agendamentos);
    }

    // Para listar agendamentos do usuário, precisa estar autenticado
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Retorna agendamentos do usuário
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        usuarioId: user.userId,
      },
      orderBy: { dataHora: "desc" },
      include: {
        estabelecimento: {
          select: {
            nome: true,
            endereco: true,
          },
        },
        profissional: {
          select: {
            nome: true,
            foto: true,
          },
        },
        servicos: {
          include: {
            servico: {
              select: {
                id: true,
                nome: true,
                duracao: true,
                preco: true,
              },
            },
          },
        },
      },
    });

    // Converter Decimal para number e formatar serviços
    type AgendamentoComServicos = (typeof agendamentos)[number];
    type ServicoAgendamento = AgendamentoComServicos["servicos"][number];
    const agendamentosFormatados = agendamentos.map(
      (ag: AgendamentoComServicos) => {
        const duracaoTotal = ag.servicos.reduce(
          (acc: number, s: ServicoAgendamento) => acc + s.duracao,
          0,
        );
        return {
          ...ag,
          valorTotal: Number(ag.valorTotal),
          duracaoTotal,
          servicos: ag.servicos.map((s: ServicoAgendamento) => ({
            id: s.servico.id,
            nome: s.servico.nome,
            preco: Number(s.preco),
            duracao: s.duracao,
          })),
        };
      },
    );

    return NextResponse.json(agendamentosFormatados);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 },
    );
  }
}

// POST /api/agendamentos - Cria novo agendamento com múltiplos serviços
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { estabelecimentoId, profissionalId, servicosIds, dataHora } = body;

    // Validações
    if (!estabelecimentoId || !profissionalId || !servicosIds || !dataHora) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 },
      );
    }

    // Garantir que servicosIds é um array
    const servicosArray = Array.isArray(servicosIds)
      ? servicosIds
      : [servicosIds];

    if (servicosArray.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um serviço" },
        { status: 400 },
      );
    }

    // Buscar serviços que o profissional oferece
    const servicos = await prisma.servico.findMany({
      where: {
        id: { in: servicosArray },
        ativo: true,
        profissionais: {
          some: {
            profissionalId,
          },
        },
      },
    });

    if (servicos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum serviço válido encontrado para este profissional" },
        { status: 404 },
      );
    }

    // Verificar se todos os serviços solicitados foram encontrados
    if (servicos.length !== servicosArray.length) {
      return NextResponse.json(
        {
          error: "Alguns serviços não estão disponíveis para este profissional",
        },
        { status: 400 },
      );
    }

    // Calcular duração total e valor total
    type ServicoItem = (typeof servicos)[number];
    const duracaoTotal = servicos.reduce(
      (acc: number, s: ServicoItem) => acc + s.duracao,
      0,
    );
    const valorTotal = servicos.reduce(
      (acc: number, s: ServicoItem) => acc + Number(s.preco),
      0,
    );

    // Calcular data fim baseado na duração total dos serviços
    const dataHoraInicio = new Date(dataHora);
    const dataHoraFim = new Date(
      dataHoraInicio.getTime() + duracaoTotal * 60000,
    );

    // Verificar se o horário está disponível
    const conflito = await prisma.agendamento.findFirst({
      where: {
        profissionalId,
        status: {
          in: ["PENDENTE", "CONFIRMADO"],
        },
        OR: [
          {
            AND: [
              { dataHora: { lte: dataHoraInicio } },
              { dataFim: { gt: dataHoraInicio } },
            ],
          },
          {
            AND: [
              { dataHora: { lt: dataHoraFim } },
              { dataFim: { gte: dataHoraFim } },
            ],
          },
          {
            AND: [
              { dataHora: { gte: dataHoraInicio } },
              { dataFim: { lte: dataHoraFim } },
            ],
          },
        ],
      },
    });

    if (conflito) {
      return NextResponse.json(
        { error: "Horário não disponível para a duração total dos serviços" },
        { status: 409 },
      );
    }

    // Criar agendamento com serviços
    const agendamento = await prisma.agendamento.create({
      data: {
        usuarioId: user.userId,
        estabelecimentoId,
        profissionalId,
        dataHora: dataHoraInicio,
        dataFim: dataHoraFim,
        valorTotal,
        status: "PENDENTE",
        servicos: {
          create: servicos.map((s: ServicoItem) => ({
            servicoId: s.id,
            preco: s.preco,
            duracao: s.duracao,
          })),
        },
      },
      include: {
        estabelecimento: {
          select: { nome: true },
        },
        profissional: {
          select: { nome: true },
        },
        servicos: {
          include: {
            servico: {
              select: { id: true, nome: true },
            },
          },
        },
      },
    });

    type AgendamentoServicoItem = (typeof agendamento.servicos)[number];
    return NextResponse.json(
      {
        ...agendamento,
        valorTotal: Number(agendamento.valorTotal),
        servicos: agendamento.servicos.map((s: AgendamentoServicoItem) => ({
          id: s.servico.id,
          nome: s.servico.nome,
          preco: Number(s.preco),
          duracao: s.duracao,
        })),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar agendamento" },
      { status: 500 },
    );
  }
}
