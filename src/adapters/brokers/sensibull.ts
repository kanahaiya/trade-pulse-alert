/**
 * Sensibull Adapter
 * 
 * Sensibull uses TradingView charts but has its own header with spot price.
 * The spot price is shown in the header area, not in the chart legend.
 */

import type { BrokerAdapter } from '../brokerRegistry';
import { parseSymbol, COMMON_INVALID_SYMBOLS, COMMON_SYMBOL_PATTERNS } from '../brokerRegistry';

// Sensibull-specific selectors for price
const PRICE_SELECTORS = [
  // Header area selectors - Sensibull shows spot price in header
  '.spot-price',
  '.underlying-price', 
  '.ltp-value',
  '.current-price',
  '[class*="spotPrice"]',
  '[class*="underlyingPrice"]',
  '[class*="spot-ltp"]',
  // Generic selectors
  '[class*="price"]',
];

// Sensibull-specific selectors for symbol
const SYMBOL_SELECTORS = [
  '.symbol-name',
  '.instrument-name',
  '[class*="underlying"]',
  '[class*="symbolName"]',
  // TradingView fallback
  '[data-name="legend"] [class*="title"]',
  '[class*="apply-overflow-tooltip"]',
];

export const sensibullAdapter: BrokerAdapter = {
  name: 'Sensibull',
  hostPatterns: ['sensibull.com', 'web.sensibull.com'],
  
  detect: () => {
    // Sensibull always has TradingView charts
    const hasTVChart = document.querySelector('[class*="chart"]') !== null ||
                       document.querySelector('canvas') !== null;
    return hasTVChart;
  },
  
  extractSymbol: () => {
    // Try Sensibull-specific selectors
    for (const sel of SYMBOL_SELECTORS) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const sym = parseSymbol(el.textContent, COMMON_SYMBOL_PATTERNS, COMMON_INVALID_SYMBOLS);
        if (sym) return sym;
      }
    }
    
    // Try URL - Sensibull URLs often contain symbol
    // e.g., /chart?tradingSymbol=NIFTY
    const url = window.location.href;
    const symbolMatch = url.match(/[?&]tradingSymbol=([A-Z0-9]+)/i);
    if (symbolMatch) {
      return symbolMatch[1].toUpperCase();
    }
    
    // Fallback: page title
    const titleMatch = document.title.toUpperCase().match(/([A-Z]{2,10})/);
    if (titleMatch && !COMMON_INVALID_SYMBOLS.has(titleMatch[1])) {
      return titleMatch[1];
    }
    
    return null;
  },
  
  extractPrice: () => {
    // Strategy 1: Page title (most reliable)
    const titleMatch = document.title.match(/(\d[\d,]*\.\d{2})/);
    if (titleMatch) {
      const price = parseFloat(titleMatch[1].replace(/,/g, ''));
      if (price >= 100 && price <= 100000 && !isNaN(price)) {
        return price;
      }
    }
    
    // Strategy 2: Try specific selectors
    for (const sel of PRICE_SELECTORS) {
      const els = document.querySelectorAll(sel);
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        const text = el.textContent || '';
        const price = extractPriceFromText(text);
        if (price !== null) return price;
      }
    }
    
    // Strategy 3: Scan page for NIFTY/BANKNIFTY price range numbers
    const allText = document.body?.textContent || '';
    const price = extractPriceFromText(allText);
    if (price !== null) return price;
    
    // Strategy 4: Look in HTML for price patterns
    const html = document.body?.innerHTML || '';
    return extractPriceFromHTML(html);
  },
};

/**
 * Extract price from text - looks for Indian index price patterns
 */
function extractPriceFromText(text: string): number | null {
  // Pattern: XX,XXX.XX (e.g., 23,982.75)
  const pattern = /(\d{2}),?(\d{3})\.(\d{2})/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const price = parseFloat(match[1] + match[2] + '.' + match[3]);
    // NIFTY range: 15000-30000, BANKNIFTY range: 40000-60000
    if (price >= 15000 && price <= 65000) {
      return price;
    }
  }
  
  return null;
}

/**
 * Extract price from HTML - looks for prices between tags
 */
function extractPriceFromHTML(html: string): number | null {
  // Look for price in HTML like >23,982.75<
  const pattern = />(\d{2}),?(\d{3})\.(\d{2})</g;
  let match;
  
  while ((match = pattern.exec(html)) !== null) {
    const price = parseFloat(match[1] + match[2] + '.' + match[3]);
    if (price >= 15000 && price <= 65000) {
      return price;
    }
  }
  
  return null;
}
