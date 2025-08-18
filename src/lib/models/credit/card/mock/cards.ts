// mocks/cards.ts
import { CreditCard } from "..";

export const mockCards: CreditCard[] = [
  {
    id: 1,
    nickname: "ITAU GOLD",
    last4: "1234",
    limit: 10000,
    usedLimit: 4500,
    billingPeriod: "01/08/2025 - 31/08/2025",
    userId: 1,
    invoiceId: 101,
    purchasesId: 201,
  },
  {
    id: 2,
    nickname: "ITAU PLATINUM",
    last4: "5678",
    limit: 15000,
    usedLimit: 9800,
    billingPeriod: "05/08/2025 - 04/09/2025",
    userId: 1,
    invoiceId: 102,
    purchasesId: 202,
  },
  {
    id: 3,
    nickname: "NU BANK",
    last4: "9876",
    limit: 8000,
    usedLimit: 2000,
    billingPeriod: "10/08/2025 - 09/09/2025",
    userId: 1,
    invoiceId: 103,
    purchasesId: 203,
  },
];
