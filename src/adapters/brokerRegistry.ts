/**
 * Broker Adapter Registry
 * 
 * Extensible architecture for supporting multiple brokers.
 * Each broker has its own adapter with specific detection and extraction logic.
 */

export interface BrokerAdapter {
  name: string;
  hostPatterns: string[];  // Hostname patterns to match
  
  // Detection: Check if this broker's chart is present
  detect: () => boolean;
  
  // Extract symbol from the page
  extractSymbol: () => string | null;
  
  // Extract live price from the page
  extractPrice: () => number | null;
}

// Registry of all broker adapters
const brokerAdapters: BrokerAdapter[] = [];

export function registerBroker(adapter: BrokerAdapter): void {
  brokerAdapters.push(adapter);
}

export function getBrokerForHost(hostname: string): BrokerAdapter | null {
  for (const adapter of brokerAdapters) {
    for (const pattern of adapter.hostPatterns) {
      if (hostname.includes(pattern)) {
        return adapter;
      }
    }
  }
  return null;
}

export function getAllBrokers(): BrokerAdapter[] {
  return brokerAdapters;
}

// Helper: Parse price from text with common patterns
export function parsePrice(text: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const priceStr = match[1].replace(/,/g, '');
      const price = parseFloat(priceStr);
      if (price > 0 && price < 1_000_000 && !isNaN(price)) {
        return price;
      }
    }
  }
  return null;
}

// Helper: Parse symbol from text with common patterns
export function parseSymbol(text: string, patterns: RegExp[], invalidSymbols: Set<string>): string | null {
  const upper = text.toUpperCase();
  for (const pattern of patterns) {
    const match = upper.match(pattern);
    if (match) {
      const sym = match[1].trim().replace(/\s+/g, ' ');
      if (!invalidSymbols.has(sym)) {
        return sym;
      }
    }
  }
  return null;
}

// Common invalid symbols to filter out
export const COMMON_INVALID_SYMBOLS = new Set([
  'THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'YOU', 'ALL', 'CAN', 'HAD',
  'HAS', 'WAS', 'HER', 'HIS', 'ITS', 'OUR', 'OUT', 'WHO', 'NOW', 'NEW',
  'GET', 'SET', 'BUY', 'PUT', 'DID', 'SAY', 'USE', 'WAY', 'MAY', 'DAY',
  'OPT', 'LTP', 'NSE', 'BSE', 'MCX', 'INR', 'USD', 'SPOT', 'INDEX', 'CHART',
]);

// Common symbol patterns for Indian markets
export const COMMON_SYMBOL_PATTERNS = [
  /\b(BANKNIFTY\s*\d{2}[A-Z]{3}\d{2}\s*\d+\s*(?:CE|PE))\b/i,
  /\b(NIFTY\s*\d{2}[A-Z]{3}\d{2}\s*\d+\s*(?:CE|PE))\b/i,
  /\b(BANKNIFTY\s+\d+\s*(?:CE|PE))\b/i,
  /\b(NIFTY\s+\d+\s*(?:CE|PE))\b/i,
  /\b(BANKNIFTY)\b/i,
  /\b(NIFTY\s*50)\b/i,
  /\b(NIFTY)\b/i,
  /\b(SENSEX)\b/i,
  /\b(FINNIFTY)\b/i,
  /\b([A-Z]{2,10})\b/,
];
