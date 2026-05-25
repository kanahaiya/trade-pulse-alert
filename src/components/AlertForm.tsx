import { useState } from 'react';
import type { AlertCondition } from '../types/alert.types';

interface AlertFormProps {
  symbol: string;
  currentPrice: number | null;
  onSubmit: (targetPrice: number, condition: AlertCondition) => void;
  disabled: boolean;
}

export function AlertForm({ symbol, currentPrice, onSubmit, disabled }: AlertFormProps) {
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<AlertCondition>('CROSS_ABOVE');
  const [warning, setWarning] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    onSubmit(price, condition);
    setTargetPrice('');
    setWarning(null);
  };

  const handleTargetChange = (value: string) => {
    setTargetPrice(value);
    const price = parseFloat(value);

    if (!isNaN(price) && currentPrice !== null) {
      if (condition === 'CROSS_ABOVE' && price <= currentPrice) {
        setWarning('Target is at or below current price');
      } else if (condition === 'CROSS_BELOW' && price >= currentPrice) {
        setWarning('Target is at or above current price');
      } else {
        setWarning(null);
      }
    } else {
      setWarning(null);
    }
  };

  const handleConditionChange = (newCondition: AlertCondition) => {
    setCondition(newCondition);
    const price = parseFloat(targetPrice);

    if (!isNaN(price) && currentPrice !== null) {
      if (newCondition === 'CROSS_ABOVE' && price <= currentPrice) {
        setWarning('Target is at or below current price');
      } else if (newCondition === 'CROSS_BELOW' && price >= currentPrice) {
        setWarning('Target is at or above current price');
      } else {
        setWarning(null);
      }
    }
  };

  const isValid = targetPrice !== '' && parseFloat(targetPrice) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Set New Alert for {symbol}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Target Price"
          value={targetPrice}
          onChange={(e) => handleTargetChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
        />
        {warning && (
          <p className="mt-1 text-xs text-yellow-500">⚠️ {warning}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Condition
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleConditionChange('CROSS_ABOVE')}
            disabled={disabled}
            className={`flex-1 px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
              condition === 'CROSS_ABOVE'
                ? 'bg-success text-white'
                : 'bg-card border border-border text-muted hover:text-white'
            } disabled:opacity-50`}
          >
            ↑ Cross Above
          </button>
          <button
            type="button"
            onClick={() => handleConditionChange('CROSS_BELOW')}
            disabled={disabled}
            className={`flex-1 px-3 py-1.5 rounded-md font-medium text-xs transition-colors ${
              condition === 'CROSS_BELOW'
                ? 'bg-danger text-white'
                : 'bg-card border border-border text-muted hover:text-white'
            } disabled:opacity-50`}
          >
            ↓ Cross Below
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={disabled || !isValid}
        className="w-full px-4 py-3 bg-brand hover:bg-brand-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Set Alert
      </button>
    </form>
  );
}
