import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Função auxiliar para obter usuário autenticado via NextAuth (Google)
async function getAuthenticatedUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id };
}

// PATCH /api/agendamentos/[id] - Atualizar status do agendamento
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status é obrigatório" },
        { status: 400 },
      );
    }

    // Verificar se o agendamento pertence ao usuário
    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        usuarioId: user.userId,
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    // Atualizar o status
    const updated = await prisma.agendamento.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 },
    );
  }
}

// GET /api/agendamentos/[id] - Buscar agendamento específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const agendamento = await prisma.agendamento.findFirst({
      where: {
        id,
        usuarioId: user.userId,
      },
      include: {
        estabelecimento: true,
        profissional: true,
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

    if (!agendamento) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    type ServicoAgendamento = (typeof agendamento.servicos)[number];
    const duracaoTotal = agendamento.servicos.reduce(
      (acc: number, s: ServicoAgendamento) => acc + s.duracao,
      0,
    );

    return NextResponse.json({
      ...agendamento,
      valorTotal: Number(agendamento.valorTotal),
      duracaoTotal,
      servicos: agendamento.servicos.map((s: ServicoAgendamento) => ({
        id: s.servico.id,
        nome: s.servico.nome,
        preco: Number(s.preco),
        duracao: s.duracao,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamento" },
      { status: 500 },
    );
  }
}
