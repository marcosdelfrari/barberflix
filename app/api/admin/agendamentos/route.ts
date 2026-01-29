import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/agendamentos - Lista todos os agendamentos com filtros
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const profissionalId = searchParams.get("profissionalId");
    const dataInicio = searchParams.get("dataInicio");
    const dataFim = searchParams.get("dataFim");
    const busca = searchParams.get("busca");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== "todos") {
      where.status = status;
    }

    if (profissionalId) {
      where.profissionalId = profissionalId;
    }

    if (dataInicio || dataFim) {
      where.dataHora = {};
      if (dataInicio) {
        where.dataHora.gte = new Date(dataInicio);
      }
      if (dataFim) {
        where.dataHora.lte = new Date(`${dataFim}T23:59:59`);
      }
    }

    if (busca) {
      where.OR = [
        { usuario: { nome: { contains: busca, mode: "insensitive" } } },
        { usuario: { email: { contains: busca, mode: "insensitive" } } },
      ];
    }

    const agendamentos = await prisma.agendamento.findMany({
      where,
      orderBy: { dataHora: "desc" },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
        servicos: {
          include: {
            servico: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        estabelecimento: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const agendamentosFormatados = agendamentos.map((ag: any) => {
      const duracaoTotal = ag.servicos.reduce(
        (acc: number, s: { duracao: number }) => acc + s.duracao,
        0,
      );
      return {
        ...ag,
        valorTotal: Number(ag.valorTotal),
        duracaoTotal,
        servicos: ag.servicos.map(
          (s: {
            preco: number | { toString: () => string };
            duracao: number;
            servico: { id: string; nome: string };
          }) => ({
            id: s.servico.id,
            nome: s.servico.nome,
            preco: Number(s.preco),
            duracao: s.duracao,
          }),
        ),
      };
    });

    return NextResponse.json(agendamentosFormatados);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamentos" },
      { status: 500 },
    );
  }
}
