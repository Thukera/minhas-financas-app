import { Layout } from "../layout"
import { FinancesPanel } from "./panel"

export const HomePage: React.FC = () => {
    return(
        <Layout titulo="Painel Financeiro">

            <FinancesPanel /> 

        </Layout>
    )
}