import type { StoredAlert } from '../types/alert.types';
import { AlertItem } from './AlertItem';
import { EmptyState } from './EmptyState';

interface AlertListProps {
  activeAlerts: StoredAlert[];
  triggeredAlerts: StoredAlert[];
  onDelete: (id: string) => void;
  onClearTriggered: () => void;
}

export function AlertList({
  activeAlerts,
  triggeredAlerts,
  onDelete,
  onClearTriggered,
}: AlertListProps) {
  const hasAlerts = activeAlerts.length > 0 || triggeredAlerts.length > 0;

  if (!hasAlerts) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {activeAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">
            Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}

      {triggeredAlerts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-muted">
              Triggered ({triggeredAlerts.length})
            </h3>
            <button
              onClick={onClearTriggered}
              className="text-xs text-muted hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {triggeredAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onDelete={onDelete} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
