import { MSG_TYPES } from '../constants/messages';
import { getBrokerForHost, getAllBrokers } from '../adapters/brokerRegistry';
import '../adapters/brokers'; // Register all brokers
import type { DetectionResult, PriceResponse } from '../types/message.types';

/**
 * Get the appropriate broker adapter for the current page
 */
function getActiveBroker() {
  const hostname = window.location.hostname;
  
  // First try to match by hostname
  const brokerByHost = getBrokerForHost(hostname);
  if (brokerByHost) return brokerByHost;
  
  // Fallback: try all brokers and use the first one that detects
  const allBrokers = getAllBrokers();
  for (const broker of allBrokers) {
    if (broker.detect()) {
      return broker;
    }
  }
  
  return null;
}

/**
 * Detect the trading environment
 */
function detectEnvironment(): DetectionResult {
  const broker = getActiveBroker();
  
  if (!broker || !broker.detect()) {
    return { supported: false, symbol: null, price: null, broker: null };
  }
  
  return {
    supported: true,
    symbol: broker.extractSymbol(),
    price: broker.extractPrice(),
    broker: broker.name,
  };
}

/**
 * Extract current price using the active broker
 */
function extractPrice(): PriceResponse {
  const broker = getActiveBroker();
  
  if (!broker) {
    return { price: null, symbol: null };
  }
  
  return {
    price: broker.extractPrice(),
    symbol: broker.extractSymbol(),
  };
}

// Message handler
chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: DetectionResult | PriceResponse) => void
  ) => {
    try {
      if (message.type === MSG_TYPES.GET_DETECTION) {
        sendResponse(detectEnvironment());
        return true;
      }

      if (message.type === MSG_TYPES.GET_PRICE) {
        sendResponse(extractPrice());
        return true;
      }
    } catch (error) {
      console.error('[TradePulse] Content script error:', error);
      sendResponse({ supported: false, symbol: null, price: null, broker: null });
    }
    return true;
  }
);

console.log('[TradePulse] Content script loaded');
