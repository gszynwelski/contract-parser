"use client";

import React, { useCallback, useState } from "react";
import { UploadCloud } from "lucide-react";
import { EditableTable, Column, RowData } from "@/components/EditableTable";

const columns: Column[] = [
  { key: "nome_arquivo_pdf", label: "Arquivo" },
  { key: "nome_contratante", label: "Nome Contratante" },
  { key: "cpf", label: "CPF" },
  { key: "cep", label: "CEP" },
  { key: "endereco", label: "Endereço" },
  { key: "tipo_processo", label: "Tipo Processo" },
  { key: "numero_parcelas", label: "Parcelas", type: "number" },
  { key: "valor_parcela", label: "Valor (R$)", type: "number" },
  { key: "data_primeiro_pagamento", label: "1º Pagamento" },
];

export default function ContractsReaderPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<RowData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === "application/pdf");
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type === "application/pdf");
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("files", file));

      const res = await fetch("/api/contracts/process", {
        method: "POST",
        body: formData
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
      const res = await fetch("/api/contracts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contracts: data })
      });
      const result = await res.json();
      
      if (result.success) {
        alert(`Salvo com sucesso! ${result.count} contratos registrados.`);
        setData([]);
        setFiles([]);
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
      <h1 className="page-title">Leitor de Contratos</h1>
      <p className="page-subtitle">Faça o upload de contratos em PDF para extração automática.</p>

      {data.length === 0 ? (
        <div className="card">
          <div 
            style={{
              border: "2px dashed var(--border-color)",
              borderRadius: "12px",
              padding: "3rem 1rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: "var(--input-bg)",
              transition: "all 0.2s"
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input 
              type="file" 
              id="file-upload" 
              multiple 
              accept=".pdf" 
              style={{ display: "none" }} 
              onChange={handleFileChange}
            />
            <UploadCloud size={48} color="var(--primary-color)" style={{ marginBottom: "1rem" }} />
            <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "var(--text-main)" }}>
              Arraste arquivos PDF para cá
            </h3>
            <p style={{ color: "var(--text-muted)" }}>Ou clique para selecionar arquivos</p>
          </div>

          {files.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <h4 style={{ marginBottom: "1rem" }}>Arquivos selecionados ({files.length})</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
                {files.map((file, idx) => (
                  <li key={idx} style={{ padding: "0.75rem", backgroundColor: "#f3f4f6", borderRadius: "8px", fontSize: "0.9rem" }}>
                    {file.name}
                  </li>
                ))}
              </ul>
              <button className="btn" onClick={processFiles} disabled={isProcessing}>
                {isProcessing ? "Processando..." : "Processar Contratos"}
              </button>
            </div>
          )}
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
