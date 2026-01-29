import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/servicos?profissionalId=xxx - Lista serviços que um profissional presta
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

    // Buscar serviços através da tabela intermediária ProfissionalServico
    const profissionalServicos = await prisma.profissionalServico.findMany({
      where: {
        profissionalId,
        servico: {
          ativo: true,
        },
      },
      include: {
        servico: {
          select: {
            id: true,
            nome: true,
            descricao: true,
            duracao: true,
            preco: true,
            precoAPartir: true,
          },
        },
      },
      orderBy: {
        servico: {
          nome: "asc",
        },
      },
    });

    // Converter para o formato esperado
    type ProfissionalServicoItem = (typeof profissionalServicos)[number];
    const servicosFormatados = profissionalServicos.map(
      (ps: ProfissionalServicoItem) => ({
        id: ps.servico.id,
        nome: ps.servico.nome,
        descricao: ps.servico.descricao,
        duracao: ps.servico.duracao,
        preco: Number(ps.servico.preco),
        precoAPartir: ps.servico.precoAPartir,
      }),
    );

    return NextResponse.json(servicosFormatados);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 },
    );
  }
}
