import { MSG_TYPES } from '../constants/messages';
import { DETECTION_RETRY_COUNT, DETECTION_RETRY_DELAY_MS } from '../constants/config';
import type { DetectionResult } from '../types/detection.types';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const DetectionService = {
  async detect(tabId: number): Promise<DetectionResult> {
    for (let attempt = 0; attempt < DETECTION_RETRY_COUNT; attempt++) {
      try {
        const result = await chrome.tabs.sendMessage(tabId, {
          type: MSG_TYPES.GET_DETECTION,
        });
        if (result?.supported) {
          return result as DetectionResult;
        }
      } catch {
        // Content script not ready, retry
      }
      if (attempt < DETECTION_RETRY_COUNT - 1) {
        await delay(DETECTION_RETRY_DELAY_MS);
      }
    }
    return { supported: false, symbol: null, price: null, broker: null };
  },
};
