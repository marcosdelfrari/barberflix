import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/profissionais - Lista todos os profissionais
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const profissionais = await prisma.profissional.findMany({
      orderBy: { nome: "asc" },
      include: {
        estabelecimento: {
          select: {
            id: true,
            nome: true,
          },
        },
        disponibilidade: {
          where: { ativo: true },
          orderBy: { diaSemana: "asc" },
        },
        servicosPrestados: {
          include: {
            servico: {
              select: {
                id: true,
                nome: true,
                preco: true,
              },
            },
          },
        },
        _count: {
          select: {
            agendamentos: true,
          },
        },
      },
    });

    // Calcular estatísticas de cada profissional
    const profissionaisComStats = await Promise.all(
      profissionais.map(async (prof) => {
        // Contar agendamentos concluídos
        const agendamentosConcluidos = await prisma.agendamento.count({
          where: {
            profissionalId: prof.id,
            status: "CONCLUIDO",
          },
        });

        // Calcular faturamento total
        const faturamento = await prisma.agendamento.aggregate({
          where: {
            profissionalId: prof.id,
            status: "CONCLUIDO",
          },
          _sum: {
            valorTotal: true,
          },
        });

        return {
          ...prof,
          servicos: prof.servicosPrestados.map((sp) => ({
            id: sp.servico.id,
            nome: sp.servico.nome,
            preco: Number(sp.servico.preco),
          })),
          stats: {
            totalAgendamentos: prof._count.agendamentos,
            agendamentosConcluidos,
            faturamento: Number(faturamento._sum.valorTotal || 0),
          },
        };
      }),
    );

    return NextResponse.json(profissionaisComStats);
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar profissionais" },
      { status: 500 },
    );
  }
}

// POST /api/admin/profissionais - Cria novo profissional
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nome,
      email,
      telefone,
      foto,
      especialidade,
      bio,
      estabelecimentoId,
      servicosIds,
      disponibilidades,
    } = body;

    if (!nome || !estabelecimentoId) {
      return NextResponse.json(
        { error: "Nome e estabelecimento são obrigatórios" },
        { status: 400 },
      );
    }

    const profissional = await prisma.profissional.create({
      data: {
        nome,
        email,
        telefone,
        foto,
        especialidade,
        bio,
        estabelecimentoId,
        disponibilidade: disponibilidades
          ? {
              create: disponibilidades.map(
                (d: {
                  diaSemana: number;
                  horaInicio: string;
                  horaFim: string;
                }) => ({
                  diaSemana: d.diaSemana,
                  horaInicio: d.horaInicio,
                  horaFim: d.horaFim,
                }),
              ),
            }
          : undefined,
        servicosPrestados: servicosIds
          ? {
              create: servicosIds.map((servicoId: string) => ({
                servicoId,
              })),
            }
          : undefined,
      },
      include: {
        estabelecimento: { select: { nome: true } },
        disponibilidade: true,
        servicosPrestados: {
          include: {
            servico: {
              select: { id: true, nome: true },
            },
          },
        },
      },
    });

    return NextResponse.json(profissional, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar profissional:", error);
    return NextResponse.json(
      { error: "Erro ao criar profissional" },
      { status: 500 },
    );
  }
}
