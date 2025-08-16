"use client";

import React, { useState } from "react";
import { getProgressStyle, formatDate } from "./finances";

export const FinancesPanel: React.FC<{ titulo?: string }> = ({ titulo }) => {
    // Initialized with fixed values
    const [rendimentos] = useState(10000.00);
    const [despesas] = useState(2887.95);
    const [credito] = useState(3820.07);

    const limiteUtilizado = despesas + credito;
    const saldo = rendimentos - limiteUtilizado;
    const sliderMax = rendimentos > 0 ? rendimentos : limiteUtilizado;
    const progressClass = getProgressStyle(limiteUtilizado, sliderMax);

    // Dates
    const today = new Date();
    const beginDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const oneDayMs = 1000 * 60 * 60 * 24;
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / oneDayMs);

    const weeklyBudget = saldo / (daysRemaining / 7);
    const dailyBudget = saldo / daysRemaining;

    return (
        <div>
            {/* Saldo section */}
            <div className="field" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <label className="label is-size-4" style={{ marginBottom: 0 }}>Saldo</label>
                <span style={{ textAlign: "right", fontWeight: "normal", color: "#888" }}>
                    <strong style={{ fontSize: "1.5rem" }}>
                        {today.toLocaleString("pt-BR", { month: "long" })}
                    </strong>
                    <br />
                    <small style={{ fontSize: "1rem" }}>
                        {formatDate(beginDate)} - {formatDate(endDate)}
                    </small>
                </span>
            </div>
            <p className="has-text-weight-bold is-size-4" style={{ paddingLeft: '1.5rem' }}>
                {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>


            <div style={{ width: "100%" }}>
                <progress
                    className="progress is-medium"
                    value={limiteUtilizado}
                    max={sliderMax}
                    style={{
                        "--bulma-progress-bar-background-color": "#d3d3d3ff",
                        "--bulma-progress-value-background-color": progressClass,
                    } as React.CSSProperties}
                />
            </div>

            <hr />

            {/* Visão geral */}
            <div className="field">
                <label className="label is-size-5">Visão geral do mês</label>

                <div style={{ borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem', fontSize: '18px' }}>
                    {/* Receitas */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: '4px solid #00B96B',
                        paddingLeft: '0.5rem',
                        marginBottom: '0.5rem',
                    }}>
                        <span>Receitas</span>
                        <span style={{ color: '#00B96B', fontWeight: 'bold' }}>
                            {rendimentos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>

                    {/* Despesas */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: '4px solid #FF3838',
                        paddingLeft: '0.5rem',
                        marginBottom: '0.5rem',
                    }}>
                        <span>Despesas</span>
                        <span style={{ color: '#FF3838', fontWeight: 'bold' }}>
                            {despesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>

                    {/* Crédito */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderLeft: '4px solid #FF6E40',
                        paddingLeft: '0.5rem',
                    }}>
                        <span>Despesas no crédito</span>
                        <span style={{ color: '#FF3838', fontWeight: 'bold' }}>
                            {credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>
                </div>
            </div>

            <hr />

            {/* Orçamento disponível */}
            <div>
                <label className="label is-size-5">Orçamento disponível</label>
                <p>Diário: {dailyBudget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                <p>Semanal: {weeklyBudget.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
            </div>
        </div>
    );
};
