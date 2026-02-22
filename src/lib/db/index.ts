import { openDB, IDBPDatabase } from 'idb';

/**
 * Schema do IndexedDB para MinhasFinancas App
 * Armazena dados localmente para funcionalidade offline
 */

// Define types for your data
type CreditCard = {
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

type Invoice = {
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

type Purchase = {
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

type PurchaseDetail = {
  purchaseId: number;
  data: any;
  synced: boolean;
  updatedAt: string;
};

type UserData = {
  id: string;
  data: any;
  synced: boolean;
  updatedAt: string;
};

type SyncQueueItem = {
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

let dbInstance: IDBPDatabase | null = null;

/**
 * Obtém ou cria a instância do banco de dados IndexedDB
 */
export const getDB = async (): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  console.log('📦 Inicializando IndexedDB...');

  dbInstance = await openDB('minhas-financas-db', 1, {
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

  // Contar itens pendentes manualmente
  const allSyncItems = await db.getAll('syncQueue');
  const pendingSync = allSyncItems.filter((item: SyncQueueItem) => !item.synced).length;

  return {
    creditCards: creditCardsCount,
    invoices: invoicesCount,
    purchases: purchasesCount,
    syncQueue: syncQueueCount,
    pendingSync,
  };
};
