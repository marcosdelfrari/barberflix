import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";

async function verifyAdmin() {
  const session = await auth();
  return session?.user?.role === "ADMIN";
}

// GET /api/admin/agendamentos/[id] - Busca agendamento por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        profissional: {
          select: {
            id: true,
            nome: true,
          },
        },
        servicos: {
          include: {
            servico: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
        estabelecimento: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    const duracaoTotal = agendamento.servicos.reduce(
      (acc, s) => acc + s.duracao,
      0,
    );

    return NextResponse.json({
      ...agendamento,
      valorTotal: Number(agendamento.valorTotal),
      duracaoTotal,
      servicos: agendamento.servicos.map((s) => ({
        id: s.servico.id,
        nome: s.servico.nome,
        preco: Number(s.preco),
        duracao: s.duracao,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar agendamento" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/agendamentos/[id] - Atualiza agendamento (status, data, serviços)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, dataHora, observacoes, servicosIds } = body;

    // Buscar agendamento atual
    const agendamento = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        servicos: {
          include: {
            servico: true,
          },
        },
      },
    });

    if (!agendamento) {
      return NextResponse.json(
        { error: "Agendamento não encontrado" },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (observacoes !== undefined) {
      updateData.observacoes = observacoes;
    }

    // Se servicosIds foi enviado, atualizar os serviços
    if (servicosIds && Array.isArray(servicosIds)) {
      // Buscar os serviços selecionados
      const servicos = await prisma.servico.findMany({
        where: {
          id: { in: servicosIds },
          profissionalId: agendamento.profissionalId,
          ativo: true,
        },
      });

      if (servicos.length === 0) {
        return NextResponse.json(
          { error: "Nenhum serviço válido selecionado" },
          { status: 400 },
        );
      }

      // Calcular nova duração total e valor total
      const duracaoTotal = servicos.reduce((acc, s) => acc + s.duracao, 0);
      const valorTotal = servicos.reduce((acc, s) => acc + Number(s.preco), 0);

      // Atualizar dataFim baseado na nova duração
      const dataHoraBase = dataHora ? new Date(dataHora) : agendamento.dataHora;
      const novaDataFim = new Date(
        dataHoraBase.getTime() + duracaoTotal * 60000,
      );

      // Verificar conflito de horário
      const conflito = await prisma.agendamento.findFirst({
        where: {
          id: { not: id },
          profissionalId: agendamento.profissionalId,
          status: { in: ["PENDENTE", "CONFIRMADO"] },
          OR: [
            {
              AND: [
                { dataHora: { lte: dataHoraBase } },
                { dataFim: { gt: dataHoraBase } },
              ],
            },
            {
              AND: [
                { dataHora: { lt: novaDataFim } },
                { dataFim: { gte: novaDataFim } },
              ],
            },
          ],
        },
      });

      if (conflito) {
        return NextResponse.json(
          { error: "Horário não disponível para a duração total dos serviços" },
          { status: 409 },
        );
      }

      // Remover serviços antigos e adicionar novos
      await prisma.agendamentoServico.deleteMany({
        where: { agendamentoId: id },
      });

      await prisma.agendamentoServico.createMany({
        data: servicos.map((s) => ({
          agendamentoId: id,
          servicoId: s.id,
          preco: s.preco,
          duracao: s.duracao,
        })),
      });

      updateData.valorTotal = valorTotal;
      updateData.dataFim = novaDataFim;
      if (dataHora) {
        updateData.dataHora = dataHoraBase;
      }
    } else if (dataHora) {
      // Se apenas dataHora foi alterada (sem serviços)
      const duracaoTotal = agendamento.servicos.reduce(
        (acc, s) => acc + s.duracao,
        0,
      );
      const novaDataHora = new Date(dataHora);
      const novaDataFim = new Date(
        novaDataHora.getTime() + duracaoTotal * 60000,
      );

      // Verificar conflito
      const conflito = await prisma.agendamento.findFirst({
        where: {
          id: { not: id },
          profissionalId: agendamento.profissionalId,
          status: { in: ["PENDENTE", "CONFIRMADO"] },
          OR: [
            {
              AND: [
                { dataHora: { lte: novaDataHora } },
                { dataFim: { gt: novaDataHora } },
              ],
            },
            {
              AND: [
                { dataHora: { lt: novaDataFim } },
                { dataFim: { gte: novaDataFim } },
              ],
            },
          ],
        },
      });

      if (conflito) {
        return NextResponse.json(
          { error: "Horário não disponível" },
          { status: 409 },
        );
      }

      updateData.dataHora = novaDataHora;
      updateData.dataFim = novaDataFim;
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id },
      data: updateData,
      include: {
        usuario: { select: { nome: true, email: true } },
        profissional: { select: { nome: true } },
        servicos: {
          include: {
            servico: { select: { id: true, nome: true } },
          },
        },
      },
    });

    return NextResponse.json({
      ...agendamentoAtualizado,
      valorTotal: Number(agendamentoAtualizado.valorTotal),
      servicos: agendamentoAtualizado.servicos.map((s) => ({
        id: s.servico.id,
        nome: s.servico.nome,
        preco: Number(s.preco),
        duracao: s.duracao,
      })),
    });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar agendamento" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/agendamentos/[id] - Cancela agendamento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const isAdmin = await verifyAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.agendamento.update({
      where: { id },
      data: { status: "CANCELADO" },
    });

    return NextResponse.json({ message: "Agendamento cancelado" });
  } catch (error) {
    console.error("Erro ao cancelar agendamento:", error);
    return NextResponse.json(
      { error: "Erro ao cancelar agendamento" },
      { status: 500 },
    );
  }
}
