import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const estabelecimentos = await prisma.estabelecimento.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: {
            profissionais: true,
            agendamentos: true,
          },
        },
      },
    });

    return NextResponse.json(estabelecimentos);
  } catch (error) {
    console.error("Erro ao buscar estabelecimentos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estabelecimentos" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      nome,
      endereco,
      telefone,
      email,
      descricao,
      cnpj,
      responsavel,
      horarioAbre,
      horarioFecha,
      diasFuncionamento,
    } = body;

    if (!nome || !endereco) {
      return NextResponse.json(
        { error: "Nome e endereço são obrigatórios" },
        { status: 400 },
      );
    }

    const estabelecimento = await prisma.estabelecimento.create({
      data: {
        nome,
        endereco,
        telefone,
        email,
        descricao,
        cnpj,
        responsavel,
        horarioAbre,
        horarioFecha,
        diasFuncionamento: diasFuncionamento || [
          "seg",
          "ter",
          "qua",
          "qui",
          "sex",
          "sab",
        ],
        ativo: true,
      },
    });

    return NextResponse.json(estabelecimento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar estabelecimento:", error);
    return NextResponse.json(
      { error: "Erro ao criar estabelecimento" },
      { status: 500 },
    );
  }
}
