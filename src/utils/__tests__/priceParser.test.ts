import { describe, it, expect } from 'vitest';
import { parseFromText, normalizePrice, isReasonablePrice } from '../priceParser';

describe('priceParser', () => {
  describe('normalizePrice', () => {
    it('removes commas from price string', () => {
      expect(normalizePrice('23,719.30')).toBe(23719.30);
    });

    it('handles price without commas', () => {
      expect(normalizePrice('1234.50')).toBe(1234.50);
    });
  });

  describe('isReasonablePrice', () => {
    it('returns true for valid prices', () => {
      expect(isReasonablePrice(100)).toBe(true);
      expect(isReasonablePrice(23719.30)).toBe(true);
    });

    it('returns false for zero', () => {
      expect(isReasonablePrice(0)).toBe(false);
    });

    it('returns false for negative prices', () => {
      expect(isReasonablePrice(-100)).toBe(false);
    });

    it('returns false for prices over 1 million', () => {
      expect(isReasonablePrice(1_000_001)).toBe(false);
    });

    it('returns false for NaN', () => {
      expect(isReasonablePrice(NaN)).toBe(false);
    });
  });

  describe('parseFromText', () => {
    it('parses "C 23,719.30" format', () => {
      expect(parseFromText('Some text C 23,719.30 more text')).toBe(23719.30);
    });

    it('parses "C 1,234.00" format', () => {
      expect(parseFromText('C 1,234.00')).toBe(1234.00);
    });

    it('parses "LTP: 450.25" format', () => {
      expect(parseFromText('LTP: 450.25')).toBe(450.25);
    });

    it('parses "Last: 500.00" format', () => {
      expect(parseFromText('Last: 500.00')).toBe(500.00);
    });

    it('returns null for empty string', () => {
      expect(parseFromText('')).toBe(null);
    });

    it('returns null for non-numeric text', () => {
      expect(parseFromText('No price here')).toBe(null);
    });
  });
});
