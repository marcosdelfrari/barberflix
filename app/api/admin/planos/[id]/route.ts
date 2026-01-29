import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// PUT /api/admin/planos/[id] - Atualiza plano
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
      descricao,
      preco,
      vigencia,
      features,
      destaque,
      ordem,
      ativo,
    } = body;

    const plano = await prisma.plano.update({
      where: { id },
      data: {
        nome,
        descricao,
        preco: preco !== undefined ? parseFloat(preco) : undefined,
        vigencia,
        features,
        destaque,
        ordem,
        ativo,
      },
    });

    return NextResponse.json({ ...plano, preco: Number(plano.preco) });
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar plano" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/planos/[id] - Desativa plano
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

    // Verificar se há assinaturas ativas
    const assinaturasAtivas = await prisma.assinatura.count({
      where: {
        planoId: id,
        status: "ACTIVE",
      },
    });

    if (assinaturasAtivas > 0) {
      return NextResponse.json(
        {
          error: `Não é possível desativar. Existem ${assinaturasAtivas} assinaturas ativas.`,
        },
        { status: 400 },
      );
    }

    await prisma.plano.update({
      where: { id },
      data: { ativo: false },
    });

    return NextResponse.json({ message: "Plano desativado" });
  } catch (error) {
    console.error("Erro ao desativar plano:", error);
    return NextResponse.json(
      { error: "Erro ao desativar plano" },
      { status: 500 },
    );
  }
}
