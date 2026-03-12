import NextAuth from "next-auth";
import { prisma } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account }) {
      // Só busca/atualiza do banco no login (evita loop e chamadas em todo request)
      if (account && user) {
        let dbUser = await prisma.usuario.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser) {
          dbUser = await prisma.usuario.create({
            data: {
              email: user.email!,
              nome: user.name || "Usuário",
              image: user.image,
              senha: "",
              ativo: true,
              role: "USER",
            },
          });
        } else if (!dbUser.ativo) {
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
        if (process.env.NODE_ENV === "development" && session.user.email) {
          console.log("[auth] Permissão:", session.user.role, "|", session.user.email);
        }
      }
      return session;
    },
    async signIn({ user }) {
      const existingUser = await prisma.usuario.findUnique({
        where: { email: user.email! },
      });

      if (existingUser && !existingUser.ativo) {
        return false;
      }

      return true;
    },
  },
});
