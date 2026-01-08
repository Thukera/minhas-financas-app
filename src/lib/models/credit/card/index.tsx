export interface CreditCardFromBackend {
  id: number;
  nickname: string;
  bank: string;
  endnumbers: string;
  billingPeriodStart: number;
  billingPeriodEnd: number;
  totalLimit: number;
  dataCadastro?: string;
}

export interface Invoice {
    id: number;
    startDate: string;      // "YYYY-MM-DD" - optional, not always provided
    endDate: string;        // optional, not always provided
    dueDate: string;
    totalAmount: number;
    totalPlanned?: number;  // optional, can be calculated later
    status: "PENDING" | "CLOSED" | "PAID" | "OPEN";
}

// Extend for frontend use
export interface CreditCard extends CreditCardFromBackend {
  usedLimit: number;
  billingPeriod: string;
  userId?: number;
  invoiceId?: number;
  purchasesId?: number;
  currentInvoiceId?: number;  // ID of the current invoice

  invoices?: Invoice[];        // optional array of invoices
}


