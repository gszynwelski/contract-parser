"use client";

import React, { useState } from "react";
import { EditableTable, Column, RowData } from "@/components/EditableTable";

const columns: Column[] = [
  { key: "nome", label: "Nome do Cliente" },
  { key: "cpf", label: "CPF" },
  { key: "valor", label: "Valor (R$)", type: "number" },
  { key: "data_recebimento", label: "Data" },
  { key: "texto_original", label: "Texto Original" },
];

export default function ReceiptsPage() {
  const [text, setText] = useState("");
  const [data, setData] = useState<RowData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const processText = async () => {
    if (!text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/receipts/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      const result = await res.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        alert("Erro no processamento: " + result.error);
      }
    } catch (err) {
      alert("Erro ao conectar ao servidor.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/receipts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receipts: data })
      });
      const result = await res.json();
      
      if (result.success) {
        let msg = `Salvo com sucesso! ${result.count} registros adicionados.`;
        if (result.errors && result.errors.length > 0) {
          msg += `\nAvisos:\n${result.errors.map((e: any) => `- ${e.error}`).join("\n")}`;
        }
        alert(msg);
        setData([]);
        setText("");
      } else {
        alert("Erro ao salvar: " + result.error);
      }
    } catch (err) {
      alert("Erro de comunicação com o servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditRow = (id: string, key: string, value: any) => {
    setData(prev => prev.map(row => row.id === id ? { ...row, [key]: value } : row));
  };
  const handleDeleteRow = (id: string) => {
    setData(prev => prev.filter(row => row.id !== id));
  };

  return (
    <div>
      <h1 className="page-title">Organizador de Recebimentos</h1>
      <p className="page-subtitle">Cole linhas de texto de PIX ou transferências para extrair os dados formatados.</p>

      {data.length === 0 ? (
        <div className="card">
          <div style={{ marginBottom: "1rem" }}>
            <label 
              htmlFor="receipts-input" 
              style={{ display: "block", marginBottom: "0.5rem", fontWeight: 500 }}
            >
              Cole o texto dos recebimentos:
            </label>
            <textarea
              id="receipts-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Exemplo: RECEBIMENTO PIX 25676681870 MARLON CESAR RAVASIO R$ 98,00"
              style={{
                width: "100%",
                minHeight: "200px",
                padding: "1rem",
                borderRadius: "8px",
                border: "1px solid var(--border-color)",
                fontFamily: "monospace",
                resize: "vertical",
                backgroundColor: "var(--input-bg)"
              }}
            />
          </div>

          <button 
            className="btn" 
            onClick={processText}
            disabled={!text.trim() || isProcessing}
          >
            {isProcessing ? "Processando..." : "Processar Recebimentos"}
          </button>
        </div>
      ) : (
        <EditableTable 
          columns={columns}
          data={data}
          onEditRow={handleEditRow}
          onDeleteRow={handleDeleteRow}
          onSaveAll={handleSaveAll}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
