import { Layout } from "../layout"
import { DomicilePanel, FinancesPanel } from "./panel"
import { Panel } from "../common/panel"
import { RecurrentPaymentsPanel } from "./panel/recurrent"

export const HomePage: React.FC = () => {
    return (
        <Layout >
            <Panel title="Painel Financeiro">
                <FinancesPanel />
            </Panel>

            <Panel title="Recorrentes">

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

                <hr />
                <RecurrentPaymentsPanel
                    titulo="Pagamentos Recorrentes"
                    sections={[
                        {
                            titulo: "Débito Automático",
                            items: [
                                { descricao: "TIM", valor: 100.99, vencimento: "10/07/2025", pago: true },
                            ],
                        },
                        {
                            titulo: "Agendados",
                            items: [
                                { descricao: "SEGURO CARTAO", valor: 5.37, vencimento: "15/06/2025", status: "agendado" },
                                { descricao: "CURSO", valor: 500.0, vencimento: "10/06/2025" },
                            ],
                        },
                        {
                            titulo: "Cartões",
                            items: [
                                { descricao: "ITAU Gold", valor: 1048.48, vencimento: "10/06/2025", pago: true },
                                { descricao: "ITAU Platinum", valor: 3355.28, vencimento: "10/05/2025", pago: true },
                                { descricao: "NUBANK", valor: 1969.76, vencimento: "10/05/2025" },
                            ],
                        },
                    ]}
                />


            </Panel>

            <Panel title="Outro Painel">
                another panel
            </Panel>
        </Layout>
    )
}