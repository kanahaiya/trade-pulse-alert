import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../storage/alertStorage', () => ({
  AlertStorage: {
    updatePreviousPrice: vi.fn(),
  },
}));

import { AlertEngine } from '../alertEngine';
import type { StoredAlert } from '../../types/alert.types';

const createMockAlert = (overrides: Partial<StoredAlert> = {}): StoredAlert => ({
  id: 'test-id',
  symbol: 'NIFTY',
  targetPrice: 23500,
  condition: 'CROSS_ABOVE',
  status: 'ACTIVE',
  previousPrice: 23400,
  createdAt: Date.now(),
  triggeredAt: null,
  tabUrl: 'https://example.com',
  ...overrides,
});

describe('AlertEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluate', () => {
    it('triggers CROSS_ABOVE when price moves from below to above target', async () => {
      const alert = createMockAlert({
        condition: 'CROSS_ABOVE',
        targetPrice: 23500,
        previousPrice: 23400,
      });

      const result = await AlertEngine.evaluate(alert, 23600);
      expect(result).toBe(true);
    });

    it('does NOT trigger CROSS_ABOVE when price was already above target', async () => {
      const alert = createMockAlert({
        condition: 'CROSS_ABOVE',
        targetPrice: 23500,
        previousPrice: 23600,
      });

      const result = await AlertEngine.evaluate(alert, 23700);
      expect(result).toBe(false);
    });

    it('triggers CROSS_BELOW when price moves from above to below target', async () => {
      const alert = createMockAlert({
        condition: 'CROSS_BELOW',
        targetPrice: 23500,
        previousPrice: 23600,
      });

      const result = await AlertEngine.evaluate(alert, 23400);
      expect(result).toBe(true);
    });

    it('does NOT trigger when status is TRIGGERED', async () => {
      const alert = createMockAlert({
        status: 'TRIGGERED',
        previousPrice: 23400,
      });

      const result = await AlertEngine.evaluate(alert, 23600);
      expect(result).toBe(false);
    });

    it('stores previousPrice on first call without triggering', async () => {
      const alert = createMockAlert({
        previousPrice: null,
      });

      const result = await AlertEngine.evaluate(alert, 23600);
      expect(result).toBe(false);
    });

    it('does NOT trigger when price equals target without crossing', async () => {
      const alert = createMockAlert({
        condition: 'CROSS_ABOVE',
        targetPrice: 23500,
        previousPrice: 23500,
      });

      const result = await AlertEngine.evaluate(alert, 23500);
      expect(result).toBe(false);
    });
  });
});
