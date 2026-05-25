export const SoundService = {
  async play(): Promise<void> {
    try {
      const hasDocument = await chrome.offscreen.hasDocument();
      if (!hasDocument) {
        await chrome.offscreen.createDocument({
          url: chrome.runtime.getURL('src/offscreen/offscreen.html'),
          reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
          justification: 'Play alert sound when price target is reached',
        });
      }
      chrome.runtime.sendMessage({ type: 'PLAY_SOUND' });
    } catch (error) {
      console.error('[TradePulse] Sound service error:', error);
    }
  },
};
