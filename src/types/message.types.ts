export interface DetectionResult {
  supported: boolean;
  symbol: string | null;
  price: number | null;
  broker: string | null;
}

export interface PriceRequest {
  type: 'GET_PRICE';
}

export interface PriceResponse {
  price: number | null;
  symbol: string | null;
}

export interface DetectionRequest {
  type: 'GET_DETECTION';
}

export interface SoundMessage {
  type: 'PLAY_SOUND';
}

export type ContentScriptMessage = PriceRequest | DetectionRequest;
export type ContentScriptResponse = PriceResponse | DetectionResult;
