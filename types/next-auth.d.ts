import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: Role;
      nome: string;
    };
  }

  interface User {
    role?: Role;
    nome?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    nome?: string;
  }
}
