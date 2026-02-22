import { AxiosError, AxiosResponse } from "axios";
import { httpClient } from "../http";
import { User } from "../models/user";
import { CreditCard } from "../models/user/creditcard";
import { getDB } from "../db";
import { addToSyncQueue } from "../sync";

const userPanelEndpoint: string = "api/panel";
const invoiceDetailsEndpoint: string = "api/creditcard/invoice";
const creditCardEndpoint: string = "api/creditcard";
const creditCardPurchaseEndpoint: string = "api/creditcard/purchase";

export interface CategoryPanel {
    category: string;
    value: number;
}

export interface CreditPanel {
    usedLimit: number;
    totalLimit: number;
    totalInstallments: number;
    paydInstallments: number;
    categoryPanel: CategoryPanel[];
}

export interface InvoiceDetails {
    invoiceId: number;
    startDate: string;
    endDate: string;
    dueDate: string;
    status: string;
    totalAmount: number;
    estimateLimit?: number | null;
    creditcard: {
        id: number;
        nickname: string;
    };
    creditPanel: CreditPanel;
    purchases: Purchase[];
}

export interface Purchase {
    purchaseId: number;
    descricao: string;
    value: number;
    purchaseDateTime: string;
    category: string;
    installment?: {
        installmentId: number;
        currentInstallment: number;
        totalInstallment: number;
        value: number;
    } | null;
}

export interface PurchaseCategory {
    purchaseClassId: number;
    name: string;
    editable: boolean;
    repeat: boolean;
}

export interface InstallmentInvoice {
    invoiceId: number;
    status: string;
    dueDate: string;
}

export interface PurchaseInstallment {
    installmentId: number;
    currentInstallment: number;
    totalInstallment: number;
    value: number;
    invoice: InstallmentInvoice;
}

export interface PurchaseDetails {
    purchaseId: number;
    descricao: string;
    hasIinstallment: boolean;
    value: number;
    purchaseDateTime: string;
    category: PurchaseCategory;
    invoice: InstallmentInvoice | null;
    installmentPayd: number | null;
    installments: PurchaseInstallment[];
}

export interface CreditCardDetails {
    cardId: number;
    user: any;
    bank: string;
    nickname: string;
    endNumbers: string;
    dueDate: number;
    billingPeriodStart: number;
    billingPeriodEnd: number;
    usedLimit: number;
    totalLimit: number;
    cadastro: string;
    invoices: {
        id: number;
        dueDate: string;
        totalAmount: number;
        status: string;
    }[];
}

export interface CreatePurchaseRequest {
    descricao: string;
    creditCardId: number;
    totalInstallments: number;
    category: string;
    purchaseDateTime: string;
    value: number;
}

export interface CreateSubscriptionRequest {
    descricao: string;
    creditCardId: number;
    totalInstallments: number;
    category: string;
    value: number;
}

export interface CreateCreditCardRequest {
    bank: string;
    endNumbers: string;
    dueDate: number;
    nickname: string;
    billingPeriodStart: number;
    billingPeriodEnd: number;
    totalLimit: number;
}

export interface UpdateCreditCardRequest {
    bank: string;
    endNumbers: string;
    dueDate: number;
    nickname: string;
    billingPeriodStart: number;
    billingPeriodEnd: number;
    estimateLimitForinvoices: number;
    totalLimit: number;
}

export const usePanelService = () => {

    const getUserDetails = async (): Promise<User | null> => {
        const db = await getDB();
        
        try {
            // Buscar do cache local primeiro
            const cachedUser = await db.get('user', 'current');
            
            if (cachedUser && !navigator.onLine) {
                // Offline: retorna dado local
                console.log('📦 Usuário carregado do cache (offline)');
                return cachedUser.data as User;
            }
            
            // Se online, tentar atualizar da API
            if (navigator.onLine) {
                try {
                    const response = await httpClient.get(userPanelEndpoint);
                    const userData = response.data as User;
                    
                    // Salvar no cache
                    await db.put('user', {
                        id: 'current',
                        data: userData,
                        synced: true,
                        updatedAt: new Date().toISOString(),
                    });
                    
                    console.log('✅ Usuário atualizado da API');
                    return userData;
                } catch (error) {
                    const statusCode = (error as AxiosError)?.response?.status;
                    if (statusCode === 401 || statusCode === 403) {
                        localStorage.removeItem("signed");
                        return null;
                    }
                    
                    // API falhou, retorna cache
                    console.warn('⚠️ API falhou, usando cache');
                    return cachedUser?.data as User || null;
                }
            }
            
            return cachedUser?.data as User || null;
        } catch (error) {
            console.error("Failed to get user details", error);
            return null;
        }
    };

    const getInvoiceDetails = async (invoiceId: number): Promise<InvoiceDetails | null> => {
        const db = await getDB();
        
        try {
            // Buscar do cache local primeiro
            const cachedInvoice = await db.get('invoices', invoiceId);
            
            if (cachedInvoice && !navigator.onLine) {
                // Offline: retorna dado local
                console.log(`📦 Fatura #${invoiceId} carregada do cache (offline)`);
                return cachedInvoice as unknown as InvoiceDetails;
            }
            
            // Se online, tentar atualizar da API
            if (navigator.onLine) {
                try {
                    const response = await httpClient.get(`${invoiceDetailsEndpoint}/${invoiceId}`);
                    const invoiceData = response.data as InvoiceDetails;
                    
                    // Salvar no cache
                    await db.put('invoices', {
                        ...invoiceData,
                        synced: true,
                        updatedAt: new Date().toISOString(),
                    });
                    
                    console.log(`✅ Fatura #${invoiceId} atualizada da API`);
                    return invoiceData;
                } catch (error) {
                    // API falhou, retorna cache
                    console.warn(`⚠️ API falhou para fatura #${invoiceId}, usando cache`);
                    return cachedInvoice as unknown as InvoiceDetails || null;
                }
            }
            
            return cachedInvoice as unknown as InvoiceDetails || null;
        } catch (error) {
            console.error("Failed to get invoice details", error);
            return null;
        }
    };

    const getCreditCardDetails = async (cardId: number): Promise<CreditCardDetails | null> => {
        try {
            const response = await httpClient.get(`${creditCardEndpoint}/${cardId}`);
            return response.data as CreditCardDetails;
        } catch (error) {
            console.error("Failed to get credit card details", error);
            return null;
        }
    };

    const createCreditCardPurchase = async (purchaseData: CreatePurchaseRequest): Promise<boolean> => {
        const db = await getDB();
        
        try {
            // 1. Salvar LOCAL primeiro (client-first)
            const tempId = Date.now(); // ID temporário único
            const localPurchase = {
                purchaseId: tempId,
                descricao: purchaseData.descricao,
                value: purchaseData.value,
                purchaseDateTime: purchaseData.purchaseDateTime,
                category: purchaseData.category,
                creditCardId: purchaseData.creditCardId,
                totalInstallments: purchaseData.totalInstallments,
                synced: false,
                updatedAt: new Date().toISOString(),
            };
            
            await db.put('purchases', localPurchase);
            console.log(`📥 Compra salva localmente: #${tempId}`);
            
            // 2. Adicionar à fila de sync
            await addToSyncQueue(
                'CREATE',
                'purchase',
                creditCardPurchaseEndpoint,
                purchaseData
            );
            
            // 3. Tentar enviar se online
            if (navigator.onLine) {
                try {
                    await httpClient.post(creditCardPurchaseEndpoint, purchaseData);
                    // Marcar como synced
                    await db.put('purchases', { ...localPurchase, synced: true });
                    console.log(`✅ Compra sincronizada: #${tempId}`);
                } catch (error) {
                    // Falhará silenciosamente, será sincronizado depois
                    console.log('⏳ Compra salva, sync pendente');
                }
            } else {
                console.log('📵 Compra salva offline, será sincronizada quando voltar online');
            }
            
            return true;
        } catch (error) {
            console.error("Failed to create credit card purchase", error);
            return false;
        }
    };

    const createCreditCardSubscription = async (subscriptionData: CreateSubscriptionRequest): Promise<boolean> => {
        try {
            await httpClient.post(creditCardPurchaseEndpoint, subscriptionData);
            return true;
        } catch (error) {
            console.error("Failed to create credit card subscription", error);
            return false;
        }
    };

    const createCreditCard = async (cardData: CreateCreditCardRequest): Promise<boolean> => {
        try {
            await httpClient.post(creditCardEndpoint, cardData);
            return true;
        } catch (error) {
            console.error("Failed to create credit card", error);
            return false;
        }
    };

    const updateInvoiceEstimateLimit = async (invoiceId: number, estimateLimit: number): Promise<boolean> => {
        try {
            await httpClient.put(`${invoiceDetailsEndpoint}/${invoiceId}`, {
                estimateLimit
            });
            return true;
        } catch (error) {
            console.error("Failed to update invoice estimate limit", error);
            return false;
        }
    };

    const changeInvoiceStatus = async (invoiceId: number, newStatus: string): Promise<boolean> => {
        try {
            await httpClient.put(`${invoiceDetailsEndpoint}/change-status/${invoiceId}/${newStatus}`);
            return true;
        } catch (error) {
            console.error("Failed to change invoice status", error);
            return false;
        }
    };

    const getPurchaseDetails = async (purchaseId: number): Promise<PurchaseDetails | null> => {
        try {
            const response = await httpClient.get(`${creditCardPurchaseEndpoint}/${purchaseId}`);
            return response.data as PurchaseDetails;
        } catch (error) {
            console.error("Failed to get purchase details", error);
            return null;
        }
    };

    const updatePurchase = async (purchaseId: number, purchaseData: Omit<CreatePurchaseRequest, 'purchaseDateTime'>): Promise<boolean> => {
        const db = await getDB();
        
        try {
            // 1. Atualizar localmente primeiro
            const localPurchase = await db.get('purchases', purchaseId);
            if (localPurchase) {
                await db.put('purchases', {
                    ...localPurchase,
                    descricao: purchaseData.descricao,
                    value: purchaseData.value,
                    category: purchaseData.category,
                    totalInstallments: purchaseData.totalInstallments,
                    synced: false,
                    updatedAt: new Date().toISOString(),
                });
            }
            
            // 2. Adicionar à fila de sync
            await addToSyncQueue(
                'UPDATE',
                'purchase',
                `${creditCardPurchaseEndpoint}/update/${purchaseId}`,
                purchaseData
            );
            
            // 3. Tentar enviar se online
            if (navigator.onLine) {
                try {
                    await httpClient.put(`${creditCardPurchaseEndpoint}/update/${purchaseId}`, purchaseData);
                    if (localPurchase) {
                        await db.put('purchases', { ...localPurchase, synced: true });
                    }
                    console.log(`✅ Compra #${purchaseId} atualizada e sincronizada`);
                } catch (error) {
                    console.log(`⏳ Compra #${purchaseId} atualizada localmente, sync pendente`);
                }
            }
            
            return true;
        } catch (error) {
            console.error("Failed to update purchase", error);
            return false;
        }
    };

    const updateCreditCard = async (cardId: number, cardData: UpdateCreditCardRequest): Promise<boolean> => {
        try {
            await httpClient.put(`${creditCardEndpoint}/${cardId}`, cardData);
            return true;
        } catch (error) {
            console.error("Failed to update credit card", error);
            return false;
        }
    };

    const deletePurchase = async (purchaseId: number): Promise<boolean> => {
        const db = await getDB();
        
        try {
            // 1. Deletar localmente primeiro
            await db.delete('purchases', purchaseId);
            console.log(`🗑️ Compra #${purchaseId} deletada localmente`);
            
            // 2. Adicionar à fila de sync
            await addToSyncQueue(
                'DELETE',
                'purchase',
                `${creditCardPurchaseEndpoint}/delete/${purchaseId}`,
                {}
            );
            
            // 3. Tentar enviar se online
            if (navigator.onLine) {
                try {
                    await httpClient.post(`${creditCardPurchaseEndpoint}/delete/${purchaseId}`, {});
                    console.log(`✅ Compra #${purchaseId} deletada e sincronizada`);
                } catch (error) {
                    console.log(`⏳ Compra #${purchaseId} deletada localmente, sync pendente`);
                }
            }
            
            return true;
        } catch (error) {
            console.error("Failed to delete purchase", error);
            return false;
        }
    };

    return {
        getUserDetails,
        getInvoiceDetails,
        getCreditCardDetails,
        createCreditCardPurchase,
        createCreditCardSubscription,
        createCreditCard,
        updateInvoiceEstimateLimit,
        changeInvoiceStatus,
        getPurchaseDetails,
        updatePurchase,
        updateCreditCard,
        deletePurchase
    }
}
