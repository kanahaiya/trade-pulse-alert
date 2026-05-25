import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  price: number | null;
  symbol: string | null;
}

// Function to extract price from page - injected via chrome.scripting
function extractPriceFromPage(): PriceData {
  const host = window.location.hostname;
  const isSensibull = host.includes('sensibull.com');
  
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
  
  const priceRegexes = [
    /\bC\s+([\d,]+\.\d+)/,                           // TradingView: C 23,974.15
    /\bLTP[:\s]*([\d,]+(?:\.\d+)?)/i,                // LTP: 23974.15
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
    const allText = document.body?.innerText || document.body?.textContent || '';
    
    // Multiple patterns to catch different formats
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
  
  // Strategy 3: Full body text scan
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

  // Symbol extraction
  const sensibullSymbolSelectors = [
    '.symbol-name',
    '[class*="underlying"]',
    '[class*="spot-symbol"]',
  ];
  
  const tvSymbolSelectors = [
    '[data-name="legend"] [class*="title"]',
    '[class*="pane-legend-title"]',
    '[class*="apply-overflow-tooltip"]',
  ];
  
  const symbolSelectors = isSensibull 
    ? [...sensibullSymbolSelectors, ...tvSymbolSelectors]
    : tvSymbolSelectors;
  
  const invalidSymbols = new Set(['THE', 'AND', 'FOR', 'NOT', 'NSE', 'BSE', 'MCX', 'INR', 'USD', 'SPOT', 'INDEX']);
  let symbol: string | null = null;
  
  for (const sel of symbolSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent) {
      const match = el.textContent.toUpperCase().match(/\b([A-Z]{2,10})\b/);
      if (match && !invalidSymbols.has(match[1])) {
        symbol = match[1];
        break;
      }
    }
  }

  return { price, symbol };
}

export function usePriceStream(enabled: boolean = true) {
  const [price, setPrice] = useState<number | null>(null);
  const [symbol, setSymbol] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPriceFromPage,
      });

      if (results && results[0]?.result) {
        const data = results[0].result as PriceData;
        if (data.price !== null) {
          setPrice(data.price);
        }
        if (data.symbol !== null) {
          setSymbol(data.symbol);
        }
      }
    } catch {
      // Silently ignore errors
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    fetchPrice();
    const intervalId = setInterval(fetchPrice, 1000);

    return () => clearInterval(intervalId);
  }, [enabled, fetchPrice]);

  return { price, symbol };
}
