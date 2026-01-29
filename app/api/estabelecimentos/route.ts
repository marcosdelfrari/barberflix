import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/estabelecimentos - Lista todos os estabelecimentos ativos
export async function GET() {
  try {
    const estabelecimentos = await prisma.estabelecimento.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: {
        id: true,
        nome: true,
        endereco: true,
        telefone: true,
        foto: true,
        descricao: true,
        horarioAbre: true,
        horarioFecha: true,
        diasFuncionamento: true,
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
