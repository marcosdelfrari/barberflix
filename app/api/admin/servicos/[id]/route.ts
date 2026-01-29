import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/servicos/[id] - Busca serviço por ID
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

    const servico = await prisma.servico.findUnique({
      where: { id },
      include: {
        estabelecimento: true,
        profissionais: {
          include: {
            profissional: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (!servico) {
      return NextResponse.json(
        { error: "Serviço não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...servico,
      preco: Number(servico.preco),
      profissionais: servico.profissionais.map((p) => p.profissional),
    });
  } catch (error) {
    console.error("Erro ao buscar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviço" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/servicos/[id] - Atualiza serviço
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
    const { nome, descricao, duracao, preco, precoAPartir, ativo } = body;

    const servico = await prisma.servico.update({
      where: { id },
      data: {
        nome,
        descricao,
        duracao: duracao ? parseInt(duracao) : undefined,
        preco: preco ? parseFloat(preco) : undefined,
        precoAPartir,
        ativo,
      },
      include: {
        estabelecimento: { select: { nome: true } },
      },
    });

    return NextResponse.json({ ...servico, preco: Number(servico.preco) });
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar serviço" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/servicos/[id] - Desativa serviço
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

    await prisma.servico.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: "Serviço desativado" });
  } catch (error) {
    console.error("Erro ao desativar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao desativar serviço" },
      { status: 500 },
    );
  }
}
