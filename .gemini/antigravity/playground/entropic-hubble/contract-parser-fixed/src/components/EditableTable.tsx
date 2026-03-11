"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import styles from "./EditableTable.module.css";

export interface Column {
  key: string;
  label: string;
  type?: "text" | "number" | "date";
}

export interface RowData {
  id: string;
  [key: string]: any;
}

interface EditableTableProps {
  columns: Column[];
  data: RowData[];
  onEditRow: (id: string, key: string, value: any) => void;
  onDeleteRow: (id: string) => void;
  onSaveAll: () => void;
  isSaving?: boolean;
}

export function EditableTable({
  columns,
  data,
  onEditRow,
  onDeleteRow,
  onSaveAll,
  isSaving = false,
}: EditableTableProps) {
  if (data.length === 0) return null;

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={styles.th}>{c.label}</th>
              ))}
              <th className={styles.th} style={{ width: "50px" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key} className={styles.td}>
                    <input
                      type={c.type || "text"}
                      className={styles.input}
                      value={row[c.key] || ""}
                      onChange={(e) => onEditRow(row.id, c.key, e.target.value)}
                    />
                  </td>
                ))}
                <td className={styles.td}>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={() => onDeleteRow(row.id)}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.actions}>
        <button className="btn btn-outline" onClick={() => data.forEach(row => onDeleteRow(row.id))}>
          Limpar Tudo
        </button>
        <button className="btn" onClick={onSaveAll} disabled={isSaving}>
          {isSaving ? "Salvando..." : "Confirmar e Salvar no Banco"}
        </button>
      </div>
    </div>
  );
}
