
export interface CreditCard {
  id: number;
  nickname: string;
  bank: string;
  endnumbers: string;
  billingPeriodStart: number;
  billingPeriodEnd: number;
  totalLimit: number;
  dataCadastro?: string;

  // frontend-only derived
  usedLimit?: number;
  userId?: number;
  invoiceId?: number;
  purchasesId?: number;
}
