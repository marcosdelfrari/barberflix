import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Função auxiliar para obter userId via NextAuth
async function getAuthenticatedUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

// GET /api/assinatura - Buscar assinatura do usuário logado
export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        assinatura: {
          include: {
            plano: {
              select: {
                id: true,
                nome: true,
                preco: true,
                vigencia: true,
                features: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    if (!usuario.assinatura || usuario.assinatura.status !== "ACTIVE") {
      return NextResponse.json({ assinatura: null });
    }

    return NextResponse.json({
      assinatura: {
        id: usuario.assinatura.id,
        status: usuario.assinatura.status,
        dataInicio: usuario.assinatura.dataInicio,
        proximaCobranca: usuario.assinatura.proximaCobranca,
        plano: {
          ...usuario.assinatura.plano,
          preco: Number(usuario.assinatura.plano.preco),
        },
      },
    });
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Pegar dados do body
    const body = await request.json();
    const { planoId, planoNome, planoPreco } = body;

    if (!planoId || !planoNome || planoPreco === undefined) {
      return NextResponse.json(
        { error: "Dados do plano são obrigatórios" },
        { status: 400 },
      );
    }

    // Verificar se o usuário existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { assinatura: true },
    });

    if (!usuario) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 },
      );
    }

    // Verificar se já tem assinatura ativa
    if (usuario.assinatura && usuario.assinatura.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Você já possui uma assinatura ativa" },
        { status: 400 },
      );
    }

    // Buscar ou criar o plano no banco
    let plano = await prisma.plano.findFirst({
      where: { nome: planoNome },
    });

    if (!plano) {
      // Criar o plano se não existir
      plano = await prisma.plano.create({
        data: {
          nome: planoNome,
          preco: planoPreco,
          vigencia: "Indeterminado",
          features: [],
          ativo: true,
        },
      });
    }

    // Calcular próxima cobrança (30 dias)
    const proximaCobranca = new Date();
    proximaCobranca.setDate(proximaCobranca.getDate() + 30);

    // Criar ou atualizar assinatura
    let assinatura;
    if (usuario.assinatura) {
      // Atualizar assinatura existente
      assinatura = await prisma.assinatura.update({
        where: { id: usuario.assinatura.id },
        data: {
          planoId: plano.id,
          status: "ACTIVE",
          dataInicio: new Date(),
          proximaCobranca,
        },
        include: { plano: true },
      });
    } else {
      // Criar nova assinatura
      assinatura = await prisma.assinatura.create({
        data: {
          usuarioId: userId,
          planoId: plano.id,
          status: "ACTIVE",
          dataInicio: new Date(),
          proximaCobranca,
        },
        include: { plano: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Assinatura realizada com sucesso!",
      assinatura: {
        id: assinatura.id,
        plano: assinatura.plano.nome,
        status: assinatura.status,
        dataInicio: assinatura.dataInicio,
        proximaCobranca: assinatura.proximaCobranca,
      },
    });
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
