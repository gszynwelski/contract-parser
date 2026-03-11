"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Download, Search } from "lucide-react";
import styles from "@/components/EditableTable.module.css";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"contracts" | "receipts">("contracts");
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history?type=${activeTab}&search=${encodeURIComponent(search)}`);
      const result = await res.json();
      if (result.data) setData(result.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab, search]);

  useEffect(() => {
    // Debounce search fetch slightly
    const delay = setTimeout(() => {
      fetchHistory();
    }, 400);
    return () => clearTimeout(delay);
  }, [search, activeTab, fetchHistory]);

  const exportCSV = (type: "contracts" | "receipts") => {
    if (data.length === 0) return alert("Nenhum dado para exportar");

    const fields = type === "contracts"
      ? ["id", "nome_contratante", "cpf", "cep", "endereco", "tipo_processo", "numero_parcelas", "valor_parcela", "data_primeiro_pagamento"]
      : ["id", "nome", "cpf", "valor", "data_recebimento"];

    const headers = fields.join(";");
    const rows = data.map(item => 
      fields.map(field => {
        let val = item[field];
        if (val === null || val === undefined) val = "";
        // Convert to Excel-friendly Brazilian format for explicit string columns
        if (field === "valor_parcela" || field === "valor") {
           val = String(val).replace(".", ",");
        }
        else if (field === "data_primeiro_pagamento" || field === "data_recebimento") {
           if (val) {
             const d = new Date(val);
             val = d.toLocaleDateString("pt-BR", { timeZone: "UTC" });
           }
        }
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(";")
    );

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `export_${type}_${new Date().toISOString().substring(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <h1 className="page-title">Histórico e Exportação</h1>
      <p className="page-subtitle">Consulte os registros salvos e exporte para planilhas.</p>

      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ flex: 1, minWidth: "250px", position: "relative" }}>
          <Search size={18} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou CPF..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.75rem 1rem 0.75rem 2.5rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--input-bg)",
            }}
          />
        </div>
        <button className="btn btn-outline" onClick={() => exportCSV("contracts")} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Download size={18} />
          Exportar Contratos (CSV)
        </button>
        <button className="btn btn-outline" onClick={() => exportCSV("receipts")} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Download size={18} />
          Exportar Recebimentos (CSV)
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", backgroundColor: "#f9fafb" }}>
          <button 
            style={{ flex: 1, padding: "1rem", border: "none", backgroundColor: activeTab === "contracts" ? "white" : "transparent", fontWeight: activeTab === "contracts" ? 600 : 400, borderBottom: activeTab === "contracts" ? "2px solid var(--primary-color)" : "none", cursor: "pointer" }}
            onClick={() => setActiveTab("contracts")}
          >
            Contratos ({activeTab === "contracts" && !loading ? data.length : "..."})
          </button>
          <button 
            style={{ flex: 1, padding: "1rem", border: "none", backgroundColor: activeTab === "receipts" ? "white" : "transparent", fontWeight: activeTab === "receipts" ? 600 : 400, borderBottom: activeTab === "receipts" ? "2px solid var(--primary-color)" : "none", cursor: "pointer" }}
            onClick={() => setActiveTab("receipts")}
          >
            Recebimentos ({activeTab === "receipts" && !loading ? data.length : "..."})
          </button>
        </div>

        <div style={{ padding: "1.5rem", overflowX: "auto" }}>
          {loading ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Carregando...</p>
          ) : data.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Nenhum registro encontrado.</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  {activeTab === "contracts" ? (
                    <>
                      <th className={styles.th}>Nome Contratante</th>
                      <th className={styles.th}>CPF</th>
                      <th className={styles.th}>Processo</th>
                      <th className={styles.th}>Parcelas</th>
                      <th className={styles.th}>Valor</th>
                    </>
                  ) : (
                    <>
                      <th className={styles.th}>Nome</th>
                      <th className={styles.th}>CPF</th>
                      <th className={styles.th}>Valor</th>
                      <th className={styles.th}>Data Recebimento</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                     {activeTab === "contracts" ? (
                      <>
                        <td className={styles.td}>{row.nome_contratante}</td>
                        <td className={styles.td}>{row.cpf}</td>
                        <td className={styles.td}>{row.tipo_processo || "-"}</td>
                        <td className={styles.td}>{row.numero_parcelas || "-"}</td>
                        <td className={styles.td}>{row.valor_parcela ? `R$ ${row.valor_parcela}` : "-"}</td>
                      </>
                    ) : (
                      <>
                        <td className={styles.td}>{row.nome}</td>
                        <td className={styles.td}>{row.cpf}</td>
                        <td className={styles.td}>R$ {row.valor}</td>
                        <td className={styles.td}>{new Date(row.data_recebimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
