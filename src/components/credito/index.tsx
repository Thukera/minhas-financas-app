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
import { usePanelService, Purchase, CreateCreditCardRequest, UpdateCreditCardRequest, CreditPanel, PurchaseDetails, CreatePurchaseRequest } from "@/lib/service";
import { Alert, Message } from "../common/message";
import { creditCardValidationSchema, CreditCardFormData } from "@/lib/validations";
import { Loader } from "../common/loader";
import { MoneyInput } from "../common/moneyinput";
import { getAuthRedirectDelay } from '@/lib/utils/config';
import { useFormValidation } from '@/hooks/useFormValidation';

// helper
const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Helper function to generate colors for categories
const getCategoryColor = (index: number): string => {
  const colors = [
    "#fbc658", "#36a2eb", "#ff6384", "#4bc0c0", 
    "#9966ff", "#ff9f40", "#ffcd56", "#c9cbcf"
  ];
  return colors[index % colors.length];
};


export const CreditPage: React.FC = () => {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { getUserDetails, getInvoiceDetails, getCreditCardDetails, createCreditCard, updateInvoiceEstimateLimit, changeInvoiceStatus, getPurchaseDetails, createCreditCardPurchase, updatePurchase, updateCreditCard, deletePurchase } = usePanelService();

  const [loading, setLoading] = useState(true);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [activeCard, setActiveCard] = useState<CreditCard | null>(null);
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [messages, setMessages] = useState<Array<Alert>>([]);
  const [plannedValue, setPlannedValue] = useState<number>(0);
  const [creditPanel, setCreditPanel] = useState<CreditPanel | null>(null);

  // Modal-specific messages
  const [cardFormMessages, setCardFormMessages] = useState<Array<Alert>>([]);
  const [editCardMessages, setEditCardMessages] = useState<Array<Alert>>([]);
  const [plannedValueMessages, setPlannedValueMessages] = useState<Array<Alert>>([]);
  const [statusMessages, setStatusMessages] = useState<Array<Alert>>([]);
  const [purchaseFormMessages, setPurchaseFormMessages] = useState<Array<Alert>>([]);
  const [deleteConfirmMessages, setDeleteConfirmMessages] = useState<Array<Alert>>([]);

  // Real-time validation for credit card form
  const cardValidation = useFormValidation<CreditCardFormData>({
    validationSchema: creditCardValidationSchema,
    validateOnChange: true,
    validateOnBlur: true
  });

  // Modal state
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showEditCardModal, setShowEditCardModal] = useState(false);
  const [showPlannedValueModal, setShowPlannedValueModal] = useState(false);
  const [tempPlannedValue, setTempPlannedValue] = useState<number>(0);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [showPurchaseDetailsModal, setShowPurchaseDetailsModal] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [loadingPurchaseDetails, setLoadingPurchaseDetails] = useState(false);
  const [showPurchaseFormModal, setShowPurchaseFormModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingPurchaseId, setDeletingPurchaseId] = useState<number | null>(null);

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

  // Edit credit card form state
  const [editCardForm, setEditCardForm] = useState({
    bank: "",
    endNumbers: "",
    dueDate: 5,
    nickname: "",
    billingPeriodStart: 1,
    billingPeriodEnd: 30,
    estimateLimitForinvoices: 0,
    totalLimit: 0,
  });

  // Purchase form state
  const [purchaseForm, setPurchaseForm] = useState({
    descricao: "",
    creditCardId: 0,
    totalInstallments: 1,
    category: "",
    purchaseDateTime: new Date().toISOString().slice(0, 16),
    value: 0,
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
        setCreditPanel(details.creditPanel || null);
        // Set planned value from backend estimateLimit or fall back to totalAmount
        setPlannedValue(details.estimateLimit ?? details.totalAmount);
      } else {
        setPurchases([]);
        setCreditPanel(null);
        setPlannedValue(0);
      }
    } catch (error) {
      console.error("Failed to load purchases", error);
      setPurchases([]);
      setCreditPanel(null);
      setPlannedValue(0);
    } finally {
      setLoadingPurchases(false);
    }
  };

  const handleAddCard = async () => {
    setCardFormMessages([]);

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
        setCardFormMessages([{
          tipo: "success",
          texto: "Cartão adicionado com sucesso! A página será recarregada."
        }]);
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
        // Reload cards after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setCardFormMessages([{
          tipo: "danger",
          texto: "Erro ao adicionar cartão. Tente novamente."
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setCardFormMessages([{
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

  // Handle open edit card modal
  const handleOpenEditCard = () => {
    if (!activeCard) return;
    
    setEditCardForm({
      bank: activeCard.bank,
      endNumbers: activeCard.endnumbers,
      dueDate: activeCard.billingPeriodEnd, // Using billingPeriodEnd as dueDate based on backend
      nickname: activeCard.nickname,
      billingPeriodStart: activeCard.billingPeriodStart,
      billingPeriodEnd: activeCard.billingPeriodEnd,
      estimateLimitForinvoices: 0, // Default value, user will set
      totalLimit: activeCard.totalLimit,
    });
    setEditCardMessages([]);
    setShowEditCardModal(true);
  };

  // Handle edit card
  const handleEditCard = async () => {
    if (!activeCard) return;
    
    setEditCardMessages([]);

    try {
      const cardData: UpdateCreditCardRequest = {
        bank: editCardForm.bank,
        endNumbers: editCardForm.endNumbers,
        dueDate: editCardForm.dueDate,
        nickname: editCardForm.nickname,
        billingPeriodStart: editCardForm.billingPeriodStart,
        billingPeriodEnd: editCardForm.billingPeriodEnd,
        estimateLimitForinvoices: editCardForm.estimateLimitForinvoices,
        totalLimit: editCardForm.totalLimit,
      };

      const success = await updateCreditCard(activeCard.id, cardData);
      if (success) {
        setEditCardMessages([{
          tipo: "success",
          texto: "Cartão atualizado com sucesso! A página será recarregada."
        }]);
        // Reload page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setEditCardMessages([{
          tipo: "danger",
          texto: "Erro ao atualizar cartão. Tente novamente."
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setEditCardMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
    }
  };

  // Handle update planned value
  const handleUpdatePlannedValue = async () => {
    if (!activeInvoice) return;
    
    setPlannedValueMessages([]);
    
    try {
      const success = await updateInvoiceEstimateLimit(activeInvoice.id, tempPlannedValue);
      if (success) {
        setPlannedValue(tempPlannedValue);
        setPlannedValueMessages([{
          tipo: "success",
          texto: "Valor planejado atualizado com sucesso!"
        }]);
      } else {
        setPlannedValueMessages([{
          tipo: "danger",
          texto: "Erro ao atualizar valor planejado. Tente novamente."
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setPlannedValueMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
    }
  };

  // Handle change invoice status
  const handleChangeStatus = async () => {
    if (!activeInvoice || !selectedStatus) return;
    
    setStatusMessages([]);
    
    try {
      const success = await changeInvoiceStatus(activeInvoice.id, selectedStatus);
      if (success) {
        setStatusMessages([{
          tipo: "success",
          texto: "Status da fatura atualizado com sucesso!"
        }]);
        // Update local invoice status
        setActiveInvoice({ ...activeInvoice, status: selectedStatus as any });
        // Reload to get fresh data
        await loadPurchases(activeInvoice.id);
      } else {
        setStatusMessages([{
          tipo: "danger",
          texto: "Erro ao alterar status. Tente novamente."
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
    }
  };

  // Handle view purchase details
  const handleViewPurchaseDetails = async (purchaseId: number) => {
    setLoadingPurchaseDetails(true);
    setShowPurchaseDetailsModal(true);
    setPurchaseDetails(null);
    
    try {
      const details = await getPurchaseDetails(purchaseId);
      if (details) {
        setPurchaseDetails(details);
      } else {
        setMessages([{
          tipo: "danger",
          texto: "Erro ao carregar detalhes da compra."
        }]);
        setShowPurchaseDetailsModal(false);
      }
    } catch (err: any) {
      console.error(err);
      setMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
      setShowPurchaseDetailsModal(false);
    } finally {
      setLoadingPurchaseDetails(false);
    }
  };

  // Handle open purchase form for create
  const handleOpenCreatePurchase = () => {
    setIsEditMode(false);
    setEditingPurchaseId(null);
    setPurchaseForm({
      descricao: "",
      creditCardId: activeCard?.id || 0,
      totalInstallments: 1,
      category: "",
      purchaseDateTime: new Date().toISOString().slice(0, 16),
      value: 0,
    });
    setPurchaseFormMessages([]);
    setShowPurchaseFormModal(true);
  };

  // Handle open purchase form for edit
  const handleOpenEditPurchase = () => {
    if (!purchaseDetails) return;
    
    setIsEditMode(true);
    setEditingPurchaseId(purchaseDetails.purchaseId);
    setPurchaseForm({
      descricao: purchaseDetails.descricao,
      creditCardId: activeCard?.id || 0,
      totalInstallments: purchaseDetails.installments.length || 1,
      category: purchaseDetails.category.name,
      purchaseDateTime: new Date(purchaseDetails.purchaseDateTime).toISOString().slice(0, 16),
      value: purchaseDetails.value,
    });
    setPurchaseFormMessages([]);
    setShowPurchaseDetailsModal(false);
    setShowPurchaseFormModal(true);
  };

  // Handle submit purchase form (create or update)
  const handleSubmitPurchaseForm = async () => {
    setPurchaseFormMessages([]);
    
    if (!purchaseForm.descricao || !purchaseForm.category || purchaseForm.value <= 0) {
      setPurchaseFormMessages([{
        tipo: "warning",
        texto: "Por favor, preencha todos os campos obrigatórios"
      }]);
      return;
    }

    try {
      if (isEditMode && editingPurchaseId) {
        // Update existing purchase
        const updateData = {
          descricao: purchaseForm.descricao,
          creditCardId: purchaseForm.creditCardId,
          totalInstallments: purchaseForm.totalInstallments,
          category: purchaseForm.category,
          value: purchaseForm.value,
        };
        
        const success = await updatePurchase(editingPurchaseId, updateData);
        if (success) {
          setPurchaseFormMessages([{
            tipo: "success",
            texto: "Compra atualizada com sucesso!"
          }]);
          // Reload purchases
          if (activeInvoice) {
            await loadPurchases(activeInvoice.id);
          }
        } else {
          setPurchaseFormMessages([{
            tipo: "danger",
            texto: "Erro ao atualizar compra. Tente novamente."
          }]);
        }
      } else {
        // Create new purchase
        const purchaseData: CreatePurchaseRequest = {
          descricao: purchaseForm.descricao,
          creditCardId: purchaseForm.creditCardId,
          totalInstallments: purchaseForm.totalInstallments,
          category: purchaseForm.category,
          purchaseDateTime: new Date(purchaseForm.purchaseDateTime).toISOString(),
          value: purchaseForm.value,
        };

        const success = await createCreditCardPurchase(purchaseData);
        if (success) {
          setPurchaseFormMessages([{
            tipo: "success",
            texto: "Compra cadastrada com sucesso!"
          }]);
          // Reload purchases
          if (activeInvoice) {
            await loadPurchases(activeInvoice.id);
          }
        } else {
          setPurchaseFormMessages([{
            tipo: "danger",
            texto: "Erro ao cadastrar compra. Tente novamente."
          }]);
        }
      }
    } catch (err: any) {
      console.error(err);
      setPurchaseFormMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
    }
  };

  // Handle open delete confirmation
  const handleOpenDeleteConfirm = () => {
    if (!purchaseDetails) return;
    
    setDeletingPurchaseId(purchaseDetails.purchaseId);
    setDeleteConfirmMessages([]);
    setShowPurchaseDetailsModal(false);
    setShowDeleteConfirmModal(true);
  };

  // Handle delete purchase
  const handleDeletePurchase = async () => {
    if (!deletingPurchaseId) return;
    
    setDeleteConfirmMessages([]);
    
    try {
      const success = await deletePurchase(deletingPurchaseId);
      if (success) {
        setDeleteConfirmMessages([{
          tipo: "success",
          texto: "Compra excluída com sucesso!"
        }]);
        // Reload purchases after brief delay to show success message
        setTimeout(async () => {
          if (activeInvoice) {
            await loadPurchases(activeInvoice.id);
          }
          setShowDeleteConfirmModal(false);
          setDeletingPurchaseId(null);
        }, 1500);
      } else {
        setDeleteConfirmMessages([{
          tipo: "danger",
          texto: "Erro ao excluir compra. Tente novamente."
        }]);
      }
    } catch (err: any) {
      console.error(err);
      setDeleteConfirmMessages([{
        tipo: "danger",
        texto: "Um erro inesperado aconteceu, tente novamente mais tarde."
      }]);
    }
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
              onClick={() => {
                setCardFormMessages([]);
                setShowAddCardModal(true);
              }}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 className="title is-4 has-text-white mb-2">{activeCard.nickname}</h2>
                      <p className="subtitle is-6 has-text-grey-light mb-0">
                        {activeCard.bank} • Final {activeCard.endnumbers}
                      </p>
                    </div>
                    <button 
                      className="button is-small is-warning"
                      onClick={handleOpenEditCard}
                      title="Editar cartão"
                    >
                      <span className="icon">
                        <span>✏️</span>
                      </span>
                      <span className="is-hidden-mobile">Editar</span>
                    </button>
                  </div>
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
        {activeCard && creditPanel && (
          <div className="columns mt-4">
            <div className="column has-text-centered">
              <PieChart
                data={[
                  { 
                    title: "Utilizado", 
                    value: creditPanel.usedLimit, 
                    color: "#eb1212ff" 
                  },
                  { 
                    title: "Disponível", 
                    value: Math.max(creditPanel.totalLimit - creditPanel.usedLimit, 0), 
                    color: "#54eb36ff" 
                  },
                ]}
                lineWidth={25}
                style={{ maxWidth: "360px", margin: "30px" }}
                animate={true}
                //label={({ dataEntry }) => `${dataEntry.title}: ${formatCurrency(dataEntry.value)}`}
                labelStyle={{
                  fontSize: "5px",
                  fill: "#fff",
                }}
                labelPosition={70}
              />
              <p className="mt-2 has-text-weight-semibold">Limite Total</p>
              <div className="is-size-7 has-text-grey-light" style={{ maxWidth: "250px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span 
                      style={{ 
                        width: "10px", 
                        height: "10px", 
                        backgroundColor: "#eb1212ff",
                        display: "inline-block",
                        marginRight: "0.5rem",
                        borderRadius: "2px"
                      }}
                    />
                    Utilizado
                  </span>
                  <span>{formatCurrency(creditPanel.usedLimit)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span 
                      style={{ 
                        width: "10px", 
                        height: "10px", 
                        backgroundColor: "#54eb36ff",
                        display: "inline-block",
                        marginRight: "0.5rem",
                        borderRadius: "2px"
                      }}
                    />
                    Disponível
                  </span>
                  <span>{formatCurrency(Math.max(creditPanel.totalLimit - creditPanel.usedLimit, 0))}</span>
                </div>
              </div>
            </div>

            <div className="column has-text-centered">
              {creditPanel.categoryPanel && creditPanel.categoryPanel.length > 0 ? (
                <>
                  <PieChart
                    data={creditPanel.categoryPanel.map((cat, index) => ({
                      title: cat.category,
                      value: cat.value,
                      color: getCategoryColor(index),
                    }))}
                    lineWidth={25}
                    style={{ maxWidth: "360px", margin: "30px" }}
                    animate={true}
                    //label={({ dataEntry }) => `${dataEntry.title}: ${formatCurrency(dataEntry.value)}`}
                    labelStyle={{
                      fontSize: "5px",
                      fill: "#fff",
                    }}
                    labelPosition={70}
                  />
                  <p className="mt-2 has-text-weight-semibold">Categorias</p>
                  <div className="is-size-7 has-text-grey-light" style={{ maxWidth: "250px", margin: "0 auto" }}>
                    {creditPanel.categoryPanel.map((cat, index) => (
                      <div key={index} style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                          <span 
                            style={{ 
                              width: "10px", 
                              height: "10px", 
                              backgroundColor: getCategoryColor(index),
                              display: "inline-block",
                              marginRight: "0.5rem",
                              borderRadius: "2px"
                            }}
                          />
                          {cat.category}
                        </span>
                        <span>{formatCurrency(cat.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="has-text-grey-light">
                  <p>Sem dados de categorias</p>
                </div>
              )}
            </div>

            <div className="column has-text-centered">
              <PieChart
                data={[
                  { 
                    title: "Pagas", 
                    value: creditPanel.paydInstallments, 
                    color: "#36a2eb" 
                  },
                  { 
                    title: "Pendentes", 
                    value: Math.max(creditPanel.totalInstallments - creditPanel.paydInstallments, 0), 
                    color: "#ff6384" 
                  },
                ]}
                lineWidth={25}
                style={{ maxWidth: "360px", margin: "30px" }}
                animate={true}
                //label={({ dataEntry }) => `${dataEntry.title}: ${formatCurrency(dataEntry.value)}`}
                labelStyle={{
                  fontSize: "5px",
                  fill: "#fff",
                }}
                labelPosition={70}
              />
              <p className="mt-2 has-text-weight-semibold">Parcelas</p>
              <div className="is-size-7 has-text-grey-light" style={{ maxWidth: "250px", margin: "0 auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span 
                      style={{ 
                        width: "10px", 
                        height: "10px", 
                        backgroundColor: "#36a2eb",
                        display: "inline-block",
                        marginRight: "0.5rem",
                        borderRadius: "2px"
                      }}
                    />
                    Pagas
                  </span>
                  <span>{formatCurrency(creditPanel.paydInstallments)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0" }}>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    <span 
                      style={{ 
                        width: "10px", 
                        height: "10px", 
                        backgroundColor: "#ff6384",
                        display: "inline-block",
                        marginRight: "0.5rem",
                        borderRadius: "2px"
                      }}
                    />
                    Pendentes
                  </span>
                  <span>{formatCurrency(Math.max(creditPanel.totalInstallments - creditPanel.paydInstallments, 0))}</span>
                </div>
              </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.5rem" }}>
              <div>
                <p>Vencimento: {activeInvoice.dueDate}</p>
                <p>Status: {activeInvoice.status}</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button 
                  className="button is-small is-info"
                  onClick={() => {
                    setTempPlannedValue(plannedValue || activeInvoice.totalAmount);
                    setPlannedValueMessages([]);
                    setShowPlannedValueModal(true);
                  }}
                  title="Definir valor planejado"
                >
                  <span className="icon">
                    <span style={{ fontSize: "1rem" }}>💰</span>
                  </span>
                  <span>Valor Planejado</span>
                </button>
                <button 
                  className="button is-small is-warning"
                  onClick={() => {
                    setSelectedStatus(activeInvoice.status);
                    setStatusMessages([]);
                    setShowStatusModal(true);
                  }}
                  title="Alterar status da fatura"
                >
                  <span className="icon">
                    <span style={{ fontSize: "1rem" }}>🔄</span>
                  </span>
                  <span>Alterar Status</span>
                </button>
              </div>
            </div>

            {/* progress bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingLeft: '1.5rem', paddingRight: '1.5rem' }}>
              <p className="has-text-weight-bold is-size-4">
                {(activeInvoice.totalAmount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </p>
              <p className="has-text-grey is-size-6">
                {plannedValue > 0 ? formatCurrency(plannedValue) : "Sem limite"}
              </p>
            </div>
            <div style={{ width: "100%" }}>
              <progress
                className="progress is-medium"
                value={activeInvoice.totalAmount}
                max={plannedValue > 0 ? plannedValue : activeInvoice.totalAmount}
                style={{
                  "--bulma-progress-bar-background-color": "#d3d3d3ff",
                  "--bulma-progress-value-background-color": activeInvoice.totalAmount > plannedValue ? "#ff3860" : "#36a2eb",
                } as React.CSSProperties}
              />
            </div>
          </div>
        )}

        {/* --- Invoice / Extrato --- */}
        <hr />
        <div className="table-container mt-5">
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h2 className="subtitle is-size-6 mb-0">Extrato</h2>
              <button 
                className="button is-success is-small"
                onClick={handleOpenCreatePurchase}
                title="Adicionar nova compra"
              >
                <span className="icon">
                  <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>+</span>
                </span>
                <span className="is-hidden-mobile">Nova Compra</span>
              </button>
            </div>
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
                  { 
                    key: "acoes", 
                    label: "AÇÕES",
                    render: (_v, item: any) => (
                      <button 
                        className="button is-small is-info"
                        onClick={() => handleViewPurchaseDetails(item.purchaseId)}
                        title="Ver detalhes"
                      >
                        <span className="icon">
                          <span>👁️</span>
                        </span>
                      </button>
                    )
                  },
                ]}
                items={purchases.map(p => ({
                  purchaseId: p.purchaseId,
                  descricao: p.descricao,
                  valor: p.installment ? p.installment.value : p.value,
                  parcela: p.installment 
                    ? `${p.installment.currentInstallment}/${p.installment.totalInstallment}` 
                    : "-",
                  vencimento: activeInvoice?.dueDate || "-",
                  classificacao: p.category || "-",
                  acoes: null
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
                {cardFormMessages.map((msg, index) => (
                  <Message
                    key={index}
                    texto={msg.texto}
                    tipo={msg.tipo}
                    field={msg.field ?? undefined}
                  />
                ))}
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

                <MoneyInput
                  id="card-total-limit"
                  label="Limite Total *"
                  value={cardForm.totalLimit}
                  onChange={(value) => {
                    handleCardFieldChange('totalLimit', value);
                  }}
                  onBlur={() => handleCardFieldBlur('totalLimit', cardForm.totalLimit)}
                  error={cardValidation.errors?.totalLimit}
                  placeholder="0,00"
                />

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

        {/* Edit Credit Card Modal */}
        {showEditCardModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowEditCardModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "500px" }}>
              <header className="modal-card-head">
                <p className="modal-card-title">Editar Cartão</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowEditCardModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                {editCardMessages.map((msg, index) => (
                  <Message
                    key={index}
                    texto={msg.texto}
                    tipo={msg.tipo}
                    field={msg.field ?? undefined}
                  />
                ))}
                <div className="field">
                  <label className="label">Apelido do Cartão *</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      placeholder="Ex: Gold, Platinum, Internacional"
                      value={editCardForm.nickname}
                      onChange={(e) => setEditCardForm({ ...editCardForm, nickname: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Banco *</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      placeholder="Ex: ITAU, BRADESCO, NUBANK"
                      value={editCardForm.bank}
                      onChange={(e) => setEditCardForm({ ...editCardForm, bank: e.target.value.toUpperCase() })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Últimos 4 Dígitos *</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      placeholder="1234"
                      maxLength={4}
                      value={editCardForm.endNumbers}
                      onChange={(e) => setEditCardForm({ ...editCardForm, endNumbers: e.target.value.replace(/\D/g, '') })}
                    />
                  </div>
                </div>

                <MoneyInput
                  id="edit-card-total-limit"
                  label="Limite Total *"
                  value={editCardForm.totalLimit}
                  onChange={(value) => setEditCardForm({ ...editCardForm, totalLimit: value })}
                  placeholder="0,00"
                />

                <MoneyInput
                  id="edit-card-estimate-limit"
                  label="Limite Estimado para Faturas"
                  value={editCardForm.estimateLimitForinvoices}
                  onChange={(value) => setEditCardForm({ ...editCardForm, estimateLimitForinvoices: value })}
                  placeholder="0,00"
                />
                <p className="help">Valor estimado de limite para uso em faturas</p>

                <div className="columns">
                  <div className="column">
                    <div className="field">
                      <label className="label">Dia do Vencimento</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="31"
                          value={editCardForm.dueDate}
                          onChange={(e) => setEditCardForm({ ...editCardForm, dueDate: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Início do Período</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="31"
                          value={editCardForm.billingPeriodStart}
                          onChange={(e) => setEditCardForm({ ...editCardForm, billingPeriodStart: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="column">
                    <div className="field">
                      <label className="label">Fim do Período</label>
                      <div className="control">
                        <input
                          className="input"
                          type="number"
                          min="1"
                          max="31"
                          value={editCardForm.billingPeriodEnd}
                          onChange={(e) => setEditCardForm({ ...editCardForm, billingPeriodEnd: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <button 
                  className="button is-danger" 
                  onClick={() => setShowEditCardModal(false)}
                >
                  Cancelar
                </button>
                <button className="button is-success" onClick={handleEditCard}>
                  Atualizar
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Planned Value Modal */}
        {showPlannedValueModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowPlannedValueModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "400px" }}>
              <header className="modal-card-head">
                <p className="modal-card-title">Definir Valor Planejado</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowPlannedValueModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                {plannedValueMessages.map((msg, index) => (
                  <Message
                    key={index}
                    texto={msg.texto}
                    tipo={msg.tipo}
                    field={msg.field ?? undefined}
                  />
                ))}
                <MoneyInput
                  id="planned-value"
                  label="Valor Planejado"
                  value={tempPlannedValue}
                  onChange={(value) => setTempPlannedValue(value)}
                  placeholder="Ex: 1.500,00"
                />
                <p className="help">Defina o valor que você planeja gastar nesta fatura</p>
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <button 
                  className="button is-danger" 
                  onClick={() => setShowPlannedValueModal(false)}
                >
                  Cancelar
                </button>
                <button className="button is-success" onClick={handleUpdatePlannedValue}>
                  Salvar
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Change Status Modal */}
        {showStatusModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowStatusModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "400px" }}>
              <header className="modal-card-head">
                <p className="modal-card-title">Alterar Status da Fatura</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowStatusModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                {statusMessages.map((msg, index) => (
                  <Message
                    key={index}
                    texto={msg.texto}
                    tipo={msg.tipo}
                    field={msg.field ?? undefined}
                  />
                ))}
                <div className="field">
                  <label className="label">Selecione o novo status</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="has-text-dark"
                      >
                        <option value="OPEN">OPEN - Aberta</option>
                        <option value="CLOSED">CLOSED - Fechada</option>
                        <option value="PENDING">PENDING - Pendente</option>
                        <option value="PAID">PAID - Paga</option>
                      </select>
                    </div>
                  </div>
                  <p className="help">Altere o status atual da fatura</p>
                </div>
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <button 
                  className="button is-danger" 
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancelar
                </button>
                <button className="button is-success" onClick={handleChangeStatus}>
                  Confirmar
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Purchase Details Modal */}
        {showPurchaseDetailsModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowPurchaseDetailsModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "600px" }}>
              <header className="modal-card-head">
                <p className="modal-card-title">Detalhes da Compra</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowPurchaseDetailsModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                {loadingPurchaseDetails ? (
                  <Loader size="small" text="Carregando detalhes..." />
                ) : purchaseDetails ? (
                  <div>
                    {/* Purchase Info */}
                    <div className="mb-4">
                      <h3 className="title is-5">{purchaseDetails.descricao}</h3>
                      <p className="subtitle is-6 has-text-grey">
                        {new Date(purchaseDetails.purchaseDateTime).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div className="columns is-mobile mb-4">
                      <div className="column">
                        <p className="has-text-grey-light is-size-7 mb-1">Valor Total</p>
                        <p className="has-text-weight-bold is-size-5">
                          {formatCurrency(purchaseDetails.value)}
                        </p>
                      </div>
                      <div className="column">
                        <p className="has-text-grey-light is-size-7 mb-1">Categoria</p>
                        <p className="has-text-weight-bold is-size-5">
                          {purchaseDetails.category.name}
                        </p>
                      </div>
                    </div>

                    {/* Installments Section */}
                    {purchaseDetails.hasIinstallment && purchaseDetails.installments.length > 0 ? (
                      <div>
                        <hr />
                        <h4 className="title is-6 mb-3">Parcelas</h4>
                        
                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                            <span className="is-size-7 has-text-weight-semibold">
                              Pago: {formatCurrency(purchaseDetails.installmentPayd || 0)}
                            </span>
                            <span className="is-size-7 has-text-grey">
                              Total: {formatCurrency(purchaseDetails.value)}
                            </span>
                          </div>
                          <progress
                            className="progress is-success"
                            value={purchaseDetails.installmentPayd || 0}
                            max={purchaseDetails.value}
                          />
                        </div>

                        {/* Installments List */}
                        <div className="table-container">
                          <table className="table is-fullwidth is-striped">
                            <thead>
                              <tr>
                                <th>Parcela</th>
                                <th>Valor</th>
                                <th>Vencimento</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {purchaseDetails.installments.map((inst) => (
                                <tr key={inst.installmentId}>
                                  <td>{inst.currentInstallment}/{inst.totalInstallment}</td>
                                  <td>{formatCurrency(inst.value)}</td>
                                  <td>{inst.invoice.dueDate}</td>
                                  <td>
                                    <span className={`tag ${
                                      inst.invoice.status === 'PAID' ? 'is-success' :
                                      inst.invoice.status === 'OPEN' ? 'is-info' :
                                      inst.invoice.status === 'CLOSED' ? 'is-warning' :
                                      'is-light'
                                    }`}>
                                      {inst.invoice.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* No Installments - Just Invoice Info */
                      purchaseDetails.invoice && (
                        <div>
                          <hr />
                          <h4 className="title is-6 mb-3">Fatura</h4>
                          <div className="box">
                            <div className="columns is-mobile">
                              <div className="column">
                                <p className="has-text-grey-light is-size-7 mb-1">Vencimento</p>
                                <p className="has-text-weight-semibold">
                                  {purchaseDetails.invoice.dueDate}
                                </p>
                              </div>
                              <div className="column">
                                <p className="has-text-grey-light is-size-7 mb-1">Status</p>
                                <p>
                                  <span className={`tag ${
                                    purchaseDetails.invoice.status === 'PAID' ? 'is-success' :
                                    purchaseDetails.invoice.status === 'OPEN' ? 'is-info' :
                                    purchaseDetails.invoice.status === 'CLOSED' ? 'is-warning' :
                                    'is-light'
                                  }`}>
                                    {purchaseDetails.invoice.status}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="has-text-grey">Não foi possível carregar os detalhes da compra.</p>
                )}
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button 
                    className="button is-warning"
                    onClick={handleOpenEditPurchase}
                  >
                    <span className="icon">
                      <span>✏️</span>
                    </span>
                    <span>Editar</span>
                  </button>
                  <button 
                    className="button is-danger"
                    onClick={handleOpenDeleteConfirm}
                  >
                    <span className="icon">
                      <span>🗑️</span>
                    </span>
                    <span>Excluir</span>
                  </button>
                </div>
                <button 
                  className="button" 
                  onClick={() => setShowPurchaseDetailsModal(false)}
                >
                  Fechar
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Purchase Form Modal (Create/Edit) */}
        {showPurchaseFormModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowPurchaseFormModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "500px" }}>
              <header className="modal-card-head">
                <p className="modal-card-title">{isEditMode ? "Editar Compra" : "Nova Compra Crédito"}</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowPurchaseFormModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                {purchaseFormMessages.map((msg, index) => (
                  <Message
                    key={index}
                    texto={msg.texto}
                    tipo={msg.tipo}
                    field={msg.field ?? undefined}
                  />
                ))}
                <div className="field">
                  <label className="label">Descrição *</label>
                  <div className="control">
                    <input
                      className="input"
                      type="text"
                      placeholder="Ex: iPhone 15"
                      value={purchaseForm.descricao}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, descricao: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Cartão de Crédito *</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={purchaseForm.creditCardId}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, creditCardId: Number(e.target.value) })}
                        disabled={isEditMode}
                      >
                        {creditCards.map((card) => (
                          <option key={card.id} value={card.id}>
                            {card.nickname} - {card.bank}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <MoneyInput
                  id="purchase-value"
                  label="Valor *"
                  value={purchaseForm.value}
                  onChange={(value) => setPurchaseForm({ ...purchaseForm, value })}
                  placeholder="0,00"
                />

                <div className="field">
                  <label className="label">Parcelas</label>
                  <div className="control">
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={purchaseForm.totalInstallments}
                      onChange={(e) => setPurchaseForm({ ...purchaseForm, totalInstallments: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label">Categoria *</label>
                  <div className="control">
                    <div className="select is-fullwidth">
                      <select
                        value={purchaseForm.category}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, category: e.target.value })}
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="Assinatura">Assinatura</option>
                        <option value="Games">Games</option>
                        <option value="Eletrônicos">Eletrônicos</option>
                        <option value="Alimentação">Alimentação</option>
                        <option value="Vestuário">Vestuário</option>
                        <option value="Saúde">Saúde</option>
                        <option value="Transporte">Transporte</option>
                        <option value="Educação">Educação</option>
                        <option value="Lazer">Lazer</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                  </div>
                </div>

                {!isEditMode && (
                  <div className="field">
                    <label className="label">Data e Hora da Compra *</label>
                    <div className="control">
                      <input
                        className="input"
                        type="datetime-local"
                        value={purchaseForm.purchaseDateTime}
                        onChange={(e) => setPurchaseForm({ ...purchaseForm, purchaseDateTime: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <button 
                  className="button is-danger" 
                  onClick={() => setShowPurchaseFormModal(false)}
                >
                  Cancelar
                </button>
                <button className="button is-success" onClick={handleSubmitPurchaseForm}>
                  {isEditMode ? "Atualizar" : "Salvar"}
                </button>
              </footer>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirmModal && (
          <div className="modal is-active">
            <div className="modal-background" onClick={() => setShowDeleteConfirmModal(false)}></div>
            <div className="modal-card" style={{ maxWidth: "450px" }}>
              <header className="modal-card-head has-background-danger">
                <p className="modal-card-title has-text-white">Confirmar Exclusão</p>
                <button 
                  className="delete" 
                  aria-label="close" 
                  onClick={() => setShowDeleteConfirmModal(false)}
                ></button>
              </header>
              <section className="modal-card-body">
                {deleteConfirmMessages.map((msg, index) => (
                  <Message
                    key={index}
                    texto={msg.texto}
                    tipo={msg.tipo}
                    field={msg.field ?? undefined}
                  />
                ))}
                <div className="notification is-warning is-light">
                  <p className="has-text-weight-semibold mb-3">
                    <span className="icon-text">
                      <span className="icon">
                        <span>⚠️</span>
                      </span>
                      <span>Atenção!</span>
                    </span>
                  </p>
                  <p>Você tem certeza que deseja excluir esta compra?</p>
                  <p className="mt-2">Esta ação não pode ser desfeita.</p>
                </div>
                {purchaseDetails && (
                  <div className="box mt-4">
                    <p className="has-text-weight-semibold">{purchaseDetails.descricao}</p>
                    <p className="has-text-grey">
                      Valor: {purchaseDetails.value.toLocaleString("pt-BR", { 
                        style: "currency", 
                        currency: "BRL" 
                      })}
                    </p>
                    <p className="has-text-grey is-size-7">
                      Data: {new Date(purchaseDetails.purchaseDateTime).toLocaleString("pt-BR")}
                    </p>
                  </div>
                )}
              </section>
              <footer className="modal-card-foot is-justify-content-space-between">
                <button 
                  className="button" 
                  onClick={() => setShowDeleteConfirmModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className="button is-danger"
                  onClick={handleDeletePurchase}
                >
                  <span className="icon">
                    <span>🗑️</span>
                  </span>
                  <span>Confirmar Exclusão</span>
                </button>
              </footer>
            </div>
          </div>
        )}
      </Panel>
    </Layout>
  );
};
