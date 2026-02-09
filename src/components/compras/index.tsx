"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "../common/panel";
import { Layout } from "../layout";
import { CreditCard, Wallet, RefreshCw, Home, Repeat } from "lucide-react";
import { usePanelService, CreatePurchaseRequest, CreateSubscriptionRequest } from "@/lib/service";
import { useUser } from "@/context/userContext";
import { Alert, Message } from "../common/message";
import { getAuthRedirectDelay } from '@/lib/utils/config';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, onSave }) => {
  if (!isOpen) return null;

  return (
    <div className="modal is-active">
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{title}</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">{children}</section>
        <footer className="modal-card-foot">
          <button className="button is-dark" onClick={onSave}>Salvar</button>
          <button className="button is-dark is-outlined" onClick={onClose}>
            Cancelar
          </button>
        </footer>
      </div>
    </div>
  );
};

export const ComprasPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<Alert>>([]);
  const { user } = useUser();
  const { getUserDetails, createCreditCardPurchase, createCreditCardSubscription } = usePanelService();

  // State for credit cards
  const [creditCards, setCreditCards] = useState<Array<{ id: number; nickname: string; bank: string }>>([]);

  // Form state for credit purchase
  const [purchaseForm, setPurchaseForm] = useState({
    descricao: "",
    creditCardId: 0,
    totalInstallments: 1,
    category: "",
    purchaseDateTime: new Date().toISOString().slice(0, 16),
    value: 0,
  });

  // Form state for subscription
  const [subscriptionForm, setSubscriptionForm] = useState({
    descricao: "",
    creditCardId: 0,
    totalInstallments: 1,
    category: "Assinatura",
    value: 0,
  });

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
      loadCreditCards();
    }
  }, [router]);

  const loadCreditCards = async () => {
    const userData = await getUserDetails();
    if (userData?.creditcards) {
      setCreditCards(userData.creditcards);
      if (userData.creditcards.length > 0) {
        setPurchaseForm(prev => ({ ...prev, creditCardId: userData.creditcards[0].id }));
        setSubscriptionForm(prev => ({ ...prev, creditCardId: userData.creditcards[0].id }));
      }
    }
  };

  const handlePurchaseSubmit = async () => {
    if (!purchaseForm.descricao || !purchaseForm.category || purchaseForm.value <= 0) {
      setMessages([{
        tipo: "warning",
        texto: "Por favor, preencha todos os campos obrigatórios"
      }]);
      return;
    }

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
      setMessages([{
        tipo: "success",
        texto: "Compra cadastrada com sucesso!"
      }]);
      closeModal();
      // Reset form
      setPurchaseForm({
        descricao: "",
        creditCardId: creditCards[0]?.id || 0,
        totalInstallments: 1,
        category: "",
        purchaseDateTime: new Date().toISOString().slice(0, 16),
        value: 0,
      });
    } else {
      setMessages([{
        tipo: "danger",
        texto: "Erro ao cadastrar compra. Tente novamente."
      }]);
    }
  };

  const handleSubscriptionSubmit = async () => {
    if (!subscriptionForm.descricao || subscriptionForm.value <= 0) {
      setMessages([{
        tipo: "warning",
        texto: "Por favor, preencha todos os campos obrigatórios"
      }]);
      return;
    }

    const subscriptionData: CreateSubscriptionRequest = {
      descricao: subscriptionForm.descricao,
      creditCardId: subscriptionForm.creditCardId,
      totalInstallments: 1,
      category: "Assinatura",
      value: subscriptionForm.value,
    };

    const success = await createCreditCardSubscription(subscriptionData);
    if (success) {
      setMessages([{
        tipo: "success",
        texto: "Assinatura cadastrada com sucesso!"
      }]);
      closeModal();
      // Reset form
      setSubscriptionForm({
        descricao: "",
        creditCardId: creditCards[0]?.id || 0,
        totalInstallments: 1,
        category: "Assinatura",
        value: 0,
      });
    } else {
      setMessages([{
        tipo: "danger",
        texto: "Erro ao cadastrar assinatura. Tente novamente."
      }]);
    }
  };

  const options = [
    {
      id: "credito",
      title: "Nova Compra Crédito",
      description: "Adicionar uma nova compra no cartão de crédito",
      icon: CreditCard,
      color: "is-link",
    },
    {
      id: "assinatura",
      title: "Adicionar Assinatura no Crédito",
      description: "Adicionar uma assinatura recorrente no cartão de crédito",
      icon: Repeat,
      color: "is-primary",
    },
    {
      id: "debito",
      title: "Nova Compra Débito",
      description: "Adicionar uma nova compra no débito",
      icon: Wallet,
      color: "is-info",
    },
    {
      id: "recorrente",
      title: "Nova Despesa Recorrente",
      description: "Adicionar uma despesa que se repete mensalmente",
      icon: RefreshCw,
      color: "is-warning",
    },
    {
      id: "residencia",
      title: "Nova Conta Residência",
      description: "Adicionar uma nova conta de moradia",
      icon: Home,
      color: "is-success",
    },
  ];

  const openModal = (modalId: string) => {
    setActiveModal(modalId);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="section">
          <div className="container has-text-centered">
            <progress className="progress is-small is-primary" max="100">
              Loading...
            </progress>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Panel title="Compras e Despesas">
        <div className="section">
          <div className="container">
            {messages.map((msg, index) => (
              <Message
                key={index}
                texto={msg.texto}
                tipo={msg.tipo}
                field={msg.field ?? undefined}
              />
            ))}
            
            <div className="columns is-multiline">
              {options.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.id} className="column is-half">
                    <div
                      className={`box has-background-white-ter  is-clickable`}
                      onClick={() => openModal(option.id)}
                      style={{
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <div className="media">
                        <div className="media-left">
                          <span className={`icon is-large has-text-${option.color.replace("is-", "")}`}>
                            <Icon size={48} />
                          </span>
                        </div>
                        <div className="media-content">
                          <p className="title is-4 has-text-grey">{option.title}</p>
                          <p className="subtitle is-6">{option.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      {/* Modals */}
      <Modal
        isOpen={activeModal === "credito"}
        onClose={closeModal}
        title="Nova Compra Crédito"
        onSave={handlePurchaseSubmit}
      >
        <div className="content">
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

          <div className="field">
            <label className="label">Valor *</label>
            <div className="control">
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchaseForm.value || ""}
                onChange={(e) => setPurchaseForm({ ...purchaseForm, value: Number(e.target.value) })}
              />
            </div>
          </div>

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
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "assinatura"}
        onClose={closeModal}
        title="Adicionar Assinatura no Crédito"
        onSave={handleSubscriptionSubmit}
      >
        <div className="content">
          <div className="field">
            <label className="label">Descrição *</label>
            <div className="control">
              <input
                className="input"
                type="text"
                placeholder="Ex: Netflix, Spotify, etc."
                value={subscriptionForm.descricao}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, descricao: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label className="label">Cartão de Crédito *</label>
            <div className="control">
              <div className="select is-fullwidth">
                <select
                  value={subscriptionForm.creditCardId}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, creditCardId: Number(e.target.value) })}
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

          <div className="field">
            <label className="label">Valor Mensal *</label>
            <div className="control">
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={subscriptionForm.value || ""}
                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, value: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="notification is-info is-light">
            <p><strong>Categoria:</strong> Assinatura</p>
            <p className="is-size-7 mt-2">
              Esta assinatura será cobrada mensalmente no cartão selecionado.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "debito"}
        onClose={closeModal}
        title="Nova Compra Débito"
      >
        <div className="content">
          <p>Formulário para adicionar uma nova compra no débito será implementado aqui.</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "recorrente"}
        onClose={closeModal}
        title="Nova Despesa Recorrente"
      >
        <div className="content">
          <p>Formulário para adicionar uma despesa recorrente será implementado aqui.</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === "residencia"}
        onClose={closeModal}
        title="Nova Conta Residência"
      >
        <div className="content">
          <p>Formulário para adicionar uma conta de residência será implementado aqui.</p>
        </div>
      </Modal>
    </Layout>
  );
};
