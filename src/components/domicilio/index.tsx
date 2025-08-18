"use client";

import { Panel } from "../common/panel"
import { DomicilePanel } from "../home/panel"
import { Layout } from "../layout"

export const Domicilio: React.FC = () => {
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