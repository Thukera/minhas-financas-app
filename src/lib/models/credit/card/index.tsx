// types/credit-card.ts
export interface CreditCard {
  id: number;
  nickname: string;
  last4: string;
  limit: number;
  usedLimit: number;
  billingPeriod: string;
  userId: number;       // FK
  invoiceId: number;    // FK
  purchasesId: number;  // FK
}
