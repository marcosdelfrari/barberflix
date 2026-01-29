import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

// Função auxiliar para obter userId via NextAuth
async function getAuthenticatedUserId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Buscar dados do usuário
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        telefone: true,
        endereco: true,
        role: true,
        createdAt: true,
        assinatura: {
          select: {
            status: true,
            plano: {
              select: {
                nome: true,
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

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { nome, telefone, endereco, email } = body;

    const usuario = await prisma.usuario.update({
      where: { id: userId },
      data: {
        nome,
        telefone,
        endereco,
        email,
      },
    });

    return NextResponse.json({ usuario });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 },
    );
  }
}
