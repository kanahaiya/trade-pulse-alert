const SYMBOL_PATTERNS = [
  /\b(NIFTY\s*\d*\s*(?:CE|PE)?(?:\s*\d+)?)\b/i,
  /\b(BANKNIFTY\s*\d*\s*(?:CE|PE)?(?:\s*\d+)?)\b/i,
  /\b(SENSEX\s*\d*\s*(?:CE|PE)?(?:\s*\d+)?)\b/i,
  /\b(FINNIFTY\s*\d*\s*(?:CE|PE)?(?:\s*\d+)?)\b/i,
  /\b([A-Z]{2,15})(?:\s*(?:FUT|CE|PE|EQ))?\b/,
];

export function extractSymbol(): string | null {
  // Try TradingView-specific selectors first
  const tvSymbolSelectors = [
    '[class*="titleWrapper"] [class*="title"]',
    '[class*="symbolTitle"]',
    '[class*="pane-legend-title"]',
    '[class*="chart-symbol"]',
    '[data-name="legend"] [class*="title"]',
    '[class*="symbol-title"]',
    '[class*="tv-symbol-header"]',
    '[class*="header-symbol"]',
    '[class*="tickerName"]',
  ];

  for (const sel of tvSymbolSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      const text = el.textContent?.trim();
      if (text && text.length >= 2 && text.length <= 30) {
        // Clean up symbol - remove exchange prefix like "NSE:"
        const cleaned = text.replace(/^[A-Z]+:/, '').trim();
        if (isValidSymbol(cleaned)) {
          return cleaned.toUpperCase();
        }
      }
    }
  }

  // Fallback to URL parsing for TradingView
  const urlMatch = window.location.href.match(/symbol=([A-Z]+)[:%]3A([A-Z0-9]+)/i);
  if (urlMatch) {
    return urlMatch[2].toUpperCase();
  }

  // Try page title
  const titleMatch = document.title.match(/^([A-Z0-9]+)\s/);
  if (titleMatch && isValidSymbol(titleMatch[1])) {
    return titleMatch[1].toUpperCase();
  }

  const sources = [
    () => document.title,
    () => document.body.innerText.slice(0, 2000),
  ];

  for (const source of sources) {
    const text = source() ?? '';
    for (const pattern of SYMBOL_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const symbol = match[1].trim().replace(/\s+/g, ' ').toUpperCase();
        if (isValidSymbol(symbol)) {
          return symbol;
        }
      }
    }
  }
  return null;
}

function isValidSymbol(symbol: string): boolean {
  const invalidSymbols = ['THE', 'AND', 'FOR', 'WITH', 'FROM', 'THIS', 'THAT', 'CHART', 'PRICE', 'OPEN', 'HIGH', 'LOW', 'CLOSE', 'VOLUME'];
  return symbol.length >= 2 && symbol.length <= 30 && !invalidSymbols.includes(symbol);
}
