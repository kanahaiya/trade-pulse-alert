import type { StoredAlert, AlertCondition } from '../types/alert.types';
import { AlertItem } from './AlertItem';

interface AlertListProps {
  activeAlerts: StoredAlert[];
  triggeredAlerts: StoredAlert[];
  onDelete: (id: string) => void;
  onEdit: (id: string, targetPrice: number, condition: AlertCondition) => void;
  onClearActive: () => void;
  onClearTriggered: () => void;
}

export function AlertList({
  activeAlerts,
  triggeredAlerts,
  onDelete,
  onEdit,
  onClearActive,
  onClearTriggered,
}: AlertListProps) {
  const hasAlerts = activeAlerts.length > 0 || triggeredAlerts.length > 0;

  if (!hasAlerts) {
    return (
      <div className="text-center py-8 text-muted">
        <p className="text-2xl mb-2">🔔</p>
        <p className="text-sm">No alerts set</p>
        <p className="text-xs mt-1">Create an alert above to get started</p>
      </div>
    );
  }

  // Sort alerts by createdAt in descending order (newest first)
  const sortedActiveAlerts = [...activeAlerts].sort(
    (a, b) => b.createdAt - a.createdAt
  );
  const sortedTriggeredAlerts = [...triggeredAlerts].sort(
    (a, b) => b.createdAt - a.createdAt
  );

  return (
    <div className="space-y-4">
      {sortedActiveAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white">
              Active Alerts ({sortedActiveAlerts.length})
            </h3>
            <button
              onClick={onClearActive}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {sortedActiveAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDelete={onDelete} onEdit={onEdit} />
            ))}
          </div>
        </div>
      )}

      {sortedTriggeredAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted">
              Triggered ({sortedTriggeredAlerts.length})
            </h3>
            <button
              onClick={onClearTriggered}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {sortedTriggeredAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
