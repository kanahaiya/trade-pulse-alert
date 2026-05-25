import type { StoredAlert } from '../types/alert.types';

export const NotificationService = {
  async fire(alert: StoredAlert, triggeredPrice: number): Promise<void> {
    const conditionText =
      alert.condition === 'CROSS_ABOVE' ? 'crossed above' : 'crossed below';

    await chrome.notifications.create(`tradepulse_${alert.id}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: `🔔 TradePulse: ${alert.symbol}`,
      message: `Price ${conditionText} ₹${alert.targetPrice.toLocaleString('en-IN')}`,
      contextMessage: `Triggered at ₹${triggeredPrice.toLocaleString('en-IN')}`,
      priority: 2,
      requireInteraction: false,
    });
  },
};
