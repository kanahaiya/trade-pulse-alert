export interface BrokerInfo {
  name: string;
  hostname: string;
}

export interface DetectionResult {
  supported: boolean;
  symbol: string | null;
  price: number | null;
  broker: string | null;
}
