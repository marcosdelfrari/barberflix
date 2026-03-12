import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Não autenticado", session: null });
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, nome: true, role: true, ativo: true },
  });

  return NextResponse.json({
    sessionRole: session.user.role,
    dbRole: dbUser?.role,
    match: session.user.role === dbUser?.role,
    session: {
      id: session.user.id,
      email: session.user.email,
      nome: session.user.nome,
      role: session.user.role,
    },
    db: dbUser,
  });
}
