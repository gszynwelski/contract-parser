import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

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
        const text = await parsePDF(buffer);

        console.log("=== TEXTO EXTRAIDO ===");
        console.log(text.substring(0, 600));
        console.log("=== FIM ===");

        const cpfMatch = text.match(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/);
        const cepMatch = text.match(/CEP\s*(\d{5}-\d{3})/i) || text.match(/(\d{5}-\d{3})/);
        const nameMatch = text.match(/CONTRATANTE:\s+([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇ\s]+?),/)
          || text.match(/CONTRATANTE[:\s]+([A-ZÀÁÂÃÉÊÍÓÔÕÚÇ][A-ZÀÁÂÃÉÊÍÓÔÕÚÇa-záàâãéêíóôõúç\s]+?)(?:,|\bCPF\b)/i);
        const addressMatch = text.match(/domiciliado\(a\) na\s+(.+?),\s*(?:CEP|\d{5})/i)
          || text.match(/(?:Rua|Av|Avenida|Travessa|Alameda)[.\s]+([^,\n]{5,50})/i);

        const processKeywords = [
          { kw: "superendividamento", label: "Superendividamento" },
          { kw: "isenção do imposto de renda", label: "Isenção de Imposto de Renda" },
          { kw: "isencao do imposto de renda", label: "Isenção de Imposto de Renda" },
          { kw: "repetição do indébito", label: "Repetição do Indébito" },
          { kw: "rmc", label: "RMC" },
          { kw: "rcc", label: "RCC" },
          { kw: "revisional", label: "Revisional" },
          { kw: "indenizatória", label: "Indenizatória" },
          { kw: "limitação", label: "Limitação" },
        ];
        let processType = "";
        const textLower = text.toLowerCase();
        for (const { kw, label } of processKeywords) {
          if (textLower.includes(kw)) { processType = label; break; }
        }

        const partialsMatch = text.match(/(\d{1,3})\s*\([^)]+\)\s*parcelas/i)
          || text.match(/(\d{1,3})\s*parcelas\s+consecutivas/i)
          || text.match(/(?:parcelas?|prazo|meses)[\s:de]+(\d{1,3})/i);

        const valueMatch = text.match(/R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
        const dateMatch = text.match(/(?:primeiro vencimento|data[^\n]*pagamento)[^\d]*(\d{2}\/\d{2}\/\d{4})/i)
          || text.match(/(\d{2}\/\d{2}\/\d{4})/);

        let parsedValue = null;
        if (valueMatch) {
          parsedValue = parseFloat(valueMatch[1].replace(/\./g, "").replace(",", "."));
        }

        results.push({
          id: Math.random().toString(36).substring(7),
          nome_arquivo_pdf: file.name,
          nome_contratante: nameMatch ? nameMatch[1].trim() : "Nome não identificado",
          cpf: cpfMatch ? cpfMatch[0] : "",
          cep: cepMatch ? (cepMatch[1] ?? cepMatch[0]) : "",
          endereco: addressMatch ? addressMatch[1].trim() : "",
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
          error: "Falha ao processar o arquivo PDF",
        });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error("Process API Error:", error);
    return NextResponse.json({ error: "Server error during processing" }, { status: 500 });
  }
}
