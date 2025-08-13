"use client";

import React, { useState } from "react";

export const FinancesPanel: React.FC = () => {
    // Initialized with fixed values
    const [rendimentos] = useState(6680);
    const [despesas] = useState(2887.95);
    const [credito] = useState(2820.07);
    
    const limiteUtilizado = despesas + credito
    const saldo = rendimentos - limiteUtilizado;
    const sliderMax = rendimentos > 0 ? rendimentos : 10000;

    return (
        <div>
            <div className="field">
                <span style={{ float: 'right', fontWeight: 'normal', fontSize: '1.5rem', color: '#888' }}>
                    Agosto
                </span>

                <label className="label is-size-5">Saldo Crédito</label>
                <p className="has-text-weight-bold is-size-4" style={{ paddingLeft: '1.5rem' }} >
                    {saldo.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>

                <progress
                    className="slider is-fullwidth"
                    value={limiteUtilizado}
                    max={sliderMax}
                    style={{
                        accentColor: saldo < 0 ? "red" : "green",
                    }}
                />
            </div>

            <hr />

            <div className="field">
                <label className="label is-size-5" >
                    Visão geral do mês
                </label>

                <div style={{ borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' , fontSize: '18px'}}>
                    {/* Receitas */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: '4px solid #00B96B', // green color vertical bar
                            paddingLeft: '0.5rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <span>Receitas</span>
                        <span style={{ color: '#00B96B', fontWeight: 'bold' }}>
                            {rendimentos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>

                    {/* Despesas */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: '4px solid #FF3838', // red color vertical bar
                            paddingLeft: '0.5rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <span>Despesas</span>
                        <span style={{ color: '#FF3838', fontWeight: 'bold' }}>
                            {despesas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>

                    {/* Despesas no crédito */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderLeft: '4px solid #FF6E40', // orange color vertical bar
                            paddingLeft: '0.5rem',
                        }}
                    >
                        <span>Despesas no crédito</span>
                        <span style={{ color: '#FF3838', fontWeight: 'bold' }}>
                            {/* Replace with your correct value here */}
                            {credito.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </span>
                    </div>
                </div>
            </div>

        </div>
    )
};
