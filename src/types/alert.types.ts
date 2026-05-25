export type AlertCondition = 'CROSS_ABOVE' | 'CROSS_BELOW';
export type AlertStatus = 'ACTIVE' | 'TRIGGERED';

export interface StoredAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: AlertCondition;
  status: AlertStatus;
  previousPrice: number | null;
  createdAt: number;
  triggeredAt: number | null;
  tabUrl: string;
}

export interface Alert extends StoredAlert {}
