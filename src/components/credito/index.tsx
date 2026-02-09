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
import { usePanelService, Purchase, CreateCreditCardRequest } from "@/lib/service";
import { Alert, Message } from "../common/message";
import { creditCardValidationSchema, CreditCardFormData } from "@/lib/validations";
import { Loader } from "../common/loader";
import { getAuthRedirectDelay } from '@/lib/utils/config';
import { useFormValidation } from '@/hooks/useFormValidation';

// helper
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });


export const CreditPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { getUserDetails, getInvoiceDetails, getCreditCardDetails, createCreditCard } = usePanelService();

  const [loading, setLoading] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [messages, setMessages] = useState<Array<Alert>>([]);

  // Real-time validation for credit card form
  const cardValidation = useFormValidation<CreditCardFormData>({
    validationSchema: creditCardValidationSchema,
    validateOnChange: true,
    validateOnBlur: true
  });

  // Modal state
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  // Credit card form state
  const [cardForm, setCardForm] = useState({
    bank: "",
    endNumbers: "",
    dueDate: 5,
    nickname: "",
    billingPeriodStart: 1,
    billingPeriodEnd: 30,
    totalLimit: 0,
  });

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

  const handleAddCard = async () => {
    setMessages([]);

    // Validate entire form
    const { errors: validationErrors, isValid } = await cardValidation.validateForm(cardForm);
    
    if (!isValid) {
      cardValidation.setFormErrors(validationErrors);
      return;
    }

    try {
      const cardData: CreateCreditCardRequest = {
        bank: cardForm.bank,
        endNumbers: cardForm.endNumbers,
        dueDate: cardForm.dueDate,
        nickname: cardForm.nickname,
        billingPeriodStart: cardForm.billingPeriodStart,
        billingPeriodEnd: cardForm.billingPeriodEnd,
        totalLimit: cardForm.totalLimit,
      };

      const success = await createCreditCard(cardData);
      if (success) {
        setMessages([{
          tipo: "success",
          texto: "Cartão adicionado com sucesso!"
        }]);
        setShowAddCardModal(false);
        // Reset form and validation
        setCardForm({
          bank: "",
          endNumbers: "",
          dueDate: 5,
          nickname: "",
          billingPeriodStart: 1,
          billingPeriodEnd: 30,
          totalLimit: 0,
        });
        cardValidation.resetValidation();
        // Reload cards
        window.location.reload();
      } else {
        setMessages([{
          tipo: "danger",
          texto: "Erro ao adicionar cartão. Tente novamente."
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
    }
  };

  // Handle card field change with real-time validation
  const handleCardFieldChange = async (field: keyof CreditCardFormData, value: string | number) => {
    const updatedForm = { ...cardForm, [field]: value };
    setCardForm(updatedForm);
    await cardValidation.handleFieldChange(field, value, updatedForm);
  };

  // Handle card field blur
  const handleCardFieldBlur = async (field: keyof CreditCardFormData, value: string | number) => {
    await cardValidation.handleFieldBlur(field, value);
  };

  useEffect(() => {
    const signed = localStorage.getItem("signed") === "true";
    if (!signed) {
      const delay = getAuthRedirectDelay();
      const timer = setTimeout(() => {
        router.replace("/login");
      }, delay);
      
      return () => clearTimeout(timer);
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

  if (loading || userLoading) {
    return (
      <Layout>
        <Panel>
          <div className="box">
            <Loader 
              size="large" 
              text="Carregando cartões..." 
              showSkeletons={true} 
            />
            <p className="has-text-centered has-text-grey-light is-size-7 mt-2">
              Aguarde enquanto buscamos seus dados
            </p>
          </div>
        </Panel>
      </Layout>
    );
  }
  

  return (
    <Layout>
      <Panel>
        {messages.map((msg, index) => (
          <Message
            key={index}
            texto={msg.texto}
            tipo={msg.tipo}
            field={msg.field ?? undefined}
          />
        ))}
        
        {/* Tabs */}
        <div className="box mb-5 p-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h3 className="title is-5 mb-0">Meus Cartões</h3>
            <button 
              className="button is-success is-small"
              onClick={() => setShowAddCardModal(true)}
              title="Adicionar novo cartão"
            >
              <span className="icon">
                <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>+</span>
              </span>
              <span className="is-hidden-mobile">Novo Cartão</span>
            </button>
          </div>
          
          <div className="tabs is-boxed is-medium" style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
            <ul style={{ flexWrap: "nowrap" }}>
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
              
              <div className="columns is-mobile is-multiline mt-4">
                <div className="column is-half-mobile is-one-third-tablet">
                  <p className="has-text-grey-light is-size-7 mb-1">Limite Total</p>
                  <p className="has-text-white is-size-5 has-text-weight-semibold">
                    {activeCard.totalLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="column is-half-mobile is-one-third-tablet">
                  <p className="has-text-grey-light is-size-7 mb-1">Disponível</p>
                  <p className="has-text-success is-size-5 has-text-weight-semibold">
                    {(activeCard.totalLimit - activeCard.usedLimit).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <div className="column is-half-mobile is-one-third-tablet">
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <h3 className="title is-6 mb-0">Fatura</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {activeCard?.invoices?.map(inv => (
                  <button
                    key={inv.id}
                    className={`button is-small ${inv.id === activeInvoice.id ? "is-info" : ""}`}
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
              <div className="box">
                <Loader size="small" text="Carregando compras..." />
              </div>
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

        {/* Add Credit Card Modal */}
        {showAddCardModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowAddCardModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "500px" }}>
              <header className="modal-card-head">
                <p className="modal-card-title">Adicionar Novo Cartão</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowAddCardModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                <div className="field">
                  <label className="label">Apelido do Cartão *</label>
                  <div className="control">
                    <input
                      className={`input ${cardValidation.errors?.nickname ? 'is-danger' : ''}`}
                      type="text"
                      placeholder="Ex: Gold, Platinum, Internacional"
                      value={cardForm.nickname}
                      onChange={(e) => handleCardFieldChange('nickname', e.target.value)}
                      onBlur={(e) => handleCardFieldBlur('nickname', e.target.value)}
                    />
                  </div>
                  {cardValidation.errors?.nickname && <p className="help is-danger">{cardValidation.errors.nickname}</p>}
                </div>

                <div className="field">
                  <label className="label">Banco *</label>
                  <div className="control">
                    <input
                      className={`input ${cardValidation.errors?.bank ? 'is-danger' : ''}`}
                      type="text"
                      placeholder="Ex: ITAU, BRADESCO, NUBANK"
                      value={cardForm.bank}
                      onChange={(e) => handleCardFieldChange('bank', e.target.value.toUpperCase())}
                      onBlur={(e) => handleCardFieldBlur('bank', e.target.value.toUpperCase())}
                    />
                  </div>
                  {cardValidation.errors?.bank && <p className="help is-danger">{cardValidation.errors.bank}</p>}
                </div>

                <div className="field">
                  <label className="label">Últimos 4 Dígitos *</label>
                  <div className="control">
                    <input
                      className={`input ${cardValidation.errors?.endNumbers ? 'is-danger' : ''}`}
                      type="text"
                      placeholder="1234"
                      maxLength={4}
                      value={cardForm.endNumbers}
                      onChange={(e) => handleCardFieldChange('endNumbers', e.target.value.replace(/\D/g, ''))}
                      onBlur={(e) => handleCardFieldBlur('endNumbers', e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                  {cardValidation.errors?.endNumbers && <p className="help is-danger">{cardValidation.errors.endNumbers}</p>}
                </div>

                <div className="field">
                  <label className="label">Limite Total *</label>
                  <div className="control">
                    <input
                      className={`input ${cardValidation.errors?.totalLimit ? 'is-danger' : ''}`}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={cardForm.totalLimit || ""}
                      onChange={(e) => handleCardFieldChange('totalLimit', Number(e.target.value))}
                      onBlur={(e) => handleCardFieldBlur('totalLimit', Number(e.target.value))}
                    />
                  </div>
                  {cardValidation.errors?.totalLimit && <p className="help is-danger">{cardValidation.errors.totalLimit}</p>}
                </div>

                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="label">Dia do Vencimento</label>
                      <div className="control">
                        <input
                          className={`input ${cardValidation.errors?.dueDate ? 'is-danger' : ''}`}
                          type="number"
                          min="1"
                          max="31"
                          value={cardForm.dueDate}
                          onChange={(e) => handleCardFieldChange('dueDate', Number(e.target.value))}
                          onBlur={(e) => handleCardFieldBlur('dueDate', Number(e.target.value))}
                        />
                      </div>
                      {cardValidation.errors?.dueDate && <p className="help is-danger">{cardValidation.errors.dueDate}</p>}
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Início do Período</label>
                      <div className="control">
                        <input
                          className={`input ${cardValidation.errors?.billingPeriodStart ? 'is-danger' : ''}`}
                          type="number"
                          min="1"
                          max="31"
                          value={cardForm.billingPeriodStart}
                          onChange={(e) => handleCardFieldChange('billingPeriodStart', Number(e.target.value))}
                          onBlur={(e) => handleCardFieldBlur('billingPeriodStart', Number(e.target.value))}
                        />
                      </div>
                      {cardValidation.errors?.billingPeriodStart && <p className="help is-danger">{cardValidation.errors.billingPeriodStart}</p>}
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Fim do Período</label>
                      <div className="control">
                        <input
                          className={`input ${cardValidation.errors?.billingPeriodEnd ? 'is-danger' : ''}`}
                          type="number"
                          min="1"
                          max="31"
                          value={cardForm.billingPeriodEnd}
                          onChange={(e) => handleCardFieldChange('billingPeriodEnd', Number(e.target.value))}
                          onBlur={(e) => handleCardFieldBlur('billingPeriodEnd', Number(e.target.value))}
                        />
                      </div>
                      {cardValidation.errors?.billingPeriodEnd && <p className="help is-danger">{cardValidation.errors.billingPeriodEnd}</p>}
                    </div>
                  </div>
                </div>
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <button 
                  className="button is-danger" 
                  onClick={() => setShowAddCardModal(false)}
                >
                  Cancelar
                </button>
                <button className="button is-success" onClick={handleAddCard}>
                  Adicionar
                </button>
              </footer>
            </div>
          </div>
        )}
      </Panel>
    </Layout>
  );
};
