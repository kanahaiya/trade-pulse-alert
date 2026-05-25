import { PollingService } from '../services/pollingService';

console.log('[TradePulse] Service worker loading...');

// Keep service worker alive with periodic alarm
chrome.alarms.create('keepAlive', { periodInMinutes: 0.5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('[TradePulse] Keep-alive alarm, polling running:', PollingService.isRunning());
    if (!PollingService.isRunning()) {
      PollingService.start();
    }
  }
});

chrome.runtime.onStartup.addListener(() => {
  console.log('[TradePulse] Extension started');
  PollingService.start();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TradePulse] Extension installed');
  PollingService.start();
});

chrome.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName === 'local') {
    console.log('[TradePulse] Storage changed');
    PollingService.checkAndManage();
  }
});

// Always start polling on service worker load
PollingService.start();

console.log('[TradePulse] Service worker loaded, polling started');
