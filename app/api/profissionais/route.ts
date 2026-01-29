import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/profissionais?estabelecimentoId=xxx - Lista profissionais de um estabelecimento
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const estabelecimentoId = searchParams.get("estabelecimentoId");

    if (!estabelecimentoId) {
      return NextResponse.json(
        { error: "estabelecimentoId é obrigatório" },
        { status: 400 },
      );
    }

    const profissionais = await prisma.profissional.findMany({
      where: {
        estabelecimentoId,
        ativo: true,
      },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        foto: true,
        especialidade: true,
        bio: true,
      },
    });

    return NextResponse.json(profissionais);
  } catch (error) {
    console.error("Erro ao buscar profissionais:", error);
    return NextResponse.json(
      { error: "Erro ao buscar profissionais" },
      { status: 500 },
    );
  }
}
