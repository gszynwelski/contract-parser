import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any).id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get("type") || "contracts"; // 'contracts' | 'receipts'
    const search = searchParams.get("search") || "";
    
    const userId = (session.user as any).id;

    if (tipo === "contracts") {
      const data = await prisma.contract.findMany({
        where: {
          userId,
          OR: [
            { nome_contratante: { contains: search } },
            { cpf: { contains: search } }
          ]
        },
        orderBy: { data_upload: 'desc' }
      });
      return NextResponse.json({ data });
    } else {
      const data = await prisma.receipt.findMany({
        where: {
          userId,
          OR: [
            { nome: { contains: search } },
            { cpf: { contains: search } }
          ]
        },
        orderBy: { data_recebimento: 'desc' }
      });
      return NextResponse.json({ data });
    }

  } catch (error) {
    console.error("API error fetching history:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
