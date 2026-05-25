import type { StoredAlert } from '../types/alert.types';

interface AlertItemProps {
  alert: StoredAlert;
  onDelete: (id: string) => void;
}

export function AlertItem({ alert, onDelete }: AlertItemProps) {
  const conditionSymbol = alert.condition === 'CROSS_ABOVE' ? '>' : '<';
  const conditionColor = alert.condition === 'CROSS_ABOVE' ? 'text-success' : 'text-danger';
  const isTriggered = alert.status === 'TRIGGERED';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
        isTriggered
          ? 'bg-card/50 border-border/50'
          : 'bg-card border-border'
      }`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`font-mono text-sm ${conditionColor}`}>
          {alert.symbol} {conditionSymbol} ₹{alert.targetPrice.toLocaleString('en-IN')}
        </span>
        {isTriggered && alert.triggeredAt && (
          <span className="text-xs text-muted">
            ✓ {formatTime(alert.triggeredAt)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            isTriggered
              ? 'bg-muted/20 text-muted'
              : 'bg-success/20 text-success'
          }`}
        >
          {alert.status}
        </span>
        <button
          onClick={() => onDelete(alert.id)}
          className="p-1 text-muted hover:text-danger transition-colors"
          title="Delete alert"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
