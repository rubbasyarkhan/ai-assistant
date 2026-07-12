// Web Audio API Sci-Fi Sound Synthesizer for JARVIS
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type) => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    switch (type) {
      case 'click': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      
      case 'ping': {
        // Radar/Sonar ping
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(980, now);
        
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc.start(now);
        osc.stop(now + 1.2);
        break;
      }
      
      case 'startup': {
        // Futuristic boot sound: upward sweep + chord
        const freqs = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(100, now + idx * 0.04);
          osc.frequency.exponentialRampToValueAtTime(freq, now + idx * 0.04 + 0.2);
          
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.04 + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 1.5);
          
          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 1.5);
        });
        break;
      }
      
      case 'success': {
        // Futuristic double-chirp
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.08);
        
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.setValueAtTime(0.05, now + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.start(now);
        osc.stop(now + 0.25);
        break;
      }
      
      case 'error': {
        // Sci-fi warning alert: alternating frequencies
        const duration = 0.4;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.linearRampToValueAtTime(140, now + duration);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(185, now);
        osc2.frequency.linearRampToValueAtTime(145, now + duration);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.08, now + duration - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc1.start(now);
        osc1.stop(now + duration);
        osc2.start(now);
        osc2.stop(now + duration);
        break;
      }
      
      default:
        break;
    }
  } catch (e) {
    console.warn("Failed to play synthesized sound:", e);
  }
};
