// lib/sound.ts

export const playSound = (soundName: 'click' | 'rolling' | 'win' | 'crash', volume = 0.5) => {
  if (typeof window !== 'undefined') {
    const audio = new Audio(`/sounds/${soundName}.mp3`);
    audio.volume = volume;
    audio.play().catch(e => {
      console.warn('Audio playback prevented by browser:', e);
    });
  }
};