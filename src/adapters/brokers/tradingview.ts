/**
 * TradingView Adapter
 * 
 * Supports: tradingview.com and any site using TradingView charting library
 */

import type { BrokerAdapter } from '../brokerRegistry';
import { parsePrice, parseSymbol, COMMON_INVALID_SYMBOLS, COMMON_SYMBOL_PATTERNS } from '../brokerRegistry';

const PRICE_SELECTORS = [
  '[data-name="legend"]',
  '[class*="pane-legend-line"]',
  '[class*="legend-series-item"]',
  '[class*="price-axis-last-price"]',
  '[class*="last-price"]',
];

const PRICE_PATTERNS = [
  /\bC\s+([\d,]+\.\d+)/,                    // C 23,974.15
  /\bLTP[:\s]*([\d,]+(?:\.\d+)?)/i,         // LTP: 23974.15
  /\bLast[:\s]+([\d,]+(?:\.\d+)?)/i,        // Last: 23974.15
  /\bClose[:\s]+([\d,]+(?:\.\d+)?)/i,       // Close: 23974.15
];

const SYMBOL_SELECTORS = [
  '[data-name="legend"] [class*="title"]',
  '[class*="pane-legend-title"]',
  '[class*="chart-symbol-header"]',
  '[class*="symbol-title"]',
  '[class*="apply-overflow-tooltip"]',
];

export const tradingViewAdapter: BrokerAdapter = {
  name: 'TradingView',
  hostPatterns: ['tradingview.com'],
  
  detect: () => {
    const win = window as unknown as Record<string, unknown>;
    const hasGlobalTV = 
      typeof win['TradingView'] !== 'undefined' ||
      typeof win['tvWidget'] !== 'undefined' ||
      typeof win['Datafeeds'] !== 'undefined';
    
    const tvSelectors = [
      '[class*="chart-container"]',
      '[class*="tv-chart"]',
      '[class*="layout__area"]',
      '[data-name="legend"]',
      '[class*="pane-legend"]',
      '.chart-toolbar',
      '[id*="tv_chart"]',
      '[class*="widgetbar"]',
      '[class*="chart-widget"]',
    ];
    const hasTVDom = tvSelectors.some(s => document.querySelector(s) !== null);
    
    return hasGlobalTV || hasTVDom;
  },
  
  extractSymbol: () => {
    // Try specific selectors first
    for (const sel of SYMBOL_SELECTORS) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const sym = parseSymbol(el.textContent, COMMON_SYMBOL_PATTERNS, COMMON_INVALID_SYMBOLS);
        if (sym) return sym;
      }
    }
    
    // Fallback: page title
    const titleMatch = document.title.toUpperCase().match(/^([A-Z0-9]+)/);
    if (titleMatch && !COMMON_INVALID_SYMBOLS.has(titleMatch[1]) && titleMatch[1].length >= 2) {
      return titleMatch[1];
    }
    
    return null;
  },
  
  extractPrice: () => {
    // Strategy 1: Page title (most reliable - "NIFTY 23,976.70 +257.40 (+1.09%)")
    const titleMatch = document.title.match(/(\d[\d,]*\.\d{2})/);
    if (titleMatch) {
      const price = parseFloat(titleMatch[1].replace(/,/g, ''));
      if (price >= 100 && price <= 100000 && !isNaN(price)) {
        return price;
      }
    }
    
    // Strategy 2: Try specific selectors
    for (const sel of PRICE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el?.textContent) {
        const price = parsePrice(el.textContent, PRICE_PATTERNS);
        if (price !== null) return price;
      }
    }
    
    // Strategy 3: Fallback body text
    const bodyText = document.body?.innerText ?? '';
    return parsePrice(bodyText, PRICE_PATTERNS);
  },
};
