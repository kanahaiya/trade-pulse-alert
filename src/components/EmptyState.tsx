export function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="text-4xl mb-3">🔔</div>
      <p className="text-sm text-muted">No alerts set yet</p>
      <p className="text-xs text-muted mt-1">
        Set a target price above to get notified
      </p>
    </div>
  );
}
