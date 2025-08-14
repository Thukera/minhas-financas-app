import React from "react";
import Image from "next/image";

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
    return (
        <div>
            {titulo && <label className="label subtitle is-size-6">{titulo}</label>}

            <div className="table-container">
                <table className="table is-fullwidth is-striped is-hoverable has-text-white">
                    <thead>
                        <tr>
                            <th>CONTA</th>
                            <th>VALOR</th>
                            <th>VENCIMENTO</th>
                            <th>PAGO</th>
                            <th>RESPONSÁVEL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td>{item.conta}</td>
                                <td>{item.valor !== undefined ? item.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : ""}</td>
                                <td>{item.vencimento}</td>
                                <td>
                                    <input type="checkbox" checked={item.pago} readOnly />
                                </td>
                                <td>
                                    {item.responsavel && (
                                        <div style={{ display: "flex", alignItems: "center" }}>
                                            <Image
                                                src={item.responsavel.avatarUrl}
                                                alt={item.responsavel.name}
                                                width={32}
                                                height={32}
                                                style={{ borderRadius: "50%", marginRight: "0.5rem" }}
                                            />
                                            <span>{item.responsavel.name}</span>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
