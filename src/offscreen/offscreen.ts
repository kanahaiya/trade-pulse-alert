chrome.runtime.onMessage.addListener((message: { type: string }) => {
  if (message.type === 'PLAY_SOUND') {
    const audio = new Audio(chrome.runtime.getURL('sounds/alert.mp3'));
    audio.volume = 0.8;
    audio.play().catch((error) => {
      console.error('[TradePulse] Audio playback error:', error);
    });
  }
});

console.log('[TradePulse] Offscreen document loaded');
