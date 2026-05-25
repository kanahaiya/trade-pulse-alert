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
    // Find any tab with TradingView or supported broker
    const allTabs = await chrome.tabs.query({});
    const tradingTab = allTabs.find(tab => 
      tab.url && (
        tab.url.includes('tradingview.com') || 
        tab.url.includes('sensibull.com') ||
        tab.url.includes('kite.zerodha.com') ||
        tab.url.includes('dhan.co')
      )
    );
    
    if (!tradingTab?.id) {
      return;
    }

    let price: number | null = null;
    
    // Try message passing first
    try {
      const response: PriceResponse = await chrome.tabs.sendMessage(tradingTab.id, {
        type: MSG_TYPES.GET_PRICE,
      });
      
      if (response?.price) {
        price = response.price;
      }
    } catch {
      // Content script not ready - try script injection as fallback
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tradingTab.id },
          func: () => {
            const match = document.title.match(/(\d[\d,]*\.\d{2})/);
            if (match) {
              const p = parseFloat(match[1].replace(/,/g, ''));
              if (p >= 100 && p <= 100000) return p;
            }
            return null;
          },
        });
        if (results?.[0]?.result) {
          price = results[0].result as number;
        }
      } catch {
        return;
      }
    }

    if (!price) {
      return;
    }

    const alerts = await AlertStorage.getActiveAlerts();
    if (alerts.length === 0) return;
    
    // Log every poll cycle for debugging
    console.log(`[TradePulse] Checking ${alerts.length} alerts at price ${price}`);
    
    const triggeredIds: string[] = [];

    for (const alert of alerts) {
      const triggered = await AlertEngine.evaluate(alert, price);
      if (triggered) {
        console.log(`[TradePulse] TRIGGERED: ${alert.symbol} ${alert.condition} ${alert.targetPrice} (price=${price})`);
        triggeredIds.push(alert.id);
      }
    }

    for (const id of triggeredIds) {
      const alert = alerts.find((a) => a.id === id);
      if (alert) {
        console.log('[TradePulse] Triggering alert:', alert.symbol, alert.targetPrice);
        await AlertStorage.markTriggered(id);
        await NotificationService.fire(alert, price);
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
    // Run immediately, then on interval
    runPollCycle();
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
