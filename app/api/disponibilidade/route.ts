import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/disponibilidade?profissionalId=xxx - Lista disponibilidades de um profissional
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const profissionalId = searchParams.get("profissionalId");

    if (!profissionalId) {
      return NextResponse.json(
        { error: "profissionalId é obrigatório" },
        { status: 400 },
      );
    }

    const disponibilidades = await prisma.disponibilidade.findMany({
      where: {
        profissionalId,
        ativo: true,
      },
      orderBy: { diaSemana: "asc" },
      select: {
        id: true,
        diaSemana: true,
        horaInicio: true,
        horaFim: true,
      },
    });

    return NextResponse.json(disponibilidades);
  } catch (error) {
    console.error("Erro ao buscar disponibilidades:", error);
    return NextResponse.json(
      { error: "Erro ao buscar disponibilidades" },
      { status: 500 },
    );
  }
}
