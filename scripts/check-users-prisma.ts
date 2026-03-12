import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Usando .env.local (Prisma Data Platform) diretamente
const connectionString = "postgres://9d2c2d0c32fe1eb63fad3c21aec5516f965b1bb7240aa1af1d19536360209697:sk_RP18SntLoNZ_Pz2R5NE96@db.prisma.io:5432/postgres?sslmode=require";

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("📋 Usuários no banco PRISMA DATA PLATFORM:\n");
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  });
  console.table(usuarios.map((u) => ({ nome: u.nome, email: u.email, role: u.role, ativo: u.ativo })));
  console.log("Total:", usuarios.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
