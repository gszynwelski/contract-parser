import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const data = await pdf(buffer);
        const text = data.text;

        // Basic Extraction Logic
        const cpfMatch = text.match(/\b\d{3}[\.\s]?\d{3}[\.\s]?\d{3}[-\.\s]?\d{2}\b/);
        const cepMatch = text.match(/\b\d{5}-\d{3}\b/);
        
        // Simulating naive name extraction (e.g. searching for 'Nome:' or similar)
        // In a real scenario, this would rely on specific PDF structure strings.
        const nameMatch = text.match(/(?:Nome|Contratante)[\s:]+([A-ZÇÃÕÁÉÍÓÚÂÊÎÔÛ][a-zA-Zçãõáéíóúâêîôû\s]+)(?:CPF|RG|-)/i);
        
        // Process Type
        const processKeywords = ["superendividamento", "rmc", "rcc", "revisional", "indenizatória", "isenção de imposto de renda", "limitação"];
        let processType = "";
        for (const kw of processKeywords) {
          if (text.toLowerCase().includes(kw)) {
            processType = kw.charAt(0).toUpperCase() + kw.slice(1);
            break;
          }
        }

        // Financial Data (naive matches)
        const partialsMatch = text.match(/(?:parcelas?|prazo|meses)[\s:de]+(\d{1,3})/i);
        const valueMatch = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
        const dateMatch = text.match(/(?:data[\w\s]+pagamento)[\s:]+(\d{2}\/\d{2}\/\d{4})/i);

        let parsedValue = null;
        if (valueMatch) {
          // Convert R$ 1.200,50 -> 1200.50
          const cleanStr = valueMatch[1].replace(/\./g, "").replace(",", ".");
          parsedValue = parseFloat(cleanStr);
        }

        // Create a random ID for the frontend row
        const tempId = Math.random().toString(36).substring(7);

        results.push({
          id: tempId,
          nome_arquivo_pdf: file.name,
          nome_contratante: nameMatch ? nameMatch[1].trim() : "Nome não identificado",
          cpf: cpfMatch ? cpfMatch[0] : "",
          cep: cepMatch ? cepMatch[0] : "",
          endereco: "", // Difficult to reliably regex extract an address without anchors
          tipo_processo: processType,
          numero_parcelas: partialsMatch ? parseInt(partialsMatch[1]) : "",
          valor_parcela: parsedValue || "",
          data_primeiro_pagamento: dateMatch ? dateMatch[1] : "",
        });
      } catch (err) {
        console.error("PDF Parsing Error for file", file.name, err);
        results.push({
          id: Math.random().toString(36).substring(7),
          nome_arquivo_pdf: file.name,
          error: "Falha ao processar o arquivo PDF"
        });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Process API Error:", error);
    return NextResponse.json({ error: "Server error during processing" }, { status: 500 });
  }
}
