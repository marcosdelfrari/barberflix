import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// Mesma ordem do Next.js/Prisma: .env e depois .env.local (override) para usar o mesmo banco que o app
config(); // .env
config({ path: ".env.local", override: true }); // .env.local se existir

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
  console.log("🌱 Iniciando seed do banco de dados...");

  // Hash das senhas
  const senhaAdmin = await bcrypt.hash("admin123", 10);
  const senhaUser = await bcrypt.hash("user123", 10);

  // Criar usuário Admin
  const admin = await prisma.usuario.upsert({
    where: { email: "afk.marcos@gmail.com" },
    update: {},
    create: {
      nome: "Administrador",
      email: "afk.marcos@gmail.com",
      senha: senhaAdmin,
      telefone: "(11) 99999-0000",
      role: "ADMIN",
      ativo: true,
    },
  });

  console.log("✅ Usuário Admin criado:", admin.email);

  // Criar usuário comum
  const user = await prisma.usuario.upsert({
    where: { email: "usuario@gmail.com" },
    update: {},
    create: {
      nome: "Usuario Teste",
      email: "usuario@gmail.com",
      senha: senhaUser,
      telefone: "(11) 99999-0000",
      role: "USER",
      ativo: true,
    },
  });

  console.log("✅ Usuário comum criado:", user.email);

  // ==========================================
  // PLANOS DE ASSINATURA
  // ==========================================
  console.log("\n💳 Criando planos de assinatura...");

  await prisma.plano.upsert({
    where: { id: "plano-one" },
    update: {},
    create: {
      id: "plano-one",
      nome: "Plano One",
      descricao: "Plano básico com benefícios exclusivos",
      preco: 30.0,
      vigencia: "Indeterminado",
      features: ["Benefícios exclusivos", "Acesso ao app"],
      destaque: false,
      ordem: 1,
      ativo: true,
    },
  });

  await prisma.plano.upsert({
    where: { id: "plano-corte" },
    update: {},
    create: {
      id: "plano-corte",
      nome: "Corte",
      descricao: "Plano ideal para quem só precisa de corte",
      preco: 68.9,
      vigencia: "Indeterminado",
      features: ["Cabelo", "1 corte por mês", "Agendamento prioritário"],
      destaque: true,
      ordem: 2,
      ativo: true,
    },
  });

  await prisma.plano.upsert({
    where: { id: "plano-barba" },
    update: {},
    create: {
      id: "plano-barba",
      nome: "Barba e Bigode",
      descricao: "Plano completo para barba e bigode",
      preco: 78.9,
      vigencia: "Indeterminado",
      features: ["Barba e Bigode", "2 serviços por mês", "Produtos premium"],
      destaque: false,
      ordem: 3,
      ativo: true,
    },
  });

  await prisma.plano.upsert({
    where: { id: "plano-combo" },
    update: {},
    create: {
      id: "plano-combo",
      nome: "Cabelo, Barba e Bigode",
      descricao: "O plano mais completo",
      preco: 128.9,
      vigencia: "Indeterminado",
      features: [
        "Cabelo",
        "Barba e Bigode",
        "4 serviços por mês",
        "Produtos premium",
        "Agendamento prioritário",
      ],
      destaque: false,
      ordem: 4,
      ativo: true,
    },
  });

  console.log("✅ Planos criados");

  // ==========================================
  // ESTABELECIMENTOS
  // ==========================================
  console.log("\n🏪 Criando estabelecimentos...");

  const estabelecimento1 = await prisma.estabelecimento.upsert({
    where: { id: "estab-barbearia-central" },
    update: {},
    create: {
      id: "estab-barbearia-central",
      nome: "Barbearia Central",
      endereco: "Rua das Flores, 123 - Centro",
      telefone: "(11) 3333-1111",
      email: "contato@barbeariacentral.com",
      foto: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=300&h=200&fit=crop",
      logo: "/logobc.png",
      descricao: "A melhor barbearia do centro da cidade",
      cnpj: "12.345.678/0001-90",
      responsavel: "Carlos Silva",
      horarioAbre: "08:00",
      horarioFecha: "20:00",
      diasFuncionamento: ["seg", "ter", "qua", "qui", "sex", "sab"],
      ativo: true,
    },
  });

  console.log("✅ Estabelecimentos criados");

  // ==========================================
  // SERVIÇOS DO ESTABELECIMENTO (Catálogo Global)
  // ==========================================
  console.log("\n✂️ Criando catálogo de serviços...");

  const servicosCatalogo = [
    {
      id: "serv-tinta-preta",
      nome: "Tinta Preta",
      preco: 30.0,
      precoAPartir: true,
      duracao: 45,
    },
    {
      id: "serv-sobrancelha",
      nome: "Sobrancelha",
      preco: 13.0,
      precoAPartir: false,
      duracao: 15,
    },
    {
      id: "serv-risco-simples",
      nome: "Risco simples",
      preco: 5.0,
      precoAPartir: false,
      duracao: 10,
    },
    {
      id: "serv-relaxamento",
      nome: "Relaxamento",
      preco: 50.0,
      precoAPartir: true,
      duracao: 60,
    },
    {
      id: "serv-reflexo-alinhado",
      nome: "Reflexo Alinhado",
      preco: 65.0,
      precoAPartir: false,
      duracao: 60,
    },
    {
      id: "serv-raspar-maquina",
      nome: "Raspar na maquina",
      preco: 20.0,
      precoAPartir: false,
      duracao: 20,
    },
    {
      id: "serv-progressiva",
      nome: "Progressiva",
      preco: 90.0,
      precoAPartir: true,
      duracao: 120,
    },
    {
      id: "serv-platinado",
      nome: "Platinado",
      preco: 110.0,
      precoAPartir: true,
      duracao: 180,
    },
    {
      id: "serv-pigmentacao",
      nome: "Pigmentação Colorida",
      preco: 90.0,
      precoAPartir: true,
      duracao: 90,
    },
    {
      id: "serv-pezinho",
      nome: "Pezinho, Acabamento",
      preco: 13.0,
      precoAPartir: false,
      duracao: 15,
    },
    {
      id: "serv-matizar",
      nome: "Matizar",
      preco: 20.0,
      precoAPartir: true,
      duracao: 30,
    },
    {
      id: "serv-luzes",
      nome: "Luzes",
      preco: 55.0,
      precoAPartir: true,
      duracao: 90,
    },
    {
      id: "serv-hidratacao",
      nome: "Hidratação",
      preco: 20.0,
      precoAPartir: true,
      duracao: 30,
    },
    {
      id: "serv-freestyle",
      nome: "Freestyle",
      preco: 8.0,
      precoAPartir: true,
      duracao: 20,
    },
    {
      id: "serv-corte",
      nome: "Corte",
      preco: 40.0,
      precoAPartir: false,
      duracao: 40,
    },
    {
      id: "serv-bigode",
      nome: "Bigode",
      preco: 10.0,
      precoAPartir: false,
      duracao: 15,
    },
    {
      id: "serv-barba-terapia",
      nome: "Barba Terapia",
      preco: 35.0,
      precoAPartir: false,
      duracao: 30,
    },
    {
      id: "serv-barba-express",
      nome: "Barba Express",
      preco: 15.0,
      precoAPartir: false,
      duracao: 15,
    },
  ];

  const servicosIds: string[] = [];

  for (const serv of servicosCatalogo) {
    await prisma.servico.upsert({
      where: { id: serv.id },
      update: {
        nome: serv.nome,
        preco: serv.preco,
        precoAPartir: serv.precoAPartir,
        duracao: serv.duracao,
      },
      create: {
        id: serv.id,
        estabelecimentoId: estabelecimento1.id,
        nome: serv.nome,
        descricao: serv.precoAPartir
          ? `A partir de R$ ${serv.preco.toFixed(2)}`
          : null,
        duracao: serv.duracao,
        preco: serv.preco,
        precoAPartir: serv.precoAPartir,
        ativo: true,
      },
    });
    servicosIds.push(serv.id);
  }

  console.log(
    "✅ Catálogo de serviços criado:",
    servicosIds.length,
    "serviços",
  );

  // ==========================================
  // PROFISSIONAIS
  // ==========================================
  console.log("\n👨‍💼 Criando profissionais...");

  const prof1 = await prisma.profissional.upsert({
    where: { id: "prof-joao-silva" },
    update: {},
    create: {
      id: "prof-joao-silva",
      estabelecimentoId: estabelecimento1.id,
      nome: "João Silva",
      email: "joao@barbeariacentral.com",
      telefone: "(11) 99999-1111",
      foto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      especialidade: "Corte + Barba",
      bio: "Especialista em cortes modernos com 10 anos de experiência",
      ativo: true,
    },
  });

  const prof2 = await prisma.profissional.upsert({
    where: { id: "prof-maria-santos" },
    update: {},
    create: {
      id: "prof-maria-santos",
      estabelecimentoId: estabelecimento1.id,
      nome: "Maria Santos",
      email: "maria@barbeariacentral.com",
      telefone: "(11) 99999-2222",
      foto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      especialidade: "Coloração e Tratamentos",
      bio: "15 anos de experiência em coloração e tratamentos capilares",
      ativo: true,
    },
  });

  console.log("✅ Profissionais criados");

  // ==========================================
  // VINCULAR PROFISSIONAIS AOS SERVIÇOS
  // ==========================================
  console.log("\n🔗 Vinculando profissionais aos serviços...");

  // Limpar vínculos antigos
  await prisma.profissionalServico.deleteMany({});

  // João Silva presta todos os serviços
  for (const servicoId of servicosIds) {
    await prisma.profissionalServico.create({
      data: {
        profissionalId: prof1.id,
        servicoId: servicoId,
      },
    });
  }

  // Maria Santos presta serviços de coloração e tratamentos
  const servicosMaria = [
    "serv-tinta-preta",
    "serv-relaxamento",
    "serv-reflexo-alinhado",
    "serv-progressiva",
    "serv-platinado",
    "serv-pigmentacao",
    "serv-matizar",
    "serv-luzes",
    "serv-hidratacao",
  ];

  for (const servicoId of servicosMaria) {
    await prisma.profissionalServico.create({
      data: {
        profissionalId: prof2.id,
        servicoId: servicoId,
      },
    });
  }

  console.log("✅ Profissionais vinculados aos serviços");

  // ==========================================
  // DISPONIBILIDADES
  // ==========================================
  console.log("\n📅 Criando disponibilidades...");

  const profissionais = [prof1, prof2];

  for (const prof of profissionais) {
    // Segunda a Sexta (1-5)
    for (let dia = 1; dia <= 5; dia++) {
      await prisma.disponibilidade.upsert({
        where: { id: `disp-${prof.id}-${dia}` },
        update: {},
        create: {
          id: `disp-${prof.id}-${dia}`,
          profissionalId: prof.id,
          diaSemana: dia,
          horaInicio: "09:00",
          horaFim: "18:00",
          ativo: true,
        },
      });
    }
    // Sábado (6)
    await prisma.disponibilidade.upsert({
      where: { id: `disp-${prof.id}-6` },
      update: {},
      create: {
        id: `disp-${prof.id}-6`,
        profissionalId: prof.id,
        diaSemana: 6,
        horaInicio: "09:00",
        horaFim: "14:00",
        ativo: true,
      },
    });
  }

  console.log("✅ Disponibilidades criadas");

  // ==========================================
  // AGENDAMENTOS DE EXEMPLO
  // ==========================================
  console.log("\n📆 Criando agendamentos de exemplo...");

  // Limpar agendamentos anteriores (para evitar conflitos)
  await prisma.agendamentoServico.deleteMany({});
  await prisma.agendamento.deleteMany({});

  // Data base para os agendamentos (hoje)
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Função auxiliar para criar data/hora
  const criarDataHora = (diasOffset: number, hora: number, minuto: number) => {
    const data = new Date(hoje);
    data.setDate(data.getDate() + diasOffset);
    data.setHours(hora, minuto, 0, 0);
    return data;
  };

  // Agendamento 1: Usuário teste com João Silva - Corte + Barba Express
  const ag1DataInicio = criarDataHora(1, 10, 0); // Amanhã às 10:00
  const ag1 = await prisma.agendamento.create({
    data: {
      id: "agend-1",
      usuarioId: user.id,
      estabelecimentoId: estabelecimento1.id,
      profissionalId: prof1.id,
      dataHora: ag1DataInicio,
      dataFim: new Date(ag1DataInicio.getTime() + 55 * 60000), // 40 + 15 min
      valorTotal: 55.0, // 40 + 15
      status: "CONFIRMADO",
      observacoes: "Cliente preferência: degradê suave",
      servicos: {
        create: [
          {
            servicoId: "serv-corte",
            preco: 40.0,
            duracao: 40,
          },
          {
            servicoId: "serv-barba-express",
            preco: 15.0,
            duracao: 15,
          },
        ],
      },
    },
  });
  console.log("  ✅ Agendamento 1 criado:", ag1.id);

  // Agendamento 2: Usuário teste com Maria Santos - Luzes
  const ag2DataInicio = criarDataHora(1, 14, 0); // Amanhã às 14:00
  const ag2 = await prisma.agendamento.create({
    data: {
      id: "agend-2",
      usuarioId: user.id,
      estabelecimentoId: estabelecimento1.id,
      profissionalId: prof2.id,
      dataHora: ag2DataInicio,
      dataFim: new Date(ag2DataInicio.getTime() + 90 * 60000),
      valorTotal: 55.0,
      status: "PENDENTE",
      servicos: {
        create: [
          {
            servicoId: "serv-luzes",
            preco: 55.0,
            duracao: 90,
          },
        ],
      },
    },
  });
  console.log("  ✅ Agendamento 2 criado:", ag2.id);

  // Agendamento 3: Agendamento concluído (passado) - João Silva
  const ag3DataInicio = criarDataHora(-2, 15, 0); // 2 dias atrás às 15:00
  const ag3 = await prisma.agendamento.create({
    data: {
      id: "agend-3",
      usuarioId: user.id,
      estabelecimentoId: estabelecimento1.id,
      profissionalId: prof1.id,
      dataHora: ag3DataInicio,
      dataFim: new Date(ag3DataInicio.getTime() + 70 * 60000),
      valorTotal: 75.0,
      status: "CONCLUIDO",
      servicos: {
        create: [
          {
            servicoId: "serv-corte",
            preco: 40.0,
            duracao: 40,
          },
          {
            servicoId: "serv-barba-terapia",
            preco: 35.0,
            duracao: 30,
          },
        ],
      },
    },
  });
  console.log("  ✅ Agendamento 3 criado:", ag3.id);

  console.log("✅ Agendamentos criados");

  // ==========================================
  // ASSINATURAS DE EXEMPLO
  // ==========================================
  console.log("\n💳 Criando assinatura de exemplo...");

  await prisma.assinatura.upsert({
    where: { usuarioId: user.id },
    update: {},
    create: {
      usuarioId: user.id,
      planoId: "plano-corte",
      status: "ACTIVE",
      dataInicio: new Date(),
      proximaCobranca: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
    },
  });

  console.log("✅ Assinatura criada");

  console.log("\n📋 Credenciais de acesso:");
  console.log("----------------------------------------");
  console.log("👑 Admin (login só com Google):");
  console.log("   Email (use no Google): afk.marcos@gmail.com");
  console.log("----------------------------------------");
  console.log("👤 Usuário:");
  console.log("   Email: afk.marcos@gmail.com");
  console.log("   Senha: user123");
  console.log("----------------------------------------");
  console.log("\n✅ Seed completo!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erro no seed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
