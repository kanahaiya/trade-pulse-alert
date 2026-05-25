import { MSG_TYPES } from '../constants/messages';
import { detectTradingViewEnvironment, extractLivePrice, extractSymbol } from '../adapters/tradingviewAdapter';
import type { DetectionResult, PriceResponse } from '../types/message.types';

chrome.runtime.onMessage.addListener(
  (
    message: { type: string },
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: DetectionResult | PriceResponse) => void
  ) => {
    try {
      if (message.type === MSG_TYPES.GET_DETECTION) {
        const result = detectTradingViewEnvironment();
        sendResponse(result);
        return true;
      }

      if (message.type === MSG_TYPES.GET_PRICE) {
        const response: PriceResponse = {
          price: extractLivePrice(),
          symbol: extractSymbol(),
        };
        sendResponse(response);
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
