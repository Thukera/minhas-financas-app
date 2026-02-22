import { getDB } from '../db';
import { httpClient } from '../http';

/**
 * Sistema de sincronização automática para operações offline
 * Garante que mudanças feitas offline sejam enviadas ao servidor quando a conexão retornar
 */

let isSyncing = false;
let syncListeners: Array<(status: SyncStatus) => void> = [];

export interface SyncStatus {
  isSyncing: boolean;
  pendingItems: number;
  successCount: number;
  errorCount: number;
  lastSyncTime?: Date;
}

/**
 * Adiciona um listener para mudanças no status de sincronização
 */
export const addSyncListener = (listener: (status: SyncStatus) => void) => {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter(l => l !== listener);
  };
};

/**
 * Notifica todos os listeners sobre mudanças no status
 */
const notifyListeners = (status: SyncStatus) => {
  syncListeners.forEach(listener => listener(status));
};

/**
 * Adiciona uma operação à fila de sincronização
 */
export const addToSyncQueue = async (
  type: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: 'purchase' | 'card' | 'invoice' | 'subscription' | 'user',
  endpoint: string,
  payload: any
): Promise<void> => {
  const db = await getDB();
  
  await db.add('syncQueue', {
    type,
    entity,
    endpoint,
    payload,
    timestamp: Date.now(),
    synced: false,
    retryCount: 0,
  });

  console.log(`📥 Adicionado à fila de sync: ${type} ${entity}`);
  
  // Tentar sincronizar imediatamente se online
  if (navigator.onLine) {
    setTimeout(() => processSyncQueue(), 100);
  }
};

/**
 * Processa a fila de sincronização, enviando operações pendentes ao servidor
 */
export const processSyncQueue = async (): Promise<SyncStatus> => {
  if (isSyncing) {
    console.log('⏳ Sincronização já em andamento, aguardando...');
    return getCurrentSyncStatus();
  }

  if (!navigator.onLine) {
    console.log('📵 Offline - sincronização adiada');
    return getCurrentSyncStatus();
  }

  isSyncing = true;
  const db = await getDB();
  
  try {
    const tx = db.transaction('syncQueue', 'readwrite');
    const items = await tx.store.getAll();
    const pendingItems = items.filter(item => !item.synced);

    if (pendingItems.length === 0) {
      console.log('✅ Nenhum item pendente para sincronizar');
      isSyncing = false;
      return getCurrentSyncStatus();
    }

    console.log(`🔄 Sincronizando ${pendingItems.length} itens...`);

    let successCount = 0;
    let errorCount = 0;

    notifyListeners({
      isSyncing: true,
      pendingItems: pendingItems.length,
      successCount: 0,
      errorCount: 0,
    });

    for (const item of pendingItems) {
      try {
        await syncItem(item);
        
        // Remover da fila após sucesso
        await db.delete('syncQueue', item.id!);
        successCount++;
        
        console.log(`✅ Sincronizado: ${item.entity} ${item.type} (${successCount}/${pendingItems.length})`);
        
        notifyListeners({
          isSyncing: true,
          pendingItems: pendingItems.length - successCount,
          successCount,
          errorCount,
        });
        
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        
        // Incrementar contador de retry
        const retryCount = (item.retryCount || 0) + 1;
        const maxRetries = 5;
        
        if (retryCount >= maxRetries) {
          console.error(`❌ Falha permanente após ${maxRetries} tentativas: ${item.entity} ${item.type}`, error);
          // Remover da fila após muitas falhas (ou manter para análise manual)
          await db.delete('syncQueue', item.id!);
        } else {
          console.warn(`⚠️ Falha temporária (tentativa ${retryCount}/${maxRetries}): ${item.entity} ${item.type}`, error);
          // Atualizar item com erro e contador
          await db.put('syncQueue', {
            ...item,
            retryCount,
            lastError: errorMessage,
          });
        }
      }
    }

    const finalStatus: SyncStatus = {
      isSyncing: false,
      pendingItems: errorCount,
      successCount,
      errorCount,
      lastSyncTime: new Date(),
    };

    console.log(`✅ Sincronização concluída: ${successCount} sucesso, ${errorCount} erros`);
    
    notifyListeners(finalStatus);
    
    return finalStatus;
    
  } catch (error) {
    console.error('❌ Erro ao processar fila de sincronização:', error);
    throw error;
  } finally {
    isSyncing = false;
  }
};

/**
 * Sincroniza um item individual com o servidor
 */
const syncItem = async (item: any): Promise<void> => {
  const { type, endpoint, payload } = item;

  switch (type) {
    case 'CREATE':
      await httpClient.post(endpoint, payload);
      break;
      
    case 'UPDATE':
      await httpClient.put(endpoint, payload);
      break;
      
    case 'DELETE':
      await httpClient.delete(endpoint, { data: payload });
      break;
      
    default:
      throw new Error(`Tipo de operação desconhecido: ${type}`);
  }
};

/**
 * Obtém o status atual da sincronização
 */
export const getCurrentSyncStatus = async (): Promise<SyncStatus> => {
  const db = await getDB();
  const allItems = await db.getAll('syncQueue');
  const pendingItems = allItems.filter((item: any) => !item.synced).length;

  return {
    isSyncing,
    pendingItems,
    successCount: 0,
    errorCount: 0,
  };
};

/**
 * Limpa a fila de sincronização (usar com cuidado!)
 */
export const clearSyncQueue = async (): Promise<void> => {
  const db = await getDB();
  await db.clear('syncQueue');
  console.log('🗑️ Fila de sincronização limpa');
};

/**
 * Configuração automática de listeners para online/offline
 */
if (typeof window !== 'undefined') {
  // Quando voltar online, processar fila automaticamente
  window.addEventListener('online', () => {
    console.log('🌐 Internet restaurada - iniciando sincronização automática');
    setTimeout(() => processSyncQueue(), 500);
  });

  // Log quando ficar offline
  window.addEventListener('offline', () => {
    console.log('📵 Modo offline ativado');
  });

  // Sincronizar ao carregar a página (se online)
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      if (navigator.onLine) {
        console.log('🔄 Verificando itens pendentes ao carregar...');
        setTimeout(() => processSyncQueue(), 1000);
      }
    });
  }
}

/**
 * Força uma sincronização manual
 */
export const forceSyncNow = async (): Promise<SyncStatus> => {
  console.log('🔄 Sincronização manual iniciada');
  return await processSyncQueue();
};
