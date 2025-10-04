"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "../common/panel";
import { Layout } from "../layout";
import { CreditCard , Invoice} from "@/lib/models/credit/card";
import ResponsiveTable from "@/components/common/table";
import "./tabs.css";
import { PieChart } from "react-minimal-pie-chart";
import { useUser } from "@/context/userContext";
import { usePanelService } from "@/lib/service";

// helper
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mocked items for extrato
const allItems = [
  { descricao: "Compra - Mercado Livre", valor: 120, parcela: "-", vencimento: "01/10/2025", classificacao: "Compras" },
  { descricao: "Assinatura - Spotify", valor: 19.9, parcela: "-", vencimento: "05/10/2025", classificacao: "Serviços" },
  { descricao: "Restaurante - Outback", valor: 85.5, parcela: "-", vencimento: "10/10/2025", classificacao: "Alimentação" },
];

// Mock invoices for development
const mockInvoices: Invoice[] = [
  { id: 1, startDate: "2025-09-10", endDate: "2025-10-09", dueDate: "2025-10-05", totalAmount: 1297.50, status: "PENDING" },
  { id: 2, startDate: "2025-08-10", endDate: "2025-09-09", dueDate: "2025-09-05", totalAmount: 1580.00, status: "CLOSED" },
  { id: 3, startDate: "2025-07-10", endDate: "2025-08-09", dueDate: "2025-08-05", totalAmount: 1120.00, status: "CLOSED" },
];

export const CreditPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { getUserDetails } = usePanelService();

  const [loading, setLoading] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Switch invoice
  const handleInvoiceSwitch = (invoice: Invoice) => setActiveInvoice(invoice);

  useEffect(() => {
    const signed = localStorage.getItem("signed") === "true";
    if (!signed) {
      router.replace("/login");
      return;
    }

    const loadCards = async () => {
      try {
        const data = await getUserDetails();
        if (data?.creditcards) {
          const cards: CreditCard[] = data.creditcards.map((c: any) => ({
            id: c.id,
            nickname: c.nickname,
            bank: c.bank,
            endnumbers: c.endnumbers,
            billingPeriodStart: c.billingPeriodStart,
            billingPeriodEnd: c.billingPeriodEnd,
            totalLimit: c.totalLimit,
            dataCadastro: c.dataCadastro,
            usedLimit: 0,
            billingPeriod: `${c.billingPeriodStart} → ${c.billingPeriodEnd}`,
            userId: data.id!,
            invoiceId: 0,
            purchasesId: 0,
            invoices: c.invoices?.length ? c.invoices : mockInvoices, // use mock if none
          }));

          console.log("Loaded credit cards:", cards);
          setCreditCards(cards);
          if (cards.length > 0) {
            setActiveCard(cards[0]);
            if (cards[0].invoices && cards[0].invoices.length > 0) {
              setActiveInvoice(cards[0].invoices[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load user credit cards", err);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [user]);

  if (loading || userLoading) return <p className="has-text-centered p-4">Carregando cartões...</p>;

  return (
    <Layout>
      <Panel>
        {/* Tabs */}
        <div className="tabs is-boxed is-medium">
          <ul>
            {creditCards.map((card) => (
              <li
                key={card.id}
                className={activeCard?.id === card.id ? "is-active" : ""}
                onClick={() => {
                  setActiveCard(card);
                  if (card.invoices && card.invoices.length > 0) setActiveInvoice(card.invoices[0]);
                }}
              >
                <a>
                  <span>{card.nickname}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* --- Card Summary + Pie Charts --- */}
        {activeCard && (
          <>
            <div className="box has-background-dark has-text-white mb-5 p-5">
              <h2 className="title is-5">{activeCard.nickname}</h2>
              <p>{activeCard.bank} • Final {activeCard.endnumbers}</p>
              <p>Limite total: {activeCard.totalLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
              <p>Fechamento: {activeCard.billingPeriodEnd}</p>
            </div>

            <div className="columns mt-4">
              <div className="column has-text-centered">
                <PieChart
                  data={[
                    { title: "Used", value: activeCard.usedLimit, color: "#eb1212ff" },
                    { title: "Available", value: Math.max(activeCard.totalLimit - activeCard.usedLimit, 0), color: "#54eb36ff" },
                  ]}
                  lineWidth={25}
                  style={{ maxWidth: "360px", margin: "30px" }}
                  animate={true}
                />
                <p className="mt-2">Limite</p>
              </div>

              <div className="column has-text-centered">
                <PieChart
                  data={[
                    { title: "Categoria1", value: 2000, color: "#fbc658" },
                    { title: "Categoria2", value: 3000, color: "#36a2eb" },
                  ]}
                  lineWidth={25}
                  style={{ maxWidth: "360px", margin: "30px" }}
                  animate={true}
                />
                <p className="mt-2">Categorias</p>
              </div>

              <div className="column has-text-centered">
                <PieChart
                  data={[
                    { title: "Pagas", value: 2, color: "#36a2eb" },
                    { title: "Pendentes", value: 1, color: "#ff6384" },
                  ]}
                  lineWidth={25}
                  style={{ maxWidth: "360px", margin: "30px" }}
                  animate={true}
                />
                <p className="mt-2">Parcelas pagas</p>
              </div>
            </div>
          </>
        )}

        {/* --- Invoice Section --- */}
        {activeInvoice && (
          <div className="box mb-5">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 className="title is-6">Fatura</h3>
              <div>
                {activeCard?.invoices?.map(inv => (
                  <button
                    key={inv.id}
                    className={`button is-small mr-2 ${inv.id === activeInvoice.id ? "is-info" : ""}`}
                    onClick={() => handleInvoiceSwitch(inv)}
                  >
                    {inv.startDate.slice(5, 7)}/{inv.startDate.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
            <p>Período: {activeInvoice.startDate} → {activeInvoice.endDate}</p>
            <p>Vencimento: {activeInvoice.dueDate}</p>
            <p>Status: {activeInvoice.status}</p>
            <p>Total: {activeInvoice.totalAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>

            {/* progress bar */}
            <p className="has-text-weight-bold is-size-4" style={{ paddingLeft: '1.5rem' }}>
              {(activeInvoice.totalAmount / 2).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
            <div style={{ width: "100%" }}>
              <progress
                className="progress is-medium"
                value={activeInvoice.totalAmount / 2}
                max={activeInvoice.totalAmount}
                style={{
                  "--bulma-progress-bar-background-color": "#d3d3d3ff",
                  "--bulma-progress-value-background-color": "#36a2eb",
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* --- Invoice / Extrato --- */}
        <hr />
        <div className="table-container mt-5">
          <div style={{ marginBottom: "2rem" }}>
            <h2 className="subtitle is-size-6">Extrato</h2>
            <ResponsiveTable
              columns={[
                { key: "descricao", label: "DESCRIÇÃO" },
                { key: "valor", label: "VALOR", render: (v) => formatCurrency(v) },
                { key: "parcela", label: "Parcelas" },
                { key: "vencimento", label: "VENCIMENTO" },
                { key: "classificacao", label: "CATEGORIA" },
              ]}
              items={allItems}
              calcTotal={(items) => items.reduce((sum, i) => sum + (i.valor ?? 0), 0)}
              highlightPaid={false}
              showPaidColumn={false}
            />
          </div>
        </div>
      </Panel>
    </Layout>
  );
};
