import { useState, useEffect, useCallback } from 'react';
import type { DetectionResult } from '../types/detection.types';

const INITIAL_STATE: DetectionResult = {
  supported: false,
  symbol: null,
  price: null,
  broker: null,
};

// Detection function to be injected into the page
function detectInPage(): DetectionResult {
  // Detection heuristics
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

  const hasTVScripts = Array.from(document.querySelectorAll('script[src]')).some(el => {
    const src = (el as HTMLScriptElement).src;
    return src.includes('tradingview') || src.includes('tv-charts') || src.includes('charting_library');
  });

  const hasTVIframes = Array.from(document.querySelectorAll('iframe[src]')).some(el => {
    const src = (el as HTMLIFrameElement).src;
    return src.includes('tradingview') || src.includes('s3.tradingview.com');
  });

  const supported = hasGlobalTV || hasTVDom || hasTVScripts || hasTVIframes;

  if (!supported) {
    return { supported: false, symbol: null, price: null, broker: null };
  }

  // Broker detection
  const host = window.location.hostname;
  let broker = 'TradingView Platform';
  if (host.includes('kite.zerodha')) broker = 'Zerodha Kite';
  else if (host.includes('dhan.co')) broker = 'Dhan';
  else if (host.includes('tradingview.com')) broker = 'TradingView';
  else if (host.includes('sensibull.com')) broker = 'Sensibull';
  else if (host.includes('groww.in')) broker = 'Groww';
  else if (host.includes('fyers.in')) broker = 'Fyers';
  else if (host.includes('upstox.com')) broker = 'Upstox';
  else if (host.includes('angelone.in')) broker = 'Angel One';

  // Symbol extraction - broker-specific first, then generic
  const isSensibull = host.includes('sensibull.com');
  
  // Sensibull-specific symbol selectors
  const sensibullSymbolSelectors = [
    '.symbol-name',
    '[class*="underlying"]',
    '[class*="spot-symbol"]',
    '.instrument-name',
  ];
  
  // TradingView / generic symbol selectors
  const tvSymbolSelectors = [
    '[data-name="legend"] [class*="title"]',
    '[class*="pane-legend-title"]',
    '[class*="chart-symbol-header"]',
    '[class*="symbol-title"]',
    '[class*="apply-overflow-tooltip"]',
  ];
  
  const symbolSelectors = isSensibull 
    ? [...sensibullSymbolSelectors, ...tvSymbolSelectors]
    : tvSymbolSelectors;
  
  const symbolPatterns = [
    /\b(BANKNIFTY\s*\d{2}[A-Z]{3}\d{2}\s*\d+\s*(?:CE|PE))\b/i,
    /\b(NIFTY\s*\d{2}[A-Z]{3}\d{2}\s*\d+\s*(?:CE|PE))\b/i,
    /\b(BANKNIFTY)\b/i,
    /\b(NIFTY\s*50)\b/i,
    /\b(NIFTY)\b/i,
    /\b(SENSEX)\b/i,
    /\b(FINNIFTY)\b/i,
    /\b([A-Z]{2,10})\b/,
  ];
  
  const invalidSymbols = new Set(['THE', 'AND', 'FOR', 'NOT', 'NSE', 'BSE', 'MCX', 'INR', 'USD', 'SPOT', 'INDEX', 'CHART']);
  
  let symbol: string | null = null;
  for (const sel of symbolSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent) {
      const text = el.textContent.toUpperCase().trim();
      for (const pattern of symbolPatterns) {
        const match = text.match(pattern);
        if (match && !invalidSymbols.has(match[1])) {
          symbol = match[1].trim();
          break;
        }
      }
      if (symbol) break;
    }
  }
  
  // Fallback: page title
  if (!symbol) {
    const titleMatch = document.title.toUpperCase().match(/^([A-Z0-9]+)/);
    if (titleMatch && !invalidSymbols.has(titleMatch[1]) && titleMatch[1].length >= 2) {
      symbol = titleMatch[1];
    }
  }

  // Price extraction - broker-specific first, then generic
  // Sensibull-specific price selectors
  const sensibullPriceSelectors = [
    '[class*="spot-price"]',
    '[class*="underlying-price"]',
    '[class*="ltp"]',
    '[class*="last-price"]',
    '[class*="current-price"]',
    '.spot-value',
    '.ltp-value',
  ];
  
  // TradingView / generic price selectors
  const tvPriceSelectors = [
    '[data-name="legend"]',
    '[class*="pane-legend-line"]',
    '[class*="legend-series-item"]',
    '[class*="price-axis-last-price"]',
    '[class*="last-price"]',
  ];
  
  const priceSelectors = isSensibull 
    ? [...sensibullPriceSelectors, ...tvPriceSelectors]
    : tvPriceSelectors;
  
  // Price regex patterns - order matters (most specific first)
  const priceRegexes = [
    /\bC\s+([\d,]+\.\d+)/,                           // TradingView: C 23,974.15
    /\bLTP[:\s]*([\d,]+(?:\.\d+)?)/i,                // LTP: 23974.15 or LTP 23974
    /\bLast[:\s]+([\d,]+(?:\.\d+)?)/i,               // Last: 23974.15
    /\bClose[:\s]+([\d,]+(?:\.\d+)?)/i,              // Close: 23974.15
    /\bSpot[:\s]*([\d,]+(?:\.\d+)?)/i,               // Spot: 23974.15 (Sensibull)
    /₹\s*([\d,]+(?:\.\d+)?)/,                        // ₹ 23,974.15
    /([\d,]+(?:\.\d+)?)\s*₹/,                        // 23,974.15 ₹
  ];
  
  let price: number | null = null;
  
  // Strategy 1: Try specific selectors
  for (const sel of priceSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent) {
      for (const regex of priceRegexes) {
        const match = el.textContent.match(regex);
        if (match) {
          const p = parseFloat(match[1].replace(/,/g, ''));
          if (p > 0 && p < 1_000_000 && !isNaN(p)) {
            price = p;
            break;
          }
        }
      }
      if (price) break;
    }
  }
  
  // Strategy 2: For Sensibull, scan ALL text for price
  if (!price && isSensibull) {
    // Get all text from the page - use innerText for visible text
    const allText = document.body?.innerText || document.body?.textContent || '';
    
    // Multiple patterns to catch different formats
    // Pattern 1: "23,982.75" (with comma)
    // Pattern 2: "23982.75" (without comma)
    const patterns = [
      /(\d{2},\d{3}\.\d{2})/g,   // 23,982.75
      /(\d{5}\.\d{2})/g,         // 23982.75
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(allText)) !== null) {
        const priceStr = match[1].replace(/,/g, '');
        const p = parseFloat(priceStr);
        // NIFTY: 15000-30000, BANKNIFTY: 40000-60000
        if (p >= 15000 && p <= 65000) {
          price = p;
          break;
        }
      }
      if (price) break;
    }
  }
  
  // Strategy 3: Full body text scan (last resort)
  if (!price) {
    const bodyText = document.body?.innerText ?? '';
    for (const regex of priceRegexes) {
      const match = bodyText.match(regex);
      if (match) {
        const p = parseFloat(match[1].replace(/,/g, ''));
        if (p > 0 && p < 1_000_000 && !isNaN(p)) {
          price = p;
          break;
        }
      }
    }
  }

  return { supported, symbol, price, broker };
}

export function useDetection() {
  const [detection, setDetection] = useState<DetectionResult>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetection = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setDetection(INITIAL_STATE);
        setError('No active tab found');
        return;
      }

      // Use chrome.scripting.executeScript to inject detection directly
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: detectInPage,
      });

      if (results && results[0]?.result) {
        setDetection(results[0].result as DetectionResult);
      } else {
        setDetection(INITIAL_STATE);
        setError('Could not detect chart on this page');
      }
    } catch (err) {
      setDetection(INITIAL_STATE);
      setError('Could not detect chart on this page');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetection();
  }, [fetchDetection]);

  return { detection, isLoading, error, refetch: fetchDetection };
}
