import type { StoredAlert } from '../types/alert.types';
import { AlertStorage } from '../storage/alertStorage';

export const AlertEngine = {
  async evaluate(alert: StoredAlert, currentPrice: number): Promise<boolean> {
    if (alert.status !== 'ACTIVE') return false;

    if (alert.previousPrice === null) {
      await AlertStorage.updatePreviousPrice(alert.id, currentPrice);
      return false;
    }

    const { previousPrice, targetPrice, condition } = alert;

    const crossAbove =
      condition === 'CROSS_ABOVE' &&
      previousPrice < targetPrice &&
      currentPrice >= targetPrice;

    const crossBelow =
      condition === 'CROSS_BELOW' &&
      previousPrice > targetPrice &&
      currentPrice <= targetPrice;

    await AlertStorage.updatePreviousPrice(alert.id, currentPrice);

    return crossAbove || crossBelow;
  },
};
