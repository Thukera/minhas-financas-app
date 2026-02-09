'use client';
import { useEffect, useState } from 'react';
import { Layout } from "../layout"
import { DomicilePanel, FinancesPanel } from "./panel"
import { Panel } from "../common/panel"
import { RecurrentPaymentsPanel } from "./panel/recurrent"
import { useRouter } from 'next/navigation';
import { Loader } from '../common/loader';
import { getAuthRedirectDelay } from '@/lib/utils/config';


interface HomePageProps {
    signed: boolean;
}

export const HomePage: React.FC = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const signed = localStorage.getItem("signed") === "true";
        if (!signed) {
            const delay = getAuthRedirectDelay();
            const timer = setTimeout(() => {
                router.replace("/login");
            }, delay);
            
            return () => clearTimeout(timer);
        } else {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <Layout>
                <Panel>
                    <div className="box">
                        <Loader size="medium" text="Verificando autenticação..." />
                    </div>
                </Panel>
            </Layout>
        );
    }
    
    // render home page content
    return (
        <Layout>
            <Panel title="Painel Financeiro">
                <FinancesPanel />
            </Panel>
            <Panel title="Despesas">
                <DomicilePanel
                    titulo="Residência"
                    items={[
                        { conta: "Aluguel Quinto Andar", valor: 1719.02, vencimento: "07/07/2025", pago: true, responsavel: { name: "", avatarUrl: "/user.png" } },
                        { conta: "Condominio", valor: 543.09, vencimento: "10/07/2025", responsavel: { name: "Thuk", avatarUrl: "/user.png" } },
                        { conta: "Luz", vencimento: "27/07/2025", responsavel: { name: "Thuk", avatarUrl: "/user.png" } },
                        { conta: "Gas", valor: 291.88, vencimento: "10/07/2025", pago: true, responsavel: { name: "Thuk", avatarUrl: "/user.png" } },
                        { conta: "NET AP", valor: 111.79, vencimento: "10/07/2025", pago: true, responsavel: { name: "Thuk", avatarUrl: "/user.png" } },
                    ]}
                />
            </Panel>
            <Panel title="Recorrentes">
                <RecurrentPaymentsPanel
                    titulo="Pagamentos Recorrentes"
                    sections={[
                        {
                            titulo: "Boleto",
                            items: [
                                { descricao: "TIM", valor: 100.99, vencimento: "10/07/2025", pago: true },
                                { descricao: "CURSO", valor: 500.0, vencimento: "10/06/2025", },
                            ],
                        },
                        {
                            titulo: "Débito Automático",
                            items: [
                                { descricao: "SEGURO CARTAO", valor: 5.37, vencimento: "15/06/2025", status: "agendado" },
                            ],
                        },
                        {
                            titulo: "DETRAN",
                            items: [
                                { descricao: "IPVA", valor: 5.37, vencimento: "15/06/2025", status: "agendado" },
                            ],
                        }
                    ]}
                />
            </Panel>
            <Panel title="Crédito">
                <RecurrentPaymentsPanel sections={[
                    {
                        titulo: "Cartões de Crédito",
                        items: [
                            { descricao: "ITAU Gold", valor: 1048.48, vencimento: "10/06/2025", pago: true },
                            { descricao: "ITAU Platinum", valor: 3355.28, vencimento: "10/05/2025", pago: true },
                            { descricao: "NUBANK", valor: 1969.76, vencimento: "10/05/2025" },
                        ],
                    },
                ]} />
            </Panel>
        </Layout>
    )
}
