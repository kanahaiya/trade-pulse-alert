/**
 * Broker Adapters Index
 * 
 * This file registers all broker adapters with the registry.
 * The broker adapter pattern allows easy addition of new brokers
 * without modifying existing code.
 * 
 * ═══════════════════════════════════════════════════════════════
 * HOW TO ADD A NEW BROKER:
 * ═══════════════════════════════════════════════════════════════
 * 
 * 1. Copy _template.ts to a new file (e.g., zerodha.ts)
 * 2. Update the adapter with broker-specific:
 *    - name: Display name
 *    - hostPatterns: URL patterns to match
 *    - detect(): How to detect if broker's chart is present
 *    - extractSymbol(): How to get the trading symbol
 *    - extractPrice(): How to get the live price
 * 3. Import and register below (more specific brokers first)
 * 
 * ═══════════════════════════════════════════════════════════════
 * SUPPORTED BROKERS:
 * ═══════════════════════════════════════════════════════════════
 * - Sensibull (sensibull.com)
 * - TradingView (tradingview.com) - also works as fallback for
 *   any site using TradingView charting library
 * 
 * PLANNED:
 * - Zerodha Kite (kite.zerodha.com)
 * - Dhan (dhan.co)
 * - Groww (groww.in)
 * - Fyers (fyers.in)
 * - Upstox (upstox.com)
 * - Angel One (angelone.in)
 * ═══════════════════════════════════════════════════════════════
 */

import { registerBroker } from '../brokerRegistry';
import { tradingViewAdapter } from './tradingview';
import { sensibullAdapter } from './sensibull';

// Register all adapters
// ORDER MATTERS: More specific brokers should come FIRST
// TradingView should be LAST as it's the fallback for embedded charts
registerBroker(sensibullAdapter);
registerBroker(tradingViewAdapter);  // Fallback - works on any TradingView-powered site

// Export for direct access if needed
export { tradingViewAdapter, sensibullAdapter };
