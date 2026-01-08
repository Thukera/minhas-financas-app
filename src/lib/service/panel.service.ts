import { AxiosResponse } from "axios";
import { httpClient } from "../http";
import { User } from "../models/user";
import { CreditCard } from "../models/user/creditcard";

const userPanelEndpoint: string = "api/panel";
const invoiceDetailsEndpoint: string = "api/creditcard/invoice";
const creditCardEndpoint: string = "api/creditcard";

export interface InvoiceDetails {
    invoiceId: number;
    startDate: string;
    endDate: string;
    dueDate: string;
    status: string;
    totalAmount: number;
    creditcard: {
        id: number;
        nickname: string;
    };
    purchases: Purchase[];
}

export interface Purchase {
    purchaseId: number;
    descricao: string;
    value: number;
    purchaseDateTime: string;
    installment?: {
        installmentId: number;
        currentInstallment: number;
        totalInstallment: number;
        value: number;
    };
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

export const usePanelService = () => {

    const getUserDetails = async (): Promise<User | null> => {
        try {
            const response = await httpClient.get(userPanelEndpoint);
            return response.data as User;
        } catch (error) {
            console.error("Failed to get user details", error);
            localStorage.removeItem("signed");
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

    return {
        getUserDetails,
        getInvoiceDetails,
        getCreditCardDetails
    }
}
