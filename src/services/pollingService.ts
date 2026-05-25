import { POLL_INTERVAL_MS } from '../constants/config';
import { MSG_TYPES } from '../constants/messages';
import { AlertStorage } from '../storage/alertStorage';
import { AlertEngine } from './alertEngine';
import { NotificationService } from './notificationService';
import { SoundService } from './soundService';
import type { PriceResponse } from '../types/message.types';

let pollingIntervalId: ReturnType<typeof setInterval> | null = null;

async function runPollCycle(): Promise<void> {
  try {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!activeTab?.id) return;

    let response: PriceResponse | null = null;

    try {
      response = await chrome.tabs.sendMessage(activeTab.id, {
        type: MSG_TYPES.GET_PRICE,
      });
    } catch {
      return;
    }

    if (!response?.price) return;

    const alerts = await AlertStorage.getActiveAlerts();
    const triggeredIds: string[] = [];

    for (const alert of alerts) {
      const triggered = await AlertEngine.evaluate(alert, response.price);
      if (triggered) triggeredIds.push(alert.id);
    }

    for (const id of triggeredIds) {
      const alert = alerts.find((a) => a.id === id);
      if (alert) {
        await AlertStorage.markTriggered(id);
        await NotificationService.fire(alert, response.price);
        await SoundService.play();
      }
    }
  } catch (error) {
    console.error('[TradePulse] Poll cycle error:', error);
  }
}

export const PollingService = {
  start(): void {
    if (pollingIntervalId) return;
    pollingIntervalId = setInterval(runPollCycle, POLL_INTERVAL_MS);
    console.log('[TradePulse] Polling started');
  },

  stop(): void {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
      console.log('[TradePulse] Polling stopped');
    }
  },

  async checkAndManage(): Promise<void> {
    const alerts = await AlertStorage.getActiveAlerts();
    if (alerts.length > 0 && !pollingIntervalId) {
      this.start();
    } else if (alerts.length === 0 && pollingIntervalId) {
      this.stop();
    }
  },

  isRunning(): boolean {
    return pollingIntervalId !== null;
  },
};
