import React from "react";
import Image from "next/image";
import ResponsiveTable from "@/components/common/table";

interface DomicileItem {
    conta: string;
    valor?: number;
    vencimento: string;
    pago?: boolean;
    responsavel?: {
        name: string;
        avatarUrl: string;
    };
}

interface DomicilePanelProps {
    titulo?: string;
    items?: DomicileItem[];
}

export const DomicilePanel: React.FC<DomicilePanelProps> = ({ titulo, items = [] }) => {
    const formatCurrency = (valor?: number) =>
        valor !== undefined
            ? valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            : "";

    const calcTotal = (items: DomicileItem[]) =>
        items.reduce((sum, item) => sum + (item.valor ?? 0), 0);

    return (
        <div>
            {titulo && <label className="label subtitle is-size-6">{titulo}</label>}

            <div className="table-container">
                <ResponsiveTable
                    columns={[
                        { key: "conta", label: "CONTA" },
                        { key: "valor", label: "VALOR", render: (v) => formatCurrency(v) },
                        { key: "vencimento", label: "VENCIMENTO" },
                        {
                            key: "responsavel",
                            label: "RESPONSÁVEL",
                            render: (v: DomicileItem["responsavel"]) =>
                                v ? (
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <Image
                                            src={v.avatarUrl}
                                            alt={v.name}
                                            width={32}
                                            height={32}
                                            style={{ borderRadius: "50%", marginRight: "0.5rem" }}
                                        />
                                    </div>
                                ) : null,
                        },
                    ]}
                    items={items}
                    highlightPaid={true}
                    calcTotal={calcTotal} // This enables the TOTAL row
                    totalLabel="TOTAL"
                />
            </div>
        </div>
    );
};
