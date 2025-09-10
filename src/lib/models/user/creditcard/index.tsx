export interface CreditCard {
    id: number;
    nickname: string;
    bank: string;
    endnumbers: string;
    billingPeriodStart: number;
    billingPeriodEnd: number;
    totalLimit: number;
    dataCadastro: string; // could also parse as Date if needed
}