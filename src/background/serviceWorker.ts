import { PollingService } from '../services/pollingService';

chrome.runtime.onStartup.addListener(() => {
  console.log('[TradePulse] Extension started');
  PollingService.checkAndManage();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TradePulse] Extension installed');
  PollingService.checkAndManage();
});

chrome.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName === 'local') {
    PollingService.checkAndManage();
  }
});

PollingService.checkAndManage();

console.log('[TradePulse] Service worker loaded');
