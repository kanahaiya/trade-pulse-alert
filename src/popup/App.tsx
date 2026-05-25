import { useDetection } from '../hooks/useDetection';
import { useAlerts } from '../hooks/useAlerts';
import { usePriceStream } from '../hooks/usePriceStream';
import { DetectionStatus } from '../components/DetectionStatus';
import { PriceDisplay } from '../components/PriceDisplay';
import { AlertForm } from '../components/AlertForm';
import { AlertList } from '../components/AlertList';

export default function App() {
  const { detection, isLoading: isDetecting } = useDetection();
  const {
    activeAlerts,
    triggeredAlerts,
    addAlert,
    deleteAlert,
    clearTriggered,
  } = useAlerts();

  const { price, symbol } = usePriceStream(detection.supported);

  const displaySymbol = symbol || detection.symbol || 'Unknown';
  const displayPrice = price ?? detection.price;

  const handleAddAlert = async (targetPrice: number, condition: 'CROSS_ABOVE' | 'CROSS_BELOW') => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await addAlert(displaySymbol, targetPrice, condition, tab?.url || '');
  };

  return (
    <div className="min-h-screen bg-surface p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <h1 className="text-lg font-bold text-white">TradePulse Alert</h1>
        </div>
        <span className="text-xs text-muted">v1.0.0</span>
      </div>

      {/* Detection Status */}
      <div className="mb-4">
        <DetectionStatus result={detection} isLoading={isDetecting} />
      </div>

      {/* Price Display */}
      {detection.supported && (
        <div className="mb-4">
          <PriceDisplay symbol={displaySymbol} price={displayPrice} broker={detection.broker} />
        </div>
      )}

      {/* Alert Form */}
      {detection.supported && (
        <div className="mb-4 p-4 bg-card rounded-lg border border-border">
          <AlertForm
            symbol={displaySymbol}
            currentPrice={displayPrice}
            onSubmit={handleAddAlert}
            disabled={!detection.supported || !displaySymbol || displayPrice === null}
          />
          {displayPrice === null && (
            <p className="text-xs text-yellow-500 mt-2">
              ⚠️ Cannot set alerts without live price data
            </p>
          )}
        </div>
      )}

      {/* Alert List */}
      <div className="p-4 bg-card rounded-lg border border-border">
        <AlertList
          activeAlerts={activeAlerts}
          triggeredAlerts={triggeredAlerts}
          onDelete={deleteAlert}
          onClearTriggered={clearTriggered}
        />
      </div>
    </div>
  );
}
