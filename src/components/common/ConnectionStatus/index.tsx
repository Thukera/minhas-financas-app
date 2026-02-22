'use client';

import { useState, useEffect } from 'react';
import { processSyncQueue, addSyncListener, getCurrentSyncStatus, SyncStatus } from '@/lib/sync';

/**
 * Componente que exibe o status de conexão e sincronização
 * Mostra badge com indicador online/offline e contador de itens pendentes
 */
export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingItems: 0,
    successCount: 0,
    errorCount: 0,
  });

  useEffect(() => {
    // Inicializar com o status atual
    setIsOnline(navigator.onLine);
    
    // Carregar status inicial de sync
    getCurrentSyncStatus().then(status => {
      setSyncStatus(status);
    });

    // Handler para mudanças de conexão
    const updateOnlineStatus = async () => {
      const online = navigator.onLine;
      setIsOnline(online);

      if (online) {
        console.log('🌐 Conexão restaurada - iniciando sincronização');
        // Aguardar um pouco antes de sincronizar
        setTimeout(async () => {
          try {
            const status = await processSyncQueue();
            setSyncStatus(status);
          } catch (error) {
            console.error('Erro ao sincronizar:', error);
          }
        }, 500);
      } else {
        console.log('📵 Conexão perdida - modo offline');
      }
    };

    // Adicionar listeners de conexão
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Adicionar listener de sync
    const removeSyncListener = addSyncListener((status) => {
      setSyncStatus(status);
    });

    // Cleanup
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      removeSyncListener();
    };
  }, []);

  // Determinar o texto e estilo baseado no status
  const getBadgeContent = () => {
    if (syncStatus.isSyncing) {
      return {
        icon: '🔄',
        text: `Sincronizando... (${syncStatus.successCount}/${syncStatus.pendingItems + syncStatus.successCount})`,
        color: '#f39c12',
      };
    }

    if (!isOnline) {
      if (syncStatus.pendingItems > 0) {
        return {
          icon: '📵',
          text: `Offline (${syncStatus.pendingItems} pendente${syncStatus.pendingItems > 1 ? 's' : ''})`,
          color: '#e74c3c',
        };
      }
      return {
        icon: '📵',
        text: 'Offline',
        color: '#e74c3c',
      };
    }

    if (syncStatus.pendingItems > 0) {
      return {
        icon: '⏳',
        text: `${syncStatus.pendingItems} pendente${syncStatus.pendingItems > 1 ? 's' : ''}`,
        color: '#f39c12',
      };
    }

    return {
      icon: '🟢',
      text: 'Online',
      color: '#27ae60',
    };
  };

  const badge = getBadgeContent();

  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 9999,
        padding: '0.5rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.75rem',
        fontWeight: '600',
        backgroundColor: badge.color,
        color: 'white',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.3s ease',
        cursor: 'default',
        userSelect: 'none',
      }}
      title={
        syncStatus.lastSyncTime
          ? `Última sincronização: ${syncStatus.lastSyncTime.toLocaleTimeString()}`
          : 'Status de conexão'
      }
    >
      <span style={{ fontSize: '1rem' }}>{badge.icon}</span>
      <span>{badge.text}</span>
    </div>
  );
};
