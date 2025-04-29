export const playBeep = () => {
  try {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(440, context.currentTime);
    oscillator.connect(context.destination);
    oscillator.start();
    
    setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 100);
  } catch (error) {
    console.error('Error playing beep sound:', error);
  }
};