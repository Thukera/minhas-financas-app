import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Schema do IndexedDB para MinhasFinancas App
 * Armazena dados localmente para funcionalidade offline
 */
interface MinhasFinancasDB extends DBSchema {
  // Cartões de crédito
  creditCards: {
    key: number;
    value: {
      id: number;
      bank: string;
      nickname: string;
      endNumbers: string;
      dueDate: number;
      billingPeriodStart: number;
      billingPeriodEnd: number;
      totalLimit: number;
      usedLimit: number;
      invoices?: any[];
      synced: boolean;
      updatedAt: string;
    };
    indexes: { 'by-synced': boolean };
  };

  // Faturas
  invoices: {
    key: number;
    value: {
      id: number;
      invoiceId: number;
      startDate: string;
      endDate: string;
      dueDate: string;
      status: string;
      totalAmount: number;
      estimateLimit?: number | null;
      creditcard: any;
      creditPanel: any;
      purchases: any[];
      synced: boolean;
      updatedAt: string;
    };
    indexes: { 'by-card': number; 'by-synced': boolean };
  };

  // Compras
  purchases: {
    key: number;
    value: {
      purchaseId: number;
      descricao: string;
      value: number;
      purchaseDateTime: string;
      category: string;
      creditCardId: number;
      invoiceId?: number;
      totalInstallments?: number;
      installment?: any;
      synced: boolean;
      updatedAt: string;
    };
    indexes: { 'by-invoice': number; 'by-card': number; 'by-synced': boolean };
  };

  // Detalhes de compras (para modal)
  purchaseDetails: {
    key: number;
    value: {
      purchaseId: number;
      data: any;
      synced: boolean;
      updatedAt: string;
    };
  };

  // Dados do usuário
  user: {
    key: string;
    value: {
      id: string;
      data: any;
      synced: boolean;
      updatedAt: string;
    };
  };

  // Fila de sincronização
  syncQueue: {
    key: number;
    value: {
      id?: number;
      type: 'CREATE' | 'UPDATE' | 'DELETE';
      entity: 'purchase' | 'card' | 'invoice' | 'subscription' | 'user';
      endpoint: string;
      payload: any;
      timestamp: number;
      synced: boolean;
      retryCount: number;
      lastError?: string;
    };
    indexes: { 'by-synced': boolean; 'by-entity': string };
  };
}

let dbInstance: IDBPDatabase<MinhasFinancasDB> | null = null;

/**
 * Obtém ou cria a instância do banco de dados IndexedDB
 */
export const getDB = async (): Promise<IDBPDatabase<MinhasFinancasDB>> => {
  if (dbInstance) return dbInstance;

  console.log('📦 Inicializando IndexedDB...');

  dbInstance = await openDB<MinhasFinancasDB>('minhas-financas-db', 1, {
    upgrade(db) {
      // Credit Cards Store
      if (!db.objectStoreNames.contains('creditCards')) {
        const cardStore = db.createObjectStore('creditCards', { keyPath: 'id' });
        cardStore.createIndex('by-synced', 'synced');
        console.log('✅ Store "creditCards" criada');
      }

      // Invoices Store
      if (!db.objectStoreNames.contains('invoices')) {
        const invoiceStore = db.createObjectStore('invoices', { keyPath: 'invoiceId' });
        invoiceStore.createIndex('by-card', 'creditcard.id');
        invoiceStore.createIndex('by-synced', 'synced');
        console.log('✅ Store "invoices" criada');
      }

      // Purchases Store
      if (!db.objectStoreNames.contains('purchases')) {
        const purchaseStore = db.createObjectStore('purchases', { keyPath: 'purchaseId' });
        purchaseStore.createIndex('by-invoice', 'invoiceId');
        purchaseStore.createIndex('by-card', 'creditCardId');
        purchaseStore.createIndex('by-synced', 'synced');
        console.log('✅ Store "purchases" criada');
      }

      // Purchase Details Store
      if (!db.objectStoreNames.contains('purchaseDetails')) {
        db.createObjectStore('purchaseDetails', { keyPath: 'purchaseId' });
        console.log('✅ Store "purchaseDetails" criada');
      }

      // User Store
      if (!db.objectStoreNames.contains('user')) {
        db.createObjectStore('user', { keyPath: 'id' });
        console.log('✅ Store "user" criada');
      }

      // Sync Queue Store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        syncStore.createIndex('by-synced', 'synced');
        syncStore.createIndex('by-entity', 'entity');
        console.log('✅ Store "syncQueue" criada');
      }

      console.log('✅ IndexedDB inicializado com sucesso');
    },
  });

  return dbInstance;
};

/**
 * Limpa o cache local (útil para logout ou reset)
 */
export const clearLocalCache = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(
    ['creditCards', 'invoices', 'purchases', 'purchaseDetails', 'user'], 
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('creditCards').clear(),
    tx.objectStore('invoices').clear(),
    tx.objectStore('purchases').clear(),
    tx.objectStore('purchaseDetails').clear(),
    tx.objectStore('user').clear(),
  ]);

  await tx.done;
  console.log('🗑️ Cache local limpo');
};

/**
 * Obtém estatísticas do banco de dados local
 */
export const getDBStats = async () => {
  const db = await getDB();
  
  const [
    creditCardsCount,
    invoicesCount,
    purchasesCount,
    syncQueueCount,
  ] = await Promise.all([
    db.count('creditCards'),
    db.count('invoices'),
    db.count('purchases'),
    db.count('syncQueue'),
  ]);

  const pendingSync = await db.countFromIndex('syncQueue', 'by-synced', false);

  return {
    creditCards: creditCardsCount,
    invoices: invoicesCount,
    purchases: purchasesCount,
    syncQueue: syncQueueCount,
    pendingSync,
  };
};
