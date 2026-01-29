import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/planos - Lista todos os planos ativos
export async function GET() {
  try {
    const planos = await prisma.plano.findMany({
      where: { ativo: true },
      orderBy: [{ destaque: "desc" }, { ordem: "asc" }],
      select: {
        id: true,
        nome: true,
        descricao: true,
        preco: true,
        vigencia: true,
        features: true,
        destaque: true,
      },
    });

    // Converter Decimal para number
    const planosFormatados = planos.map((plano: (typeof planos)[number]) => ({
      ...plano,
      preco: Number(plano.preco),
    }));

    return NextResponse.json(planosFormatados);
  } catch (error) {
    console.error("Erro ao buscar planos:", error);
    return NextResponse.json(
      { error: "Erro ao buscar planos" },
      { status: 500 },
    );
  }
}
