import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/planos - Lista todos os planos
export async function GET() {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const planos = await prisma.plano.findMany({
      orderBy: { ordem: "asc" },
      include: {
        _count: {
          select: {
            assinaturas: true,
          },
        },
      },
    });

    // Contar assinaturas ativas por plano
    const planosComStats = await Promise.all(
      planos.map(async (plano) => {
        const assinaturasAtivas = await prisma.assinatura.count({
          where: {
            planoId: plano.id,
            status: "ACTIVE",
          },
        });

        return {
          ...plano,
          preco: Number(plano.preco),
          assinaturasAtivas,
        };
      }),
    );

    return NextResponse.json(planosComStats);
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos" },
      { status: 500 },
    );
  }
}

// POST /api/admin/planos - Cria novo plano
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, descricao, preco, vigencia, features, destaque, ordem } =
      body;

    if (!nome || preco === undefined) {
      return NextResponse.json(
        { error: "Nome e preço são obrigatórios" },
        { status: 400 },
      );
    }

    const plano = await prisma.plano.create({
      data: {
        nome,
        descricao,
        preco: parseFloat(preco),
        vigencia,
        features: features || [],
        destaque: destaque || false,
        ordem: ordem || 0,
      },
    });

    return NextResponse.json(
      { ...plano, preco: Number(plano.preco) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar plano:", error);
    return NextResponse.json({ error: "Erro ao criar plano" }, { status: 500 });
  }
}
