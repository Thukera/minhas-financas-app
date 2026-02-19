import { AxiosError, AxiosResponse } from "axios";
import { httpClient } from "../http";
import { User } from "../models/user";
import { CreditCard } from "../models/user/creditcard";

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
        try {
            const response = await httpClient.get(userPanelEndpoint);
            return response.data as User;
        } catch (error) {
            console.error("Failed to get user details", error);

            const statusCode = (error as AxiosError)?.response?.status;
            if (statusCode === 401 || statusCode === 403) {
                localStorage.removeItem("signed");
            }

            return null; // indicate failure
        }
    };

    const getInvoiceDetails = async (invoiceId: number): Promise<InvoiceDetails | null> => {
        try {
            const response = await httpClient.get(`${invoiceDetailsEndpoint}/${invoiceId}`);
            return response.data as InvoiceDetails;
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
        try {
            await httpClient.post(creditCardPurchaseEndpoint, purchaseData);
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
        try {
            await httpClient.put(`${creditCardPurchaseEndpoint}/update/${purchaseId}`, purchaseData);
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
        updateCreditCard
    }
}
