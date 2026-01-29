import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obter token JWT (compatível com Edge Runtime)
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;

  // Rotas de autenticação (para redirecionar se já logado)
  const authRoutes = ["/login", "/register"];
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  // Rotas de usuário
  const userRoutes = ["/home", "/agendar", "/perfil", "/assinatura"];
  const isUserRoute = userRoutes.some((route) => pathname.startsWith(route));

  // Rotas de admin
  const isAdminRoute = pathname.startsWith("/dashboard");

  // 1. /login sempre leva à página inicial: não logado -> landing (/), logado -> /home ou /dashboard
  if (pathname === "/login") {
    if (isAuthenticated) {
      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Outras rotas de auth (ex: /register) - se já logado, redirecionar
  if (isAuthRoute && isAuthenticated) {
    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // 2. Se acessar rota pública (landing) -> Permitir sempre
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 3. Proteção de rotas Admin
  if (isAdminRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  // 4. Proteção de rotas Usuário
  if (isUserRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
