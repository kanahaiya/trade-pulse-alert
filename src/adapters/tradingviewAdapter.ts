import type { DetectionResult } from '../types/detection.types';

// ─── Detection Heuristics ────────────────────────────────────────────────────

function hasGlobalTVObject(): boolean {
  const win = window as unknown as Record<string, unknown>;
  return (
    typeof win['TradingView'] !== 'undefined' ||
    typeof win['tvWidget'] !== 'undefined' ||
    typeof win['Datafeeds'] !== 'undefined'
  );
}

function hasTVDomElements(): boolean {
  const selectors = [
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
  return selectors.some((s) => document.querySelector(s) !== null);
}

function hasTVScripts(): boolean {
  return Array.from(document.querySelectorAll('script[src]')).some((el) => {
    const src = (el as HTMLScriptElement).src;
    return src.includes('tradingview') || src.includes('tv-charts') || src.includes('charting_library');
  });
}

function hasTVIframes(): boolean {
  return Array.from(document.querySelectorAll('iframe[src]')).some((el) => {
    const src = (el as HTMLIFrameElement).src;
    return src.includes('tradingview') || src.includes('s3.tradingview.com');
  });
}

function isTradingViewEnvironment(): boolean {
  return (
    hasGlobalTVObject() ||
    hasTVDomElements() ||
    hasTVScripts() ||
    hasTVIframes()
  );
}

// ─── Broker Detection ────────────────────────────────────────────────────────

export function detectBroker(): string {
  const host = window.location.hostname;
  if (host.includes('kite.zerodha')) return 'Zerodha Kite';
  if (host.includes('dhan.co')) return 'Dhan';
  if (host.includes('tradingview.com')) return 'TradingView';
  if (host.includes('sensibull.com')) return 'Sensibull';
  if (host.includes('groww.in')) return 'Groww';
  if (host.includes('fyers.in')) return 'Fyers';
  if (host.includes('upstox.com')) return 'Upstox';
  if (host.includes('angelone.in')) return 'Angel One';
  return 'TradingView Platform';
}

// ─── Symbol Extraction ───────────────────────────────────────────────────────

const SYMBOL_SELECTORS = [
  '[data-name="legend"] [class*="title"]',
  '[class*="pane-legend-title"]',
  '[class*="chart-symbol-header"]',
  '[class*="symbol-title"]',
  '[class*="apply-overflow-tooltip"]',
  'title',
];

const SYMBOL_PATTERNS = [
  /\b(BANKNIFTY\s*\d{2}[A-Z]{3}\d{2}\s*\d+\s*(?:CE|PE))\b/i,
  /\b(NIFTY\s*\d{2}[A-Z]{3}\d{2}\s*\d+\s*(?:CE|PE))\b/i,
  /\b(BANKNIFTY\s+\d+\s*(?:CE|PE))\b/i,
  /\b(NIFTY\s+\d+\s*(?:CE|PE))\b/i,
  /\b(BANKNIFTY\s*FUT)\b/i,
  /\b(NIFTY\s*FUT)\b/i,
  /\b(BANKNIFTY)\b/i,
  /\b(NIFTY\s*50)\b/i,
  /\b(NIFTY)\b/i,
  /\b([A-Z]{2,10})\b/,
];

const INVALID_SYMBOLS = new Set([
  'THE', 'AND', 'FOR', 'NOT', 'BUT', 'ARE', 'YOU', 'ALL', 'CAN', 'HAD',
  'HAS', 'WAS', 'HER', 'HIS', 'ITS', 'OUR', 'OUT', 'WHO', 'NOW', 'NEW',
  'GET', 'SET', 'BUY', 'PUT', 'DID', 'SAY', 'USE', 'WAY', 'MAY', 'DAY',
  'OPT', 'LTP', 'NSE', 'BSE', 'MCX', 'INR', 'USD',
]);

function parseSymbol(text: string): string | null {
  const upper = text.toUpperCase();
  for (const pattern of SYMBOL_PATTERNS) {
    const match = upper.match(pattern);
    if (match) {
      const sym = match[1].trim().replace(/\s+/g, ' ');
      if (!INVALID_SYMBOLS.has(sym)) return sym;
    }
  }
  return null;
}

export function extractSymbol(): string | null {
  // Priority 1: Specific TV elements
  for (const sel of SYMBOL_SELECTORS) {
    const el = document.querySelector(sel);
    if (el?.textContent) {
      const sym = parseSymbol(el.textContent);
      if (sym) return sym;
    }
  }

  // Priority 2: Page title
  const fromTitle = parseSymbol(document.title);
  if (fromTitle) return fromTitle;

  // Priority 3: Body text (first 3000 chars)
  const bodyChunk = document.body?.innerText?.slice(0, 3000) ?? '';
  return parseSymbol(bodyChunk);
}

// ─── Price Extraction ────────────────────────────────────────────────────────

const PRICE_SELECTORS = [
  '[data-name="legend"]',
  '[class*="pane-legend-line"]',
  '[class*="legend-series-item"]',
  '[class*="price-axis-last-price"]',
  '[class*="last-price"]',
  '[class*="ltp"]',
  '[class*="current-price"]',
  '[class*="lastPrice"]',
  '[class*="spot-price"]',
  '[class*="underlying-price"]',
];

const PRICE_REGEXES = [
  /\bC\s+([\d,]+\.\d+)/,                           // C 23,719.30
  /\bLTP[:\s]*([\d,]+\.\d+)/i,                     // LTP: 23719.30 or LTP23719.30
  /\bLast[:\s]+([\d,]+\.\d+)/i,                    // Last: 23719.30
  /\bClose[:\s]+([\d,]+\.\d+)/i,                   // Close: 23719.30
  /\bO\s*[\d,]+\.\d+\s*H\s*[\d,]+\.\d+\s*L\s*[\d,]+\.\d+\s*C\s*([\d,]+\.\d+)/, // OHLC
  /₹\s*([\d,]+\.\d+)/,                             // ₹ 23,719.30
  /([\d,]+\.\d+)\s*₹/,                             // 23,719.30 ₹
  /\b([\d,]{4,}(?:\.\d{1,2})?)\b/,                 // Any 4+ digit number with optional decimals
];

function parsePrice(text: string): number | null {
  for (const regex of PRICE_REGEXES) {
    const match = text.match(regex);
    if (match) {
      const price = parseFloat(match[1].replace(/,/g, ''));
      if (price > 0 && price < 1_000_000 && !isNaN(price)) {
        return price;
      }
    }
  }
  return null;
}

export function extractLivePrice(): number | null {
  // Strategy 1: Page title (most reliable - "NIFTY 23,976.70 +257.40 (+1.09%)")
  const titleMatch = document.title.match(/(\d[\d,]*\.\d{2})/);
  if (titleMatch) {
    const price = parseFloat(titleMatch[1].replace(/,/g, ''));
    if (price >= 100 && price <= 100000 && !isNaN(price)) {
      return price;
    }
  }

  // Strategy 2: Specific TV legend elements
  for (const sel of PRICE_SELECTORS) {
    const el = document.querySelector(sel);
    if (el?.textContent) {
      const price = parsePrice(el.textContent);
      if (price !== null) return price;
    }
  }

  // Strategy 3: Full body text
  const bodyText = document.body?.innerText ?? '';
  return parsePrice(bodyText);
}

// ─── Main Detection Entry ────────────────────────────────────────────────────

export function detectTradingViewEnvironment(): DetectionResult {
  const supported = isTradingViewEnvironment();

  if (!supported) {
    return { supported: false, symbol: null, price: null, broker: null };
  }

  return {
    supported: true,
    symbol: extractSymbol(),
    price: extractLivePrice(),
    broker: detectBroker(),
  };
}
