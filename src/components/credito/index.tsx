"use client";

import React, { useState } from "react";
import { Panel } from "../common/panel";
import { Layout } from "../layout";
import { mockCards } from "@/lib/models/credit/card/mock/cards";
import { mockInvoices } from "@/lib/models/credit/card/mock/invoices";
import { CreditCard } from "@//lib/models/credit/card"
import ResponsiveTable from "@/components/common/table";
import "./tabs.css";
import { PieChart } from "react-minimal-pie-chart";

// helper
const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const CreditPage: React.FC = () => {
    const [activeCard, setActiveCard] = useState<CreditCard>(mockCards[0]);

    // load sections for active card
    const sections = mockInvoices[activeCard.id] || [];

    const getExpensesByClass = (items: any[]) => {
        // Group totals by classification
        const totals: Record<string, number> = {};
        items.forEach((item) => {
            const cat = item.classificacao || "Outros";
            totals[cat] = (totals[cat] || 0) + (item.valor ?? 0);
        });

        // Transform into PieChart data format
        return Object.entries(totals).map(([title, value], idx) => ({
            title,
            value,
            color: ["#fbc658", "#36a2eb", "#ff6384", "#ff9f40", "#9966ff"][idx % 5], // cycle colors
        }));
    };

    // All items for current card
    const allItems = mockInvoices[activeCard.id]?.flatMap(s => s.items) || [];

    // Total spent
    const usedLimit = allItems.reduce((sum, i) => sum + (i.valor ?? 0), 0);

    // Installments chart: paid vs pending
    const installmentsChart = [
        {
            title: "Pagas",
            value: allItems.filter(i => i.parcela !== "-" && i.pago).length,
            color: "#36a2eb",
        },
        {
            title: "Pendentes",
            value: allItems.filter(i => i.parcela !== "-" && !i.pago).length,
            color: "#ff6384",
        },
    ];




    return (
        <Layout>
            <Panel>
                {/* Tabs */}
                <div className="tabs is-boxed is-medium">
                    <ul>
                        {mockCards.map((card) => (
                            <li
                                key={card.id}
                                className={activeCard.id === card.id ? "is-active" : ""}
                                onClick={() => setActiveCard(card)}
                            >
                                <a>
                                    <span>
                                        {card.nickname}
                                    </span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* #######################################################################################  */}
                {/* Card details */}
                <div className="columns mt-4">
                    {/* Used Limit */}
                    <div className="column has-text-centered">
                        <PieChart
                            data={[
                                { title: "Used", value: usedLimit, color: "#eb1212ff" },
                                { title: "Available", value: Math.max(activeCard.limit - usedLimit, 0), color: "#2bad11ff" },
                            ]}
                            lineWidth={25}                // smaller donut
                            style={{ maxWidth: "360px", margin: "30px" }} // small size, centered
                            animate={true}                // optional: smooth animation
                        />
                        <p className="mt-2">Limite</p>
                    </div>

                    {/* Expenses by Classification */}
                    <div className="column has-text-centered">
                        <PieChart
                            data={getExpensesByClass(allItems)}
                            lineWidth={25}
                            style={{ maxWidth: "360px", margin: "30px" }} // small size, centered
                            animate={true}                // optional: smooth animation
                        />
                        <p className="mt-2">Categorias</p>
                    </div>

                    {/* Installments */}
                    <div className="column has-text-centered">
                        <PieChart
                            data={installmentsChart}
                            lineWidth={25}
                            style={{ maxWidth: "360px", margin: "30px" }} // small size, centered
                            animate={true}                // optional: smooth animation
                        />
                        <p className="mt-2">Parcelas pagas</p>
                    </div>
                </div>


                {/* #######################################################################################  */}
                {/* Invoice / Extrato */}
                <hr />

                <div className="table-container mt-5">
                    {sections.map((section, idx) => (
                        <div key={idx} style={{ marginBottom: "2rem" }}>
                            <h2 className="subtitle is-size-6">Extrato</h2>

                            <ResponsiveTable
                                columns={[
                                    { key: "descricao", label: "DESCRIÇÃO" },
                                    { key: "valor", label: "VALOR", render: (v) => formatCurrency(v) },
                                    { key: "parcela", label: "Parcelas" },
                                    { key: "vencimento", label: "VENCIMENTO" },
                                    { key: "classificacao", label: "CLASSIFICAÇÃO" },
                                ]}
                                items={allItems}
                                calcTotal={(items) =>
                                    items.reduce((sum, i) => sum + (i.valor ?? 0), 0)
                                }
                                highlightPaid={false}
                                showPaidColumn={false}
                            />
                        </div>
                    ))}
                </div>
            </Panel>
        </Layout >
    );
};
