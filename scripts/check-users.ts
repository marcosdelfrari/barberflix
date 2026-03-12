import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config();
config({ path: ".env.local", override: true });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não está definida");
}

const isOracleCloud = connectionString.includes("oci.oraclecloud.com");
const pool = new Pool({
  connectionString,
  ...(isOracleCloud && { ssl: { rejectUnauthorized: true } }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  console.log("\n📋 Usuários no banco:\n");
  console.table(usuarios.map((u) => ({ nome: u.nome, email: u.email, role: u.role, ativo: u.ativo })));
  console.log("Total:", usuarios.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
