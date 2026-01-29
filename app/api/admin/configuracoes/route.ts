import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/configuracoes - Busca dados do estabelecimento
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Buscar primeiro estabelecimento (pode ser adaptado para multi-tenant)
    const estabelecimento = await prisma.estabelecimento.findFirst({
      where: { ativo: true },
    });

    if (!estabelecimento) {
      return NextResponse.json(
        { error: "Estabelecimento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(estabelecimento);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao buscar configurações" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/configuracoes - Atualiza dados do estabelecimento
export async function PUT(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      nome,
      endereco,
      telefone,
      email,
      foto,
      logo,
      descricao,
      horarioAbre,
      horarioFecha,
      diasFuncionamento,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID do estabelecimento é obrigatório" },
        { status: 400 },
      );
    }

    const estabelecimento = await prisma.estabelecimento.update({
      where: { id },
      data: {
        nome,
        endereco,
        telefone,
        email,
        foto,
        logo,
        descricao,
        horarioAbre,
        horarioFecha,
        diasFuncionamento,
      },
    });

    return NextResponse.json(estabelecimento);
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar configurações" },
      { status: 500 },
    );
  }
}
