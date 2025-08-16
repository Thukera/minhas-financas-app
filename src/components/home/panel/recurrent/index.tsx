"use client";

import ResponsiveTable from "@/components/common/table";
import React from "react";

interface PaymentItem {
  descricao: string;
  valor?: number;
  vencimento: string;
  pago?: boolean;
  parcela?: number;
  totalParcelas?: number;
  status?: string; // e.g., "agendado"
}

interface PaymentSection {
  titulo: string;
  items: PaymentItem[];
}

interface RecurrentPaymentsPanelProps {
  titulo?: string;
  sections: PaymentSection[];
}

export const RecurrentPaymentsPanel: React.FC<RecurrentPaymentsPanelProps> = ({ titulo, sections }) => {

  const formatCurrency = (valor?: number) =>
    valor !== undefined
      ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "";

  const calcTotal = (items: PaymentItem[]) =>
    items.reduce((sum, item) => sum + (item.valor ?? 0), 0);

  return (
    <div>
      <div className="table-container">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "2rem" }}>

            {/* Render <hr /> only if it's not the first section */}
            {idx > 0 && <hr />}

            <h2 className="subtitle is-size-6 ">{section.titulo}</h2>

            <ResponsiveTable
              columns={[
                { key: "descricao", label: "DESCRIÇÃO" },
                { key: "valor", label: "VALOR", render: (v) => formatCurrency(v) },
                { key: "parcela", label: "Parcelas" },
                { key: "vencimento", label: "VENCIMENTO" },
              ]}
              items={section.items}
              calcTotal={(items) =>
                items.reduce((sum, i) => sum + (i.valor ?? 0), 0)
              }
              highlightPaid={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
