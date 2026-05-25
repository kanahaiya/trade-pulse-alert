interface PriceDisplayProps {
  symbol: string | null;
  price: number | null;
  broker?: string | null;
}

export function PriceDisplay({ symbol, price, broker }: PriceDisplayProps) {
  if (!symbol && price === null) {
    return null;
  }

  const hasPriceIssue = price === null;

  return (
    <div className="px-4 py-3 bg-card rounded-lg border border-border">
      <div className="flex items-center justify-between">
        <div>
          {symbol && (
            <p className="text-lg font-bold text-white flex items-center gap-2">
              📈 {symbol}
            </p>
          )}
          {price !== null ? (
            <p className="text-2xl font-mono font-bold text-brand">
              ₹{price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          ) : (
            <p className="text-sm text-yellow-500">
              ⚠️ Price not detected
            </p>
          )}
        </div>
        {price !== null ? (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
            </span>
            <span className="text-xs text-success font-medium">LIVE</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
            </span>
            <span className="text-xs text-yellow-500 font-medium">NO DATA</span>
          </div>
        )}
      </div>
      {hasPriceIssue && (
        <p className="text-xs text-muted mt-2">
          Unable to read price from {broker || 'this platform'}. Alerts may not work correctly.
        </p>
      )}
    </div>
  );
}
