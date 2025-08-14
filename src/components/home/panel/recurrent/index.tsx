import React from "react";

interface PaymentItem {
  descricao: string;
  valor?: number;
  vencimento: string;
  pago?: boolean;
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
      {/* {titulo && <label className="label has-text-white is-size-4">{titulo}</label>} */}

      <div className="table-container">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: "2rem" }}>
            <h2 className="subtitle is-size-6 ">{section.titulo}</h2>

            <table className="table is-fullwidth is-striped is-hoverable has-text-white">
              <thead>
                <tr>
                  <th>DESCRIÇÃO</th>
                  <th>VALOR</th>
                  <th>VENCIMENTO</th>
                  <th>PAGO</th>
                </tr>
              </thead>
              <tbody>
                {section.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.descricao}</td>
                    <td>{formatCurrency(item.valor)}</td>
                    <td>{item.vencimento}</td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={item.pago ?? false}
                        readOnly
                        style={{
                          width: "18px",
                          height: "18px",
                          cursor: "default",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td><strong>TOTAL:</strong></td>
                  <td><strong>{formatCurrency(calcTotal(section.items))}</strong></td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};
