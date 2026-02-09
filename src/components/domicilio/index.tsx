"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Panel } from "../common/panel"
import { DomicilePanel } from "../home/panel"
import { Layout } from "../layout"
import { getAuthRedirectDelay } from '@/lib/utils/config';

export const Domicilio: React.FC = () => {
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
        }, []);

    return (
        <Layout>

            <Panel title="Painel de Moradia">

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
            </ Panel>
        </Layout>
    )
}