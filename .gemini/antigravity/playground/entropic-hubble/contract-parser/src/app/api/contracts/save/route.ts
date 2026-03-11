import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contracts } = body; // Expects an array of contract objects

    if (!contracts || !Array.isArray(contracts)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const results = [];

    // Process and save each contract
    for (const contract of contracts) {
      // Basic validation
      if (!contract.nome_contratante || !contract.cpf) continue;

      const created = await prisma.contract.create({
        data: {
          userId,
          nome_contratante: String(contract.nome_contratante),
          cpf: String(contract.cpf),
          cep: contract.cep ? String(contract.cep) : null,
          endereco: contract.endereco ? String(contract.endereco) : null,
          tipo_processo: contract.tipo_processo ? String(contract.tipo_processo) : null,
          numero_parcelas: contract.numero_parcelas ? parseInt(String(contract.numero_parcelas)) : null,
          valor_parcela: contract.valor_parcela ? parseFloat(String(contract.valor_parcela)) : null,
          data_primeiro_pagamento: contract.data_primeiro_pagamento ? new Date(contract.data_primeiro_pagamento) : null,
          nome_arquivo_pdf: contract.nome_arquivo_pdf ? String(contract.nome_arquivo_pdf) : null,
        }
      });
      results.push(created);
    }

    return NextResponse.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error("Error saving contracts:", error);
    return NextResponse.json({ error: "Failed to save contracts" }, { status: 500 });
  }
}
