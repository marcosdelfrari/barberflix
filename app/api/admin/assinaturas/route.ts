import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/assinaturas - Lista todas as assinaturas
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const planoId = searchParams.get("planoId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (status && status !== "todos") {
      where.status = status;
    }

    if (planoId) {
      where.planoId = planoId;
    }

    const assinaturas = await prisma.assinatura.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        plano: {
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        },
      },
    });

    const assinaturasFormatadas = assinaturas.map(
      (a: {
        plano: { id: string; nome: string; preco: unknown };
        [key: string]: unknown;
      }) => ({
        ...a,
        plano: {
          ...a.plano,
          preco: Number(a.plano.preco),
        },
      }),
    );

    return NextResponse.json(assinaturasFormatadas);
  } catch (error) {
    console.error("Erro ao buscar assinaturas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar assinaturas" },
      { status: 500 },
    );
  }
}
