import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/profissionais/[id] - Busca profissional por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const profissional = await prisma.profissional.findUnique({
      where: { id },
      include: {
        estabelecimento: true,
        disponibilidade: { orderBy: { diaSemana: "asc" } },
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
      },
    });

    if (!profissional) {
      return NextResponse.json(
        { error: "Profissional não encontrado" },
        { status: 404 },
      );
    }

    type ServicoPrestadoItem = (typeof profissional.servicosPrestados)[number];
    return NextResponse.json({
      ...profissional,
      servicos: profissional.servicosPrestados.map(
        (sp: ServicoPrestadoItem) => ({
          id: sp.servico.id,
          nome: sp.servico.nome,
          preco: Number(sp.servico.preco),
        }),
      ),
    });
  } catch (error) {
    console.error("Erro ao buscar profissional:", error);
    return NextResponse.json(
      { error: "Erro ao buscar profissional" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/profissionais/[id] - Atualiza profissional
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      nome,
      email,
      telefone,
      foto,
      especialidade,
      bio,
      ativo,
      servicosIds,
      disponibilidades,
    } = body;

    // Atualizar profissional
    const profissional = await prisma.profissional.update({
      where: { id },
      data: {
        nome,
        email,
        telefone,
        foto,
        especialidade,
        bio,
        ativo,
      },
    });

    // Se servicosIds foram enviados, atualizar os serviços prestados
    if (servicosIds !== undefined) {
      // Remover vínculos antigos
      await prisma.profissionalServico.deleteMany({
        where: { profissionalId: id },
      });

      // Criar novos vínculos
      if (servicosIds.length > 0) {
        await prisma.profissionalServico.createMany({
          data: servicosIds.map((servicoId: string) => ({
            profissionalId: id,
            servicoId,
          })),
        });
      }
    }

    // Se disponibilidades foram enviadas, atualizar
    if (disponibilidades) {
      // Desativar disponibilidades anteriores
      await prisma.disponibilidade.updateMany({
        where: { profissionalId: id },
        data: { ativo: false },
      });

      // Criar novas disponibilidades
      for (const d of disponibilidades) {
        await prisma.disponibilidade.create({
          data: {
            profissionalId: id,
            diaSemana: d.diaSemana,
            horaInicio: d.horaInicio,
            horaFim: d.horaFim,
            ativo: true,
          },
        });
      }
    }

    return NextResponse.json(profissional);
  } catch (error) {
    console.error("Erro ao atualizar profissional:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar profissional" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/profissionais/[id] - Desativa profissional
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    // Verificar se há agendamentos pendentes
    const agendamentosPendentes = await prisma.agendamento.count({
      where: {
        profissionalId: id,
        status: { in: ["PENDENTE", "CONFIRMADO"] },
        dataHora: { gte: new Date() },
      },
    });

    if (agendamentosPendentes > 0) {
      return NextResponse.json(
        {
          error: `Não é possível desativar. Existem ${agendamentosPendentes} agendamentos pendentes.`,
        },
        { status: 400 },
      );
    }

    await prisma.profissional.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: "Profissional desativado" });
  } catch (error) {
    console.error("Erro ao desativar profissional:", error);
    return NextResponse.json(
      { error: "Erro ao desativar profissional" },
      { status: 500 },
    );
  }
}
