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
import { usePanelService, Purchase } from "@/lib/service";

// helper
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


export const CreditPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { getUserDetails, getInvoiceDetails, getCreditCardDetails } = usePanelService();

  const [loading, setLoading] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Filter invoices: 2 before current + current + 7 after (max 10)
  const filterInvoices = (invoices: Invoice[], currentInvoiceId: number): Invoice[] => {
    const currentIndex = invoices.findIndex(inv => inv.id === currentInvoiceId);
    if (currentIndex === -1) return invoices.slice(0, 10);
    
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(invoices.length, currentIndex + 8);
    return invoices.slice(start, end);
  };

  // Switch invoice and load purchases
  const handleInvoiceSwitch = async (invoice: Invoice) => {
    setActiveInvoice(invoice);
    await loadPurchases(invoice.id);
  };

  // Load purchases for invoice
  const loadPurchases = async (invoiceId: number) => {
    setLoadingPurchases(true);
    try {
      const details = await getInvoiceDetails(invoiceId);
      if (details?.purchases) {
        setPurchases(details.purchases);
      } else {
        setPurchases([]);
      }
    } catch (error) {
      console.error("Failed to load purchases", error);
      setPurchases([]);
    } finally {
      setLoadingPurchases(false);
    }
  };

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
          // Load each card's full details with invoices
          const cardsWithDetails = await Promise.all(
            data.creditcards.map(async (c: any) => {
              const cardDetails = await getCreditCardDetails(c.id);
              
              if (cardDetails) {
                // Convert backend invoice format to frontend format
                const backendInvoices: Invoice[] = cardDetails.invoices.map(inv => ({
                  id: inv.id,
                  startDate: "", // Backend doesn't provide this
                  endDate: "",   // Backend doesn't provide this
                  dueDate: inv.dueDate,
                  totalAmount: inv.totalAmount,
                  status: inv.status as "PENDING" | "CLOSED" | "PAID" | "OPEN"
                }));

                // Filter invoices based on currentInvoice
                const filteredInvoices = filterInvoices(backendInvoices, c.currentInvoice);
                
                return {
                  id: c.id,
                  nickname: c.nickname,
                  bank: c.bank,
                  endnumbers: cardDetails.endNumbers,
                  billingPeriodStart: cardDetails.billingPeriodStart,
                  billingPeriodEnd: cardDetails.billingPeriodEnd,
                  totalLimit: cardDetails.totalLimit,
                  dataCadastro: c.dataCadastro,
                  usedLimit: cardDetails.usedLimit,
                  billingPeriod: `${cardDetails.billingPeriodStart} → ${cardDetails.billingPeriodEnd}`,
                  userId: data.id!,
                  invoiceId: 0,
                  purchasesId: 0,
                  invoices: filteredInvoices,
                  currentInvoiceId: c.currentInvoice
                } as CreditCard;
              }
              
              return null;
            })
          );

          const cards = cardsWithDetails.filter(c => c !== null) as CreditCard[];
          
          console.log("Loaded credit cards:", cards);
          setCreditCards(cards);
          
          if (cards.length > 0) {
            setActiveCard(cards[0]);
            // Find and select currentInvoice
            const currentInv = cards[0].invoices?.find(inv => inv.id === cards[0].currentInvoiceId);
            if (currentInv) {
              setActiveInvoice(currentInv);
              await loadPurchases(currentInv.id);
            } else if (cards[0].invoices && cards[0].invoices.length > 0) {
              const firstInvoice = cards[0].invoices[0];
              setActiveInvoice(firstInvoice);
              await loadPurchases(firstInvoice.id);
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
        <div className="box  mb-5 p-5">
          <div className="tabs is-boxed is-medium">
            <ul>
              {creditCards.map((card) => (
                <li 
                key={card.id}
                className={activeCard?.id === card.id ? "is-active" : ""}
                onClick={() => {
                  setActiveCard(card);
                    if (card.invoices && card.invoices.length > 0) {
                      // Try to select currentInvoice first, otherwise first invoice
                      const currentInv = card.invoices.find(inv => inv.id === card.currentInvoiceId);
                      const invoiceToSelect = currentInv || card.invoices[0];
                      setActiveInvoice(invoiceToSelect);
                      loadPurchases(invoiceToSelect.id);
                    }
                  }}
                >
                  <a>
                    <span className="has-text-weight-semibold">{card.nickname}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Card Details inside tab */}
          {activeCard && (
            <>             
              <div className="columns is-vcentered mb-3">
                <div className="column">
                  <h2 className="title is-4 has-text-white mb-2">{activeCard.nickname}</h2>
                  <p className="subtitle is-6 has-text-grey-light mb-0">
                    {activeCard.bank} • Final {activeCard.endnumbers}
                  </p>
                </div>
              </div>
              
              <div className="columns is-mobile mt-4">
                <div className="column">
                  <p className="has-text-grey-light is-size-7 mb-1">Limite Total</p>
                  <p className="has-text-white is-size-5 has-text-weight-semibold">
                    {activeCard.totalLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="column">
                  <p className="has-text-grey-light is-size-7 mb-1">Disponível</p>
                  <p className="has-text-success is-size-5 has-text-weight-semibold">
                    {(activeCard.totalLimit - activeCard.usedLimit).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="column">
                  <p className="has-text-grey-light is-size-7 mb-1">Fechamento</p>
                  <p className="has-text-white is-size-5 has-text-weight-semibold">
                    Dia {activeCard.billingPeriodEnd}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* --- Pie Charts --- */}
        {activeCard && (
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
                    {inv.dueDate.slice(5, 7)}/{inv.dueDate.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
            <p>Vencimento: {activeInvoice.dueDate}</p>
            <p>Status: {activeInvoice.status}</p>

            {/* progress bar */}
            <p className="has-text-weight-bold is-size-4" style={{ paddingLeft: '1.5rem' }}>
              {(activeInvoice.totalAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
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
            {loadingPurchases ? (
              <p className="has-text-centered">Carregando compras...</p>
            ) : (
              <ResponsiveTable
                columns={[
                  { key: "descricao", label: "DESCRIÇÃO" },
                  { key: "valor", label: "VALOR", render: (v) => formatCurrency(v) },
                  { key: "parcela", label: "Parcelas" },
                  { key: "vencimento", label: "VENCIMENTO" },
                  { key: "classificacao", label: "CATEGORIA" },
                ]}
                items={purchases.map(p => ({
                  descricao: p.descricao,
                  valor: p.installment ? p.installment.value : p.value,
                  parcela: p.installment 
                    ? `${p.installment.currentInstallment}/${p.installment.totalInstallment}` 
                    : "-",
                  vencimento: activeInvoice?.dueDate || "-",
                  classificacao: "-" // Add classification later if available
                }))}
                calcTotal={(items) => items.reduce((sum, i) => sum + (i.valor ?? 0), 0)}
                highlightPaid={false}
                showPaidColumn={false}
              />
            )}
          </div>
        </div>
      </Panel>
    </Layout>
  );
};
