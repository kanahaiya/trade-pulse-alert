import { useState, useEffect, useCallback } from 'react';
import { AlertStorage } from '../storage/alertStorage';
import { generateId } from '../utils/idGenerator';
import type { StoredAlert, AlertCondition } from '../types/alert.types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<StoredAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await AlertStorage.getAll();
      setAlerts(all);
    } catch (error) {
      console.error('[TradePulse] Failed to load alerts:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();

    const handleStorageChange = () => {
      loadAlerts();
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [loadAlerts]);

  const addAlert = useCallback(
    async (
      symbol: string,
      targetPrice: number,
      condition: AlertCondition,
      tabUrl: string
    ) => {
      const newAlert: StoredAlert = {
        id: generateId(),
        symbol,
        targetPrice,
        condition,
        status: 'ACTIVE',
        previousPrice: null,
        createdAt: Date.now(),
        triggeredAt: null,
        tabUrl,
      };

      await AlertStorage.addAlert(newAlert);
      await loadAlerts();
    },
    [loadAlerts]
  );

  const deleteAlert = useCallback(
    async (id: string) => {
      await AlertStorage.deleteAlert(id);
      await loadAlerts();
    },
    [loadAlerts]
  );

  const clearTriggered = useCallback(async () => {
    await AlertStorage.clearTriggered();
    await loadAlerts();
  }, [loadAlerts]);

  const clearActive = useCallback(async () => {
    await AlertStorage.clearActive();
    await loadAlerts();
  }, [loadAlerts]);

  const editAlert = useCallback(
    async (id: string, targetPrice: number, condition: AlertCondition) => {
      await AlertStorage.editAlert(id, targetPrice, condition);
      await loadAlerts();
    },
    [loadAlerts]
  );

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const triggeredAlerts = alerts.filter((a) => a.status === 'TRIGGERED');

  return {
    alerts,
    activeAlerts,
    triggeredAlerts,
    isLoading,
    addAlert,
    deleteAlert,
    editAlert,
    clearActive,
    clearTriggered,
    refetch: loadAlerts,
  };
}
