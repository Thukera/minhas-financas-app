import { useState, useEffect } from 'react';
import { processSyncQueue, addSyncListener, getCurrentSyncStatus, SyncStatus, forceSyncNow } from '@/lib/sync';

/**
 * Hook customizado para gerenciar sincronização offline
 * Fornece status de sync e métodos para forçar sincronização
 */
export const useSync = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingItems: 0,
    successCount: 0,
    errorCount: 0,
  });
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Inicializar status
    setIsOnline(navigator.onLine);
    
    getCurrentSyncStatus().then(status => {
      setSyncStatus(status);
    });

    // Listener de sync
    const removeSyncListener = addSyncListener((status) => {
      setSyncStatus(status);
    });

    // Listeners de conexão
    const handleOnline = () => {
      setIsOnline(true);
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      removeSyncListener();
    };
  }, []);

  return {
    syncStatus,
    isOnline,
    forceSyncNow,
    hasPendingItems: syncStatus.pendingItems > 0,
    isSyncing: syncStatus.isSyncing,
  };
};
