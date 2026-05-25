import type { StoredAlert } from '../types/alert.types';
import { AlertStorage } from '../storage/alertStorage';

export const AlertEngine = {
  async evaluate(alert: StoredAlert, currentPrice: number): Promise<boolean> {
    if (alert.status !== 'ACTIVE') return false;

    const { targetPrice, condition } = alert;

    // First time seeing this alert - initialize previousPrice
    if (alert.previousPrice === null) {
      await AlertStorage.updatePreviousPrice(alert.id, currentPrice);
      
      // Check if condition is ALREADY met on first check
      // This handles alerts set when price is already past target
      if (condition === 'CROSS_ABOVE' && currentPrice >= targetPrice) {
        return true;
      }
      if (condition === 'CROSS_BELOW' && currentPrice <= targetPrice) {
        return true;
      }
      return false;
    }

    const { previousPrice } = alert;

    // Cross Above: price was below target, now at or above
    const crossAbove =
      condition === 'CROSS_ABOVE' &&
      previousPrice < targetPrice &&
      currentPrice >= targetPrice;

    // Cross Below: price was above target, now at or below
    const crossBelow =
      condition === 'CROSS_BELOW' &&
      previousPrice > targetPrice &&
      currentPrice <= targetPrice;

    // Update previous price for next check
    await AlertStorage.updatePreviousPrice(alert.id, currentPrice);

    return crossAbove || crossBelow;
  },
};
