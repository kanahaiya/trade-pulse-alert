export const MSG_TYPES = {
  GET_DETECTION: 'GET_DETECTION',
  GET_PRICE: 'GET_PRICE',
  PLAY_SOUND: 'PLAY_SOUND',
} as const;

export type MessageType = (typeof MSG_TYPES)[keyof typeof MSG_TYPES];
