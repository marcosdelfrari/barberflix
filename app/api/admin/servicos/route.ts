import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/servicos - Lista todos os serviços do catálogo
export async function GET(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const estabelecimentoId = searchParams.get("estabelecimentoId");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (estabelecimentoId) {
      where.estabelecimentoId = estabelecimentoId;
    }

    const servicos = await prisma.servico.findMany({
      where,
      orderBy: [{ nome: "asc" }],
      include: {
        estabelecimento: {
          select: {
            id: true,
            nome: true,
          },
        },
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
        _count: {
          select: {
            agendamentoServicos: true,
          },
        },
      },
    });

    const servicosFormatados = servicos.map((s) => ({
      ...s,
      preco: Number(s.preco),
      profissionais: s.profissionais.map((p) => p.profissional),
    }));

    return NextResponse.json(servicosFormatados);
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    return NextResponse.json(
      { error: "Erro ao buscar serviços" },
      { status: 500 },
    );
  }
}

// POST /api/admin/servicos - Cria novo serviço no catálogo
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, descricao, duracao, preco, precoAPartir, estabelecimentoId } =
      body;

    if (!nome || !duracao || !preco || !estabelecimentoId) {
      return NextResponse.json(
        { error: "Nome, duração, preço e estabelecimento são obrigatórios" },
        { status: 400 },
      );
    }

    const servico = await prisma.servico.create({
      data: {
        nome,
        descricao,
        duracao: parseInt(duracao),
        preco: parseFloat(preco),
        precoAPartir: precoAPartir || false,
        estabelecimentoId,
      },
      include: {
        estabelecimento: { select: { nome: true } },
      },
    });

    return NextResponse.json(
      { ...servico, preco: Number(servico.preco) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    return NextResponse.json(
      { error: "Erro ao criar serviço" },
      { status: 500 },
    );
  }
}
