import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Invalid text data" }, { status: 400 });
    }

    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    const results = [];

    for (const line of lines) {
      // Exemplo de entrada: RECEBIMENTO PIX 25676681870 MARLON CESAR RAVASIO R$ 98,00
      
      const cpfMatch = line.match(/\b\d{11}\b/); // Sequential numbers
      let cpf = cpfMatch ? cpfMatch[0] : "";
      
      const valueMatch = line.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
      let valor = null;
      let valorStr = "";
      if (valueMatch) {
        valorStr = valueMatch[0];
        const cleanStr = valueMatch[1].replace(/\./g, "").replace(",", ".");
        valor = parseFloat(cleanStr);
      }

      // Name could be text between CPF and Valor
      let nome = "";
      if (cpfMatch && valueMatch) {
         const cpfIndex = line.indexOf(cpf) + cpf.length;
         const valueIndex = line.indexOf(valorStr);
         if (valueIndex > cpfIndex) {
            nome = line.substring(cpfIndex, valueIndex).trim();
         }
      }

      // Date match logic or current date fallback
      const dateMatch = line.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
      let data_recebimento = dateMatch ? dateMatch[1] : new Date().toLocaleDateString("pt-BR");

      results.push({
        id: Math.random().toString(36).substring(7),
        cpf,
        nome,
        valor,
        data_recebimento,
        texto_original: line
      });
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Receipts process API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
