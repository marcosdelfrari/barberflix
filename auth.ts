import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Na primeira vez que o usuário faz login (quando user existe)
      if (account && user) {
        // Verificar se o usuário já existe no banco
        let dbUser = await prisma.usuario.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          // Criar novo usuário se não existir
          dbUser = await prisma.usuario.create({
            data: {
              email: user.email!,
              nome: user.name || "Usuário",
              image: user.image,
              senha: "", // OAuth não precisa de senha
              ativo: true,
              role: "USER",
            },
          });
        } else if (!dbUser.ativo) {
          // Impedir login se usuário estiver desativado
          throw new Error("Usuário desativado");
        }

        token.id = dbUser.id;
        token.role = dbUser.role;
        token.nome = dbUser.nome;
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
        session.user.nome = token.nome as string;
      }

      return session;
    },
    async signIn({ user }) {
      // Verificar se o usuário está desativado
      const existingUser = await prisma.usuario.findUnique({
        where: { email: user.email! },
      });

      if (existingUser && !existingUser.ativo) {
        return false;
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
