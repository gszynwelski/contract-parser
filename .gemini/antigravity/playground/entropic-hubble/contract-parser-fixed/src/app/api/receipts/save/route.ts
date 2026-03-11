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

    const { receipts } = await request.json();
    if (!receipts || !Array.isArray(receipts)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const results = [];
    const errors = [];

    for (const item of receipts) {
      // Validation rules
      if (!item.cpf || !item.valor || item.valor === 0) {
        errors.push({ line: item.texto_original, error: "Missing CPF or Empty Value" });
        continue;
      }

      // Check Duplication (same CPF + value + date for the user)
      let parsedDate = new Date();
      if (item.data_recebimento && typeof item.data_recebimento === "string") {
        const [day, month, year] = item.data_recebimento.split("/");
        if (day && month && year) {
          parsedDate = new Date(`${year}-${month}-${day}T12:00:00Z`);
        }
      }

      // Simple duplication check for demonstration, finding exact same values
      // Note: Data receives exact timestamp via Date creation above, might be tricky,
      // using text compare on just standard fields would be safer, but Prisma checks Date objects.
      
      const existing = await prisma.receipt.findFirst({
        where: {
          userId,
          cpf: String(item.cpf),
          valor: parseFloat(String(item.valor)),
        }
      });

      // To strictly match "same date", we could convert to YYYY-MM-DD strings in comparison,
      // but matching just CPF and Valor is usually good enough to prevent accidental double-clicks.
      if (existing && existing.data_recebimento.toISOString().substring(0, 10) === parsedDate.toISOString().substring(0, 10)) {
        errors.push({ line: item.texto_original, error: "Duplicated Receipt" });
        continue;
      }

      const created = await prisma.receipt.create({
        data: {
          userId,
          nome: String(item.nome),
          cpf: String(item.cpf),
          valor: parseFloat(String(item.valor)),
          data_recebimento: parsedDate,
          texto_original: String(item.texto_original),
        }
      });
      results.push(created);
    }

    return NextResponse.json({ success: true, count: results.length, data: results, errors });
  } catch (error) {
    console.error("Error saving receipts:", error);
    return NextResponse.json({ error: "Failed to save receipts" }, { status: 500 });
  }
}
