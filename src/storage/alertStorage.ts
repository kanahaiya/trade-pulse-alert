import type { StoredAlert, AlertStatus } from '../types/alert.types';
import { STORAGE_KEYS } from './storageKeys';

export const AlertStorage = {
  async getAll(): Promise<StoredAlert[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.ALERTS);
    return (result[STORAGE_KEYS.ALERTS] as StoredAlert[]) ?? [];
  },

  async getActiveAlerts(): Promise<StoredAlert[]> {
    const all = await this.getAll();
    return all.filter((a) => a.status === 'ACTIVE');
  },

  async getTriggeredAlerts(): Promise<StoredAlert[]> {
    const all = await this.getAll();
    return all.filter((a) => a.status === 'TRIGGERED');
  },

  async addAlert(alert: StoredAlert): Promise<void> {
    const all = await this.getAll();
    await chrome.storage.local.set({
      [STORAGE_KEYS.ALERTS]: [...all, alert],
    });
  },

  async markTriggered(id: string): Promise<void> {
    const all = await this.getAll();
    const updated = all.map((a) =>
      a.id === id
        ? { ...a, status: 'TRIGGERED' as AlertStatus, triggeredAt: Date.now() }
        : a
    );
    await chrome.storage.local.set({ [STORAGE_KEYS.ALERTS]: updated });
  },

  async updatePreviousPrice(id: string, price: number): Promise<void> {
    const all = await this.getAll();
    const updated = all.map((a) =>
      a.id === id ? { ...a, previousPrice: price } : a
    );
    await chrome.storage.local.set({ [STORAGE_KEYS.ALERTS]: updated });
  },

  async deleteAlert(id: string): Promise<void> {
    const all = await this.getAll();
    await chrome.storage.local.set({
      [STORAGE_KEYS.ALERTS]: all.filter((a) => a.id !== id),
    });
  },

  async clearTriggered(): Promise<void> {
    const all = await this.getAll();
    await chrome.storage.local.set({
      [STORAGE_KEYS.ALERTS]: all.filter((a) => a.status === 'ACTIVE'),
    });
  },

  async clearActive(): Promise<void> {
    const all = await this.getAll();
    await chrome.storage.local.set({
      [STORAGE_KEYS.ALERTS]: all.filter((a) => a.status === 'TRIGGERED'),
    });
  },

  async editAlert(id: string, targetPrice: number, condition: 'CROSS_ABOVE' | 'CROSS_BELOW'): Promise<void> {
    const all = await this.getAll();
    const updated = all.map((a) =>
      a.id === id ? { ...a, targetPrice, condition, previousPrice: null } : a
    );
    await chrome.storage.local.set({ [STORAGE_KEYS.ALERTS]: updated });
  },
};
