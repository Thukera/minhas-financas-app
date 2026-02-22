/**
 * EXEMPLOS DE USO - Sistema Offline-First
 * 
 * Este arquivo demonstra como usar o sistema offline em diversos cenários
 */

// ============================================================================
// EXEMPLO 1: Usar o hook useSync em um componente
// ============================================================================

import { useSync } from '@/hooks/useSync';

function MeuComponente() {
  const { syncStatus, isOnline, forceSyncNow, hasPendingItems } = useSync();

  return (
    <div>
      {/* Mostrar status de conexão */}
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
      
      {/* Mostrar itens pendentes */}
      {hasPendingItems && (
        <div className="notification is-warning">
          Você tem {syncStatus.pendingItems} item(ns) aguardando sincronização
        </div>
      )}

      {/* Botão para forçar sincronização */}
      <button 
        onClick={forceSyncNow}
        disabled={!isOnline || syncStatus.isSyncing}
      >
        {syncStatus.isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
      </button>
    </div>
  );
}

// ============================================================================
// EXEMPLO 2: Adicionar nova operação à fila de sync manualmente
// ============================================================================

import { addToSyncQueue } from '@/lib/sync';

async function criarDomicilio(data: any) {
  // 1. Salvar localmente primeiro (seu código aqui)
  const localData = await salvarNoBancoLocal(data);

  // 2. Adicionar à fila de sync
  await addToSyncQueue(
    'CREATE',                    // tipo de operação
    'domicilio',                 // entidade
    'api/domicilio',             // endpoint
    data                         // payload
  );

  // 3. Tentar enviar se online
  if (navigator.onLine) {
    try {
      await fetch('/api/domicilio', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      console.log('✅ Sincronizado imediatamente');
    } catch (error) {
      console.log('⏳ Será sincronizado quando voltar online');
    }
  }
}

// ============================================================================
// EXEMPLO 3: Buscar dados do cache local (modo offline-first)
// ============================================================================

import { getDB } from '@/lib/db';

async function buscarComprasOfflineFirst(invoiceId: number) {
  const db = await getDB();

  // Buscar do cache local primeiro
  const cachedPurchases = await db
    .getAllFromIndex('purchases', 'by-invoice', invoiceId);

  if (!navigator.onLine) {
    // Offline: retorna cache
    console.log('📦 Dados do cache (offline)');
    return cachedPurchases;
  }

  // Online: tentar atualizar da API
  try {
    const response = await fetch(`/api/purchases?invoice=${invoiceId}`);
    const freshData = await response.json();

    // Atualizar cache
    const tx = db.transaction('purchases', 'readwrite');
    for (const purchase of freshData) {
      await tx.store.put({
        ...purchase,
        synced: true,
        updatedAt: new Date().toISOString(),
      });
    }
    await tx.done;

    console.log('✅ Dados atualizados da API');
    return freshData;
  } catch (error) {
    // API falhou: retornar cache
    console.warn('⚠️ API falhou, usando cache');
    return cachedPurchases;
  }
}

// ============================================================================
// EXEMPLO 4: Limpar cache ao fazer logout
// ============================================================================

import { clearLocalCache } from '@/lib/db';
import { clearSyncQueue } from '@/lib/sync';

async function handleLogout() {
  // Limpar todos os dados locais
  await clearLocalCache();
  await clearSyncQueue();
  
  // Limpar localStorage
  localStorage.removeItem('signed');
  
  // Redirecionar
  window.location.href = '/login';
}

// ============================================================================
// EXEMPLO 5: Monitorar status de sync em tempo real
// ============================================================================

import { addSyncListener } from '@/lib/sync';

function ComponenteComMonitoramento() {
  useEffect(() => {
    // Adicionar listener
    const removeListener = addSyncListener((status) => {
      console.log('📊 Status de sync atualizado:', status);
      
      if (status.isSyncing) {
        mostrarNotificacao('Sincronizando dados...');
      } else if (status.successCount > 0) {
        mostrarNotificacao(`${status.successCount} itens sincronizados!`);
      } else if (status.errorCount > 0) {
        mostrarNotificacao('Erro ao sincronizar alguns itens', 'danger');
      }
    });

    // Cleanup
    return () => removeListener();
  }, []);
}

// ============================================================================
// EXEMPLO 6: Verificar estatísticas do banco local
// ============================================================================

import { getDBStats } from '@/lib/db';

async function mostrarEstatisticas() {
  const stats = await getDBStats();
  
  console.log('📊 Estatísticas do banco local:');
  console.log(`   Cartões: ${stats.creditCards}`);
  console.log(`   Faturas: ${stats.invoices}`);
  console.log(`   Compras: ${stats.purchases}`);
  console.log(`   Fila de Sync: ${stats.syncQueue}`);
  console.log(`   Pendentes: ${stats.pendingSync}`);
}

// ============================================================================
// EXEMPLO 7: Criar serviço offline-first para nova entidade
// ============================================================================

import { getDB } from '@/lib/db';
import { addToSyncQueue } from '@/lib/sync';
import { httpClient } from '@/lib/http';

const rendimentosEndpoint = 'api/rendimentos';

export const useRendimentosService = () => {
  
  // CREATE - offline first
  const createRendimento = async (data: any): Promise<boolean> => {
    const db = await getDB();
    
    try {
      // 1. Salvar local
      const tempId = Date.now();
      await db.put('rendimentos', {
        id: tempId,
        ...data,
        synced: false,
        updatedAt: new Date().toISOString(),
      });

      // 2. Adicionar à fila
      await addToSyncQueue('CREATE', 'rendimento', rendimentosEndpoint, data);

      // 3. Tentar sync se online
      if (navigator.onLine) {
        try {
          await httpClient.post(rendimentosEndpoint, data);
          await db.put('rendimentos', { id: tempId, ...data, synced: true });
        } catch (error) {
          console.log('⏳ Rendimento salvo, sync pendente');
        }
      }

      return true;
    } catch (error) {
      console.error('Erro ao criar rendimento:', error);
      return false;
    }
  };

  // READ - cache first
  const getRendimentos = async (): Promise<any[]> => {
    const db = await getDB();
    
    // Buscar do cache
    const cached = await db.getAll('rendimentos');

    if (!navigator.onLine) {
      return cached;
    }

    // Atualizar da API se online
    try {
      const response = await httpClient.get(rendimentosEndpoint);
      const fresh = response.data;

      // Atualizar cache
      const tx = db.transaction('rendimentos', 'readwrite');
      await tx.store.clear();
      for (const item of fresh) {
        await tx.store.put({
          ...item,
          synced: true,
          updatedAt: new Date().toISOString(),
        });
      }
      await tx.done;

      return fresh;
    } catch (error) {
      console.warn('⚠️ Usando cache, API indisponível');
      return cached;
    }
  };

  return {
    createRendimento,
    getRendimentos,
  };
};

// ============================================================================
// EXEMPLO 8: Adicionar nova store ao IndexedDB (migration)
// ============================================================================

/**
 * Se precisar adicionar nova store, edite src/lib/db/index.ts:
 * 
 * 1. Adicionar ao schema:
 */
interface MinhasFinancasDB extends DBSchema {
  // ... stores existentes
  
  rendimentos: {
    key: number;
    value: {
      id: number;
      descricao: string;
      valor: number;
      data: string;
      synced: boolean;
      updatedAt: string;
    };
    indexes: { 'by-synced': boolean };
  };
}

/**
 * 2. Incrementar versão do banco e adicionar criação:
 */
// Na função getDB(), MUDAR versão de 1 para 2:
dbInstance = await openDB<MinhasFinancasDB>('minhas-financas-db', 2, {
  upgrade(db, oldVersion, newVersion) {
    // Stores antigas já criadas...
    
    // Nova store (versão 2)
    if (!db.objectStoreNames.contains('rendimentos')) {
      const store = db.createObjectStore('rendimentos', { keyPath: 'id' });
      store.createIndex('by-synced', 'synced');
      console.log('✅ Store "rendimentos" criada');
    }
  },
});

// ============================================================================
// EXEMPLO 9: Detectar mudanças de conexão em qualquer componente
// ============================================================================

function ComponenteComDeteccaoConexao() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      console.log('🌐 Voltou online!');
      // Pode disparar ações específicas aqui
    };

    const handleOffline = () => {
      setOnline(false);
      console.log('📵 Ficou offline!');
      // Pode avisar usuário aqui
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={online ? 'is-online' : 'is-offline'}>
      {/* Seu conteúdo */}
    </div>
  );
}

// ============================================================================
// EXEMPLO 10: Optimistic UI (para próxima implementação)
// ============================================================================

function ComponenteComOptimisticUI() {
  const [purchases, setPurchases] = useState([]);

  const handleCreatePurchase = async (data: any) => {
    const tempId = Date.now();
    
    // 1. Atualizar UI IMEDIATAMENTE (optimistic)
    const optimisticPurchase = {
      purchaseId: tempId,
      ...data,
      pending: true, // Flag para mostrar loading
    };
    setPurchases([...purchases, optimisticPurchase]);

    // 2. Salvar local e sync (em background)
    try {
      const success = await createCreditCardPurchase(data);
      
      if (success) {
        // 3. Atualizar com dados reais (se online e sucesso)
        setPurchases(prev => 
          prev.map(p => 
            p.purchaseId === tempId 
              ? { ...p, pending: false }
              : p
          )
        );
      }
    } catch (error) {
      // 4. Remover da UI se falhar completamente
      setPurchases(prev => prev.filter(p => p.purchaseId !== tempId));
      alert('Erro ao criar compra');
    }
  };

  return (
    <div>
      {purchases.map(purchase => (
        <div 
          key={purchase.purchaseId}
          className={purchase.pending ? 'is-loading' : ''}
        >
          {purchase.descricao}
          {purchase.pending && <span className="tag">Salvando...</span>}
        </div>
      ))}
    </div>
  );
}
