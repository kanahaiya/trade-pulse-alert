import type { DetectionResult } from '../types/detection.types';

interface DetectionStatusProps {
  result: DetectionResult;
  isLoading: boolean;
}

export function DetectionStatus({ result, isLoading }: DetectionStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-card rounded-lg border border-border">
        <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted">Detecting chart...</span>
      </div>
    );
  }

  if (!result.supported) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 bg-danger/10 rounded-lg border border-danger/30">
        <span className="text-lg">❌</span>
        <div>
          <p className="text-sm font-medium text-danger">Not Supported</p>
          <p className="text-xs text-muted">This site is not supported yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-success/10 rounded-lg border border-success/30">
      <span className="text-lg">✅</span>
      <div>
        <p className="text-sm font-medium text-success">
          {result.broker || 'TradingView'} — Supported
        </p>
        {result.symbol && (
          <p className="text-xs text-muted">Symbol detected: {result.symbol}</p>
        )}
      </div>
    </div>
  );
}
