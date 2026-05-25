import { useState } from 'react';
import type { StoredAlert, AlertCondition } from '../types/alert.types';

interface AlertItemProps {
  alert: StoredAlert;
  onDelete: (id: string) => void;
  onEdit?: (id: string, targetPrice: number, condition: AlertCondition) => void;
}

export function AlertItem({ alert, onDelete, onEdit }: AlertItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(alert.targetPrice.toString());
  const [editCondition, setEditCondition] = useState<AlertCondition>(alert.condition);

  const conditionSymbol = alert.condition === 'CROSS_ABOVE' ? '>' : '<';
  const conditionColor = alert.condition === 'CROSS_ABOVE' ? 'text-success' : 'text-danger';
  const isTriggered = alert.status === 'TRIGGERED';

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSave = () => {
    const price = parseFloat(editPrice);
    if (!isNaN(price) && price > 0 && onEdit) {
      onEdit(alert.id, price, editCondition);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditPrice(alert.targetPrice.toString());
    setEditCondition(alert.condition);
    setIsEditing(false);
  };

  if (isEditing && !isTriggered) {
    return (
      <div className="px-3 py-2 rounded-lg border bg-card border-primary/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-white">{alert.symbol}</span>
          <select
            value={editCondition}
            onChange={(e) => setEditCondition(e.target.value as AlertCondition)}
            className="text-xs bg-surface border border-border rounded px-2 py-1 text-white"
          >
            <option value="CROSS_ABOVE">↑ Cross Above</option>
            <option value="CROSS_BELOW">↓ Cross Below</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={editPrice}
            onChange={(e) => setEditPrice(e.target.value)}
            className="flex-1 bg-surface border border-border rounded px-2 py-1 text-white text-sm"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-2 py-1 bg-success text-white text-xs rounded hover:bg-success/80"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-2 py-1 bg-muted/20 text-muted text-xs rounded hover:bg-muted/30"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

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
        {!isTriggered && onEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-muted hover:text-primary transition-colors"
            title="Edit alert"
          >
            ✏️
          </button>
        )}
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
