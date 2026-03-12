import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthenticated = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Rotas de autenticação
      const authRoutes = ["/login", "/register"];
      const isAuthRoute = authRoutes.some((route) => pathname === route);

      // Rotas protegidas (requerem autenticação)
      const protectedRoutes = ["/home", "/agendar", "/perfil", "/assinatura", "/dashboard"];
      const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

      // Rota pública (landing) -> Permitir sempre
      if (pathname === "/") {
        return true;
      }

      // /login: se já logado, vai para /home (a verificação de admin é feita lá)
      if (pathname === "/login" && isAuthenticated) {
        return Response.redirect(new URL("/home", nextUrl));
      }

      // Rotas de auth sem login -> permite
      if (isAuthRoute) {
        return true;
      }

      // Rotas protegidas: precisa estar logado
      if (isProtectedRoute && !isAuthenticated) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      return true;
    },
  },
};
