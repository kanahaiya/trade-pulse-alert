const PRICE_REGEXES = [
  /\bC\s+([\d,]+\.\d+)/,                    // C 23,719.30
  /\bLTP[:\s]+([\d,]+\.\d+)/i,              // LTP: 450.25
  /\bLast[:\s]+([\d,]+\.\d+)/i,             // Last: 500.00
  /\bClose[:\s]+([\d,]+\.\d+)/i,            // Close: 200.50
  /\b([\d,]+\.\d{2})\s*₹/,                  // 209.14 ₹
  /₹\s*([\d,]+\.\d{2})/,                    // ₹ 209.14
  /\bO\s+[\d,]+\.\d+\s+H\s+[\d,]+\.\d+\s+L\s+[\d,]+\.\d+\s+C\s+([\d,]+\.\d+)/, // OHLC format
];

export function normalizePrice(raw: string): number {
  return parseFloat(raw.replace(/,/g, ''));
}

export function isReasonablePrice(price: number): boolean {
  return price > 0 && price < 1_000_000 && !isNaN(price);
}

export function parseFromText(text: string): number | null {
  for (const regex of PRICE_REGEXES) {
    const match = text.match(regex);
    if (match) {
      const price = normalizePrice(match[1]);
      if (isReasonablePrice(price)) {
        return price;
      }
    }
  }
  return null;
}

function extractFromChartHeader(): number | null {
  const legendEl = document.querySelector('[data-name="legend"]');
  if (!legendEl) return null;
  return parseFromText(legendEl.textContent ?? '');
}

function extractFromLegend(): number | null {
  const selectors = [
    '[class*="pane-legend-line"]',
    '[class*="legend-series-item"]',
    '[class*="price-axis"]',
    '[class*="lastPrice"]',
    '[class*="current-price"]',
    '[class*="highlight-"]',
    '[class*="valuesWrapper"]',
    '[class*="valueValue"]',
    '[class*="priceWrapper"]',
    '[class*="mainValue"]',
  ];
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) {
      const price = parseFromText(el.textContent ?? '');
      if (price !== null) return price;
    }
  }
  return null;
}

function extractFromTradingViewHeader(): number | null {
  // TradingView shows price in header like: "207.00 H209.40 L204.06 C209.14 +6.00 (+2.97%)"
  const headerSelectors = [
    '[class*="symbolPrimaryValue"]',
    '[class*="last-"]',
    '[class*="tv-symbol-price-quote__value"]',
    '[class*="js-symbol-last"]',
    '[class*="tickerPrice"]',
  ];
  
  for (const sel of headerSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent ?? '';
      const cleanText = text.replace(/[^\d.,]/g, '');
      const price = normalizePrice(cleanText);
      if (isReasonablePrice(price)) {
        return price;
      }
    }
  }
  return null;
}

function extractFromDOMText(): number | null {
  const bodyText = document.body.innerText;
  return parseFromText(bodyText);
}

export function extractLivePrice(): number | null {
  const strategies: Array<() => number | null> = [
    extractFromTradingViewHeader,
    extractFromChartHeader,
    extractFromLegend,
    extractFromDOMText,
  ];

  for (const strategy of strategies) {
    const result = strategy();
    if (result !== null && isReasonablePrice(result)) {
      return result;
    }
  }
  return null;
}
