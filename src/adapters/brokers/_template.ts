/**
 * Broker Adapter Template
 * 
 * Copy this file and rename it to create a new broker adapter.
 * 
 * Steps to add a new broker:
 * 1. Copy this file to a new file (e.g., zerodha.ts)
 * 2. Update the adapter name, hostPatterns, and extraction logic
 * 3. Import and register in index.ts
 * 
 * Example:
 *   import { zerodhaAdapter } from './zerodha';
 *   registerBroker(zerodhaAdapter);
 */

import type { BrokerAdapter } from '../brokerRegistry';
import { parseSymbol, COMMON_INVALID_SYMBOLS, COMMON_SYMBOL_PATTERNS } from '../brokerRegistry';

// Selectors specific to this broker for finding price elements
const PRICE_SELECTORS = [
  '.price-element',
  '[class*="ltp"]',
  '[class*="last-price"]',
];

// Selectors specific to this broker for finding symbol elements
const SYMBOL_SELECTORS = [
  '.symbol-element',
  '[class*="symbol"]',
  '[class*="instrument"]',
];

export const templateAdapter: BrokerAdapter = {
  // Display name for this broker
  name: 'Broker Name',
  
  // Hostname patterns to match (without https://)
  hostPatterns: ['broker.com', 'app.broker.com'],
  
  /**
   * Detect if this broker's chart is present on the page
   * Return true if the broker's trading interface is detected
   */
  detect: () => {
    // Check for broker-specific elements
    const hasBrokerElements = document.querySelector('.broker-specific-class') !== null;
    const hasChart = document.querySelector('canvas') !== null;
    return hasBrokerElements || hasChart;
  },
  
  /**
   * Extract the trading symbol from the page
   * Return the symbol string (e.g., "NIFTY", "BANKNIFTY") or null
   */
  extractSymbol: () => {
    // Try broker-specific selectors
    for (const sel of SYMBOL_SELECTORS) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const sym = parseSymbol(el.textContent, COMMON_SYMBOL_PATTERNS, COMMON_INVALID_SYMBOLS);
        if (sym) return sym;
      }
    }
    
    // Fallback: page title
    const titleMatch = document.title.toUpperCase().match(/([A-Z]{2,10})/);
    if (titleMatch && !COMMON_INVALID_SYMBOLS.has(titleMatch[1])) {
      return titleMatch[1];
    }
    
    return null;
  },
  
  /**
   * Extract the live price from the page
   * Return the price as a number or null
   */
  extractPrice: () => {
    // Strategy 1: Page title (most reliable if broker shows price in title)
    const titleMatch = document.title.match(/(\d[\d,]*\.\d{2})/);
    if (titleMatch) {
      const price = parseFloat(titleMatch[1].replace(/,/g, ''));
      if (price >= 100 && price <= 100000 && !isNaN(price)) {
        return price;
      }
    }
    
    // Strategy 2: Try broker-specific selectors
    for (const sel of PRICE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const match = el.textContent.match(/(\d[\d,]*\.\d{2})/);
        if (match) {
          const price = parseFloat(match[1].replace(/,/g, ''));
          if (price > 0 && !isNaN(price)) {
            return price;
          }
        }
      }
    }
    
    // Strategy 3: Scan body text for price patterns
    const bodyText = document.body?.innerText || '';
    const priceMatch = bodyText.match(/(\d{2},?\d{3}\.\d{2})/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ''));
      if (price >= 10000 && price <= 70000) {
        return price;
      }
    }
    
    return null;
  },
};
