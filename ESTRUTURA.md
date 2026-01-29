# 📁 Estrutura de Páginas - Barbearia Cavalheiros

## 🗂️ Organização com Route Groups

O projeto usa **Route Groups** do Next.js App Router para organizar as rotas sem afetar as URLs:

```
app/
├── (public)/          # Rotas públicas
│   └── page.tsx       # / (Landing)
│
├── (auth)/            # Rotas de autenticação
│   ├── login/
│   │   └── page.tsx   # /login
│   └── register/
│       └── page.tsx   # /register
│
├── (user)/            # Rotas de usuário logado
│   ├── home/
│   │   └── page.tsx   # /home
│   ├── agendar/
│   │   └── page.tsx   # /agendar
│   ├── perfil/
│   │   └── page.tsx   # /perfil
│   └── assinatura/
│       └── page.tsx   # /assinatura
│
└── (admin)/           # Rotas de admin
    └── dashboard/
        ├── page.tsx                    # /dashboard
        ├── agendamentos/
        │   └── page.tsx                # /dashboard/agendamentos
        ├── profissionais/
        │   └── page.tsx                # /dashboard/profissionais
        ├── servicos/
        │   └── page.tsx                # /dashboard/servicos
        └── relatorios/
            └── page.tsx                # /dashboard/relatorios
```

## 📄 Páginas

### 🌐 Público

- **`/`** - Landing page (o que é, planos, CTA)
- **`/login`** - Página de login
- **`/register`** - Página de cadastro

### 👤 Usuário (logado)

- **`/home`** - Dashboard do usuário
  - Próximo agendamento
  - Status da assinatura
- **`/agendar`** - Fluxo de agendamento em 4 steps
  - Step 1: Estabelecimento
  - Step 2: Profissional
  - Step 3: Serviço
  - Step 4: Data/Horário
- **`/perfil`** - Lista de agendamentos do usuário
  - Visualizar agendamentos
  - Cancelar agendamentos
- **`/assinatura`** - Gerenciamento de assinatura
  - Ver planos
  - Status atual
  - Métodos de pagamento

### 🔐 Admin

- **`/dashboard`** - Dashboard administrativo
  - KPIs rápidos
  - Visão geral
- **`/dashboard/agendamentos`** - Gestão de agendamentos
  - Lista completa
  - Confirmar / Editar / Cancelar
- **`/dashboard/profissionais`** - CRUD de profissionais
- **`/dashboard/servicos`** - CRUD de serviços
- **`/dashboard/relatorios`** - Relatórios
  - Faturamento total
  - Por profissional
  - Assinaturas

## 🧱 Componentes Chave

Localizados em `/components`:

- **`CalendarAvailability`** - Seleção de data/horário disponível
- **`ServiceSelector`** - Seletor de serviços
- **`ProfessionalSelector`** - Seletor de profissionais
- **`SubscriptionStatusCard`** - Card de status da assinatura
- **`AdminAppointmentsTable`** - Tabela de agendamentos (admin)
- **`RevenueChart`** - Gráfico de faturamento

## 🔒 Proteção de Rotas

O **`middleware.ts`** na raiz protege as rotas:

- ✅ Rotas públicas (`/`, `/login`, `/register`) - sempre acessíveis
- 🔐 Rotas de usuário - requerem autenticação
- 🛡️ Rotas de admin - requerem autenticação + role `admin`

**Nota:** Atualmente usando cookies mock (`auth` e `role`). Substituir por autenticação real (NextAuth, etc).

## 🧭 Navegação

- **User**: Header simples com links principais
- **Admin**: Sidebar fixa lateral com menu de navegação

## 🚀 Próximos Passos

1. Implementar autenticação real (NextAuth.js recomendado)
2. Conectar com API/banco de dados
3. Substituir dados mock por dados reais
4. Adicionar validação de formulários
5. Implementar testes
