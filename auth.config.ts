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
      const userRole = auth?.user?.role as string | undefined;
      const pathname = nextUrl.pathname;

      // Rotas de autenticação
      const authRoutes = ["/login", "/register"];
      const isAuthRoute = authRoutes.some((route) => pathname === route);

      // Rotas de usuário
      const userRoutes = ["/home", "/agendar", "/perfil", "/assinatura"];
      const isUserRoute = userRoutes.some((route) => pathname.startsWith(route));

      // Rotas de admin
      const isAdminRoute = pathname.startsWith("/dashboard");

      // Rota pública (landing) -> Permitir sempre
      if (pathname === "/") {
        return true;
      }

      // /login: se já logado, redireciona (via Response); senão, permite
      if (pathname === "/login") {
        if (isAuthenticated) {
          const redirectTo = userRole === "ADMIN" ? "/dashboard" : "/home";
          return Response.redirect(new URL(redirectTo, nextUrl));
        }
        return true;
      }

      // Outras rotas de auth - se já logado, redirecionar
      if (isAuthRoute && isAuthenticated) {
        const redirectTo = userRole === "ADMIN" ? "/dashboard" : "/home";
        return Response.redirect(new URL(redirectTo, nextUrl));
      }

      // Proteção de rotas Admin
      if (isAdminRoute) {
        if (!isAuthenticated) {
          return Response.redirect(new URL("/login", nextUrl));
        }
        if (userRole !== "ADMIN") {
          return Response.redirect(new URL("/home", nextUrl));
        }
        return true;
      }

      // Proteção de rotas Usuário
      if (isUserRoute) {
        if (!isAuthenticated) {
          return Response.redirect(new URL("/login", nextUrl));
        }
        return true;
      }

      return true;
    },
  },
};
