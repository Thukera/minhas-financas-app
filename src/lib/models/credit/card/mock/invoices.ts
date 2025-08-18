// mocks/invoices.ts
export const mockInvoices: Record<string, { type: string; items: any[] }[]> =  {
  1: [ // ITAU GOLD
    {
      type: "Atual",
      items: [
        { descricao: "Notebook Dell", valor: 3500, parcela: "2/10", vencimento: "15/08/2025", pago: false, classificacao: "Tech" },
        { descricao: "Academia", valor: 120, parcela: "5/12", vencimento: "15/08/2025", pago: true, classificacao: "Saude" },
        { descricao: "Uber", valor: 25, parcela: "-", vencimento: "20/08/2025", pago: false, classificacao: "Transporte" },
        { descricao: "Farmácia", valor: 200, parcela: "-", vencimento: "20/08/2025", pago: false, classificacao: "Saude" },
      ],
    },
  ],
  2: [ // ITAU PLATINUM
    {
      type: "Parceladas",
      items: [
        { descricao: "TV Samsung", valor: 2800, parcela: "1/10", vencimento: "12/08/2025", pago: false, classificacao: "Presente" },
      ],
    },
  ],
  3: [ // NU BANK
    {
      type: "À Vista",
      items: [
        { descricao: "Spotify", valor: 34.90, parcela: "-", vencimento: "05/08/2025", pago: true, classificacao: "Assinatura" },
        { descricao: "Padaria", valor: 45, parcela: "-", vencimento: "06/08/2025", pago: false, classificacao: "Mercado" },
      ],
    },
  ],
};
