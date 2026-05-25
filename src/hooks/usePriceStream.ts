import { useState, useEffect, useCallback } from 'react';

interface PriceData {
  price: number | null;
  symbol: string | null;
}

// Function to extract price from page - injected via chrome.scripting
function extractPriceFromPage(): PriceData {
  const priceSelectors = [
    '[data-name="legend"]',
    '[class*="pane-legend-line"]',
    '[class*="legend-series-item"]',
    '[class*="price-axis-last-price"]',
    '[class*="last-price"]',
  ];
  
  const priceRegexes = [
    /\bC\s+([\d,]+\.\d+)/,
    /\bLTP[:\s]*([\d,]+\.\d+)/i,
    /\bLast[:\s]+([\d,]+\.\d+)/i,
    /\bClose[:\s]+([\d,]+\.\d+)/i,
  ];
  
  let price: number | null = null;
  
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
  const symbolSelectors = [
    '[data-name="legend"] [class*="title"]',
    '[class*="pane-legend-title"]',
    '[class*="apply-overflow-tooltip"]',
  ];
  
  const invalidSymbols = new Set(['THE', 'AND', 'FOR', 'NOT', 'NSE', 'BSE', 'MCX', 'INR', 'USD']);
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
