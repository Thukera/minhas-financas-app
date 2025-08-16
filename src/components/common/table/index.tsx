"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any, index?: number) => React.ReactNode;
}

interface ResponsiveTableProps {
    columns: Column[];
    items: any[];
    totalLabel?: string;
    calcTotal?: (items: any[]) => number;
    highlightPaid?: boolean;
}

export const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
    columns,
    items,
    totalLabel = "TOTAL",
    calcTotal,
    highlightPaid = true,
}) => {
    const [rows, setRows] = useState(items);
    const [openRow, setOpenRow] = useState<number | null>(null);

    // modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<number | null>(null);

    const toggleRow = (index: number) => {
        setOpenRow(openRow === index ? null : index);
    };

    const openConfirmModal = (index: number) => {
        setSelectedRow(index);
        setIsModalOpen(true);
    };

    const confirmPayment = () => {
        if (selectedRow === null) return;
        const updated = [...rows];
        updated[selectedRow].pago = true;
        setRows(updated);
        console.log("Confirm Payment:", updated[selectedRow]);
        setIsModalOpen(false);
        setSelectedRow(null);
    };

    // always append pago as last column for desktop
    const finalColumns: Column[] = [
        ...columns,
        ...(!columns.some(c => c.key === "pago")
            ? [{
                key: "pago",
                label: "PAGO",
                render: (_: boolean, row: any, index?: number) => (
                    <div onClick={() => openConfirmModal(index!)} style={{ cursor: "pointer" }}>
                        {row.pago ? (
                            <CheckCircle size={20} className="has-text-success" />
                        ) : (
                            <Circle size={20} className="has-text-grey-light" />
                        )}
                    </div>
                ),
            }]
            : [])
    ];

    return (
        <div className="table-container">
            {/* Desktop Table */}
            <table className="table is-fullwidth is-striped is-hoverable has-text-white is-hidden-mobile" style={{ borderRadius: '0.5rem 0.5rem 0.5rem 0.5rem' }}>
                <thead>
                    <tr>
                        {finalColumns.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr
                            key={i}
                            className={
                                highlightPaid && row.pago
                                    ? "has-background-primary-25 has-text-primary-dark"
                                    : undefined
                            }
                        >
                            {finalColumns.map((col) => (
                                <td key={col.key}>
                                    {col.render
                                        ? col.render(row[col.key], row, i)
                                        : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
                {calcTotal && (
                    <tfoot >
                        <tr>
                            <td>
                                <strong>{totalLabel}:</strong>
                            </td>
                            <td>
                                <strong>
                                    {calcTotal(rows).toLocaleString("pt-BR", {
                                        style: "currency",
                                        currency: "BRL",
                                    })}
                                </strong>
                            </td>
                            <td colSpan={finalColumns.length - 2}></td>
                        </tr>
                    </tfoot>
                )}
            </table>

            {/* Mobile List */}
            <div className="is-hidden-tablet">
                {rows.map((row, i) => (
                    <div
                        key={i}
                        className={`box mb-2 ${highlightPaid && row.pago
                            ? "has-background-primary-25"
                            : undefined
                            }`}
                    >
                        {/* Header row: descricao + vencimento */}
                        <div
                            className="is-flex is-align-items-center"
                            style={{ cursor: "pointer" }}
                            onClick={() => toggleRow(i)}
                        >
                            <div style={{ flex: 1, textAlign: "left" }}>
                                <strong>{row[columns[0].key]}</strong>
                            </div>
                            <div style={{ flex: 1, textAlign: "right" }}>
                                {columns[2].render
                                    ? columns[2].render(row[columns[2].key], row)
                                    : row[columns[2].key]}
                            </div>
                            <span className="icon ml-2">
                                <i
                                    className={`fas ${openRow === i ? "fa-chevron-up" : "fa-chevron-down"
                                        }`}
                                ></i>
                            </span>
                        </div>

                        {/* Dropdown with details */}
                        <AnimatePresence>
                            {openRow === i && (
                                <motion.div
                                    className="mt-2"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <div className="box has-background-dark">
                                        {finalColumns.map((col) => (
                                            <div
                                                key={col.key}
                                                className="is-flex is-justify-content-space-between py-1"
                                            >
                                                <span className="has-text-grey-light">{col.label}</span>
                                                <span className="has-text-white">
                                                    {col.render ? col.render(row[col.key], row, i) : row[col.key]}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}

                {/* Total on mobile */}
                {calcTotal && (
                    <div className="has-text-right has-text-weight-bold mt-3">
                        {totalLabel}:{" "}
                        {calcTotal(rows).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                        })}
                    </div>
                )}
            </div>

            {/* Confirmation Modal */}
            {isModalOpen && (
                <div className={`modal is-active`}>
                    <div
                        className="modal-background"
                        onClick={() => setIsModalOpen(false)}
                    ></div>
                    <div className="modal-card">
                        <header className="modal-card-head">
                            <p className="modal-card-title">Confirmação</p>
                            <button
                                className="delete"
                                aria-label="close"
                                onClick={() => setIsModalOpen(false)}
                            ></button>
                        </header>
                        <section className="modal-card-body">
                            Tem certeza que deseja marcar este pagamento como <b>pago</b>?
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button is-success" onClick={confirmPayment}>
                                Confirmar
                            </button>
                            <button
                                className="button"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </button>
                        </footer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResponsiveTable;
