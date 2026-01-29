import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// PATCH /api/admin/assinaturas/[id] - Atualiza status da assinatura
export async function PATCH(
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
    const { status, planoId, dataFim, proximaCobranca } = body;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (planoId) {
      updateData.planoId = planoId;
    }

    if (dataFim) {
      updateData.dataFim = new Date(dataFim);
    }

    if (proximaCobranca) {
      updateData.proximaCobranca = new Date(proximaCobranca);
    }

    const assinatura = await prisma.assinatura.update({
      where: { id },
      data: updateData,
      include: {
        usuario: { select: { nome: true, email: true } },
        plano: { select: { nome: true, preco: true } },
      },
    });

    return NextResponse.json({
      ...assinatura,
      plano: {
        ...assinatura.plano,
        preco: Number(assinatura.plano.preco),
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar assinatura" },
      { status: 500 },
    );
  }
}
