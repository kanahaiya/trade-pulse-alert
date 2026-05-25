import { useState, useEffect } from 'react';
import type { AlertCondition } from '../types/alert.types';

interface AlertFormProps {
  symbol: string;
  currentPrice: number | null;
  onSubmit: (targetPrice: number, condition: AlertCondition) => void;
  disabled: boolean;
}

export function AlertForm({ symbol, currentPrice, onSubmit, disabled }: AlertFormProps) {
  const [targetPrice, setTargetPrice] = useState('');
  const [hasUserEdited, setHasUserEdited] = useState(false);

  // Set current price as default when it first becomes available
  useEffect(() => {
    if (currentPrice !== null && !hasUserEdited && targetPrice === '') {
      setTargetPrice(currentPrice.toString());
    }
  }, [currentPrice, hasUserEdited, targetPrice]);

  const handleSetAlert = (condition: AlertCondition) => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;

    onSubmit(price, condition);
    setTargetPrice(currentPrice?.toString() || '');
    setHasUserEdited(false);
  };

  const handlePriceChange = (value: string) => {
    setTargetPrice(value);
    setHasUserEdited(true);
  };

  const isValid = targetPrice !== '' && parseFloat(targetPrice) > 0;
  const price = parseFloat(targetPrice);
  
  // Show warning based on price vs current
  const getWarning = (condition: AlertCondition): string | null => {
    if (isNaN(price) || currentPrice === null) return null;
    if (condition === 'CROSS_ABOVE' && price <= currentPrice) {
      return 'Will trigger immediately (price already above)';
    }
    if (condition === 'CROSS_BELOW' && price >= currentPrice) {
      return 'Will trigger immediately (price already below)';
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Set Alert for {symbol}
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          placeholder="Enter target price"
          value={targetPrice}
          onChange={(e) => handlePriceChange(e.target.value)}
          disabled={disabled}
          className="w-full px-4 py-3 bg-card border border-border rounded-lg text-white placeholder-muted focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent disabled:opacity-50"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleSetAlert('CROSS_ABOVE')}
          disabled={disabled || !isValid}
          className="flex-1 px-3 py-2.5 rounded-lg font-medium text-sm bg-success hover:bg-success/80 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={getWarning('CROSS_ABOVE') || 'Alert when price crosses above target'}
        >
          ↑ Cross Above
        </button>
        <button
          type="button"
          onClick={() => handleSetAlert('CROSS_BELOW')}
          disabled={disabled || !isValid}
          className="flex-1 px-3 py-2.5 rounded-lg font-medium text-sm bg-danger hover:bg-danger/80 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={getWarning('CROSS_BELOW') || 'Alert when price crosses below target'}
        >
          ↓ Cross Below
        </button>
      </div>
      
      {isValid && currentPrice !== null && (
        <p className="text-xs text-muted text-center">
          Current: ₹{currentPrice.toLocaleString('en-IN')} → Target: ₹{price.toLocaleString('en-IN')}
        </p>
      )}
    </div>
  );
}
