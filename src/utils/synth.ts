/**
 * Premium Web Audio API Synthesizer and Algorithmic Music Engine
 * Zero-dependency, offline-ready, high-fidelity sound synthesis
 */

export interface BuiltInSound {
  id: string;
  name: string;
  category: 'Calm Wake Up' | 'Normal Alarm' | 'Strong Wake Up';
  description: string;
  durationText: string;
  typeText: string;
  isFavorite?: boolean;
}

export const BUILTIN_SOUNDS: BuiltInSound[] = [
  // 🔥 Strong / High-Intensity
  { id: 'hyperdrive', name: 'Hyperdrive', category: 'Strong Wake Up', description: 'Driving 135 BPM heavy industrial beat with sweeping frequencies.', durationText: '30 seconds', typeText: 'High-Energy' },
  { id: 'cyber-alert', name: 'Cyber Alert 3000', category: 'Strong Wake Up', description: 'Fast, aggressive digital sci-fi warble with warning pulses.', durationText: '30 seconds', typeText: 'Sci-Fi Alert' },
  { id: 'supernova-blare', name: 'Supernova Blare', category: 'Strong Wake Up', description: 'Thick, massive detuned saw-wave brass blare and high alarms.', durationText: '30 seconds', typeText: 'Aggressive Saw' },
  { id: 'titan-pulse', name: 'Titan Pulse', category: 'Strong Wake Up', description: 'Deep industrial mechanical strikes layered with thick low buzz.', durationText: '30 seconds', typeText: 'Heavy Beat' },
  { id: 'quantum-siren', name: 'Quantum Siren', category: 'Strong Wake Up', description: 'Piercing pitch-sweeping sirens and rapid digital warning pulses.', durationText: '30 seconds', typeText: 'Siren Sweep' },

  // ☀️ Normal / Balanced
  { id: 'cosmic-resonance', name: 'Cosmic Resonance', category: 'Normal Alarm', description: 'Atmospheric warm space chords with crystalline resonant chimes.', durationText: '30 seconds', typeText: 'Resonant Bells' },
  { id: 'synthwave-pulse', name: 'Synth Wave Pulse', category: 'Normal Alarm', description: 'Retro 80s arpeggiated bassline with shining FM bell leads.', durationText: '30 seconds', typeText: 'Driving Retro' },
  { id: 'golden-hour-bell', name: 'Golden Hour Bell', category: 'Normal Alarm', description: 'Warm majestic bronze bells playing a beautiful major sequence.', durationText: '30 seconds', typeText: 'Warm Chime' },
  { id: 'aurora-chime', name: 'Aurora Chime', category: 'Normal Alarm', description: 'Sparkling crystal-clear glass glissando cascading in open space.', durationText: '30 seconds', typeText: 'Shimmering FM' },
  { id: 'horizon-echo', name: 'Horizon Echo', category: 'Normal Alarm', description: 'Echoing pentatonic folk flute melody with synthetic delays.', durationText: '30 seconds', typeText: 'Melodic Loop' },

  // 🌅 Calm / Low-Intensity
  { id: 'zen-horizon', name: 'Zen Horizon', category: 'Calm Wake Up', description: 'Tibetan singing bowl resonance with warm golden chime strikes.', durationText: '30 seconds', typeText: 'Ambient Pad' },
  { id: 'vaporwave-dream', name: 'Vaporwave Dream', category: 'Calm Wake Up', description: 'Nostalgic tape-warped lo-fi electric keys and soft ocean waves.', durationText: '30 seconds', typeText: 'Lo-Fi Melody' },
  { id: 'solar-wind', name: 'Solar Wind', category: 'Calm Wake Up', description: 'Ethereal solar wind sweeps and twinkling sparse silver chimes.', durationText: '30 seconds', typeText: 'Organic Noise' },
  { id: 'morning-breeze', name: 'Morning Breeze', category: 'Calm Wake Up', description: 'Delicate intimate piano arpeggios flowing with analog warmth.', durationText: '30 seconds', typeText: 'Acoustic Piano' }
];

export interface CustomSound {
  id: string;
  name: string;
  dataUrl: string; // Base64 Audio data or ObjectURL
}

class AudioSynth {
  private ctx: AudioContext | null = null;
  private activeNodes: { oscs: OscillatorNode[]; gains: GainNode[]; sources: AudioBufferSourceNode[]; filter?: BiquadFilterNode }[] = [];
  private alarmInterval: number | null = null;
  private currentActiveSoundId: string | null = null;
  private isMuted: boolean = false;
  private soundEffectsEnabled: boolean = true;
  private currentSoundVolume: number = 0.8;
  private gradualIncrementTimer: number | null = null;
  private activeVolumeGainNode: GainNode | null = null;
  private previewTimeout: number | null = null;
  private vibrationFallbackInterval: any = null;
  private vibrationFallbackTimeout: any = null;

  constructor() {
    this.loadSettings();
    if (typeof window !== 'undefined') {
      const resume = () => {
        try {
          this.init();
          if (this.ctx && this.ctx.state === 'running') {
            window.removeEventListener('click', resume);
            window.removeEventListener('touchstart', resume);
            window.removeEventListener('keydown', resume);
          }
        } catch (e) {
          console.warn('Audio gesture resume failed:', e);
        }
      };
      window.addEventListener('click', resume, { passive: true });
      window.addEventListener('touchstart', resume, { passive: true });
      window.addEventListener('keydown', resume, { passive: true });
    }
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setInterfaceSoundsEnabled(enabled: boolean) {
    this.soundEffectsEnabled = enabled;
    localStorage.setItem('dy_interface_sounds_enabled', enabled ? 'true' : 'false');
  }

  isInterfaceSoundsEnabled() {
    return this.soundEffectsEnabled;
  }

  // Load configuration on startup
  loadSettings() {
    const isFxEnabled = localStorage.getItem('dy_interface_sounds_enabled');
    if (isFxEnabled !== null) {
      this.soundEffectsEnabled = isFxEnabled === 'true';
    }
  }

  // Simple utility to generate noise buffers
  private getNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('Context not initialized');
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Generating white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // A generic method to play a highly polished synthesizer note with custom envelope and volume curves
  playSynthNote(
    frequency: number,
    duration: number = 0.15,
    type: OscillatorType = 'sine',
    volume: number = 0.1,
    attack: number = 0.005,
    detune: number = 0,
    slideTarget?: number
  ) {
    if (!this.soundEffectsEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      osc.detune.setValueAtTime(detune, this.ctx.currentTime);

      if (slideTarget) {
        osc.frequency.exponentialRampToValueAtTime(slideTarget, this.ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, this.ctx.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Synth note play failed:', e);
    }
  }

  /**
   * TRUE FM SYNTHESIS
   * Generates rich, glassy, organic, premium physical-sounding tones
   * by modulating a carrier wave's frequency with another wave.
   */
  playFMTone(
    carrierFreq: number,
    modRatio: number,       // Golden ratios like 1.414 or 1.618 give premium metallic/glassy tones
    modIndex: number,       // Intensity of timbre modulation
    duration: number = 0.2,
    volume: number = 0.08,
    attack: number = 0.004,
    carrierType: OscillatorType = 'sine',
    modulatorType: OscillatorType = 'sine'
  ) {
    if (!this.soundEffectsEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      const now = this.ctx.currentTime;
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();

      carrier.type = carrierType;
      carrier.frequency.setValueAtTime(carrierFreq, now);

      modulator.type = modulatorType;
      modulator.frequency.setValueAtTime(carrierFreq * modRatio, now);

      // Modulator gain controls timbre complexity over time
      modGain.gain.setValueAtTime(carrierFreq * modRatio * modIndex, now);
      modGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Volume envelope for the carrier
      mainGain.gain.setValueAtTime(0, now);
      mainGain.gain.linearRampToValueAtTime(volume, now + attack);
      mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Connect modulator to carrier frequency
      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      // Connect carrier to output
      carrier.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      modulator.start(now);
      carrier.start(now);

      modulator.stop(now + duration);
      carrier.stop(now + duration);
    } catch (e) {
      console.warn('FM Synthesis sound play failed:', e);
    }
  }

  // Play interface sounds
  playTone(frequency: number = 880, duration: number = 0.15, type: OscillatorType = 'sine', volume: number = 0.25) {
    this.playFMTone(frequency, 1.0, 0.1, duration, volume, 0.005, type);
  }

  playTick() {
    this.playFMTone(1000, 1.414, 0.2, 0.04, 0.08, 0.002, 'sine', 'sine');
  }



  // Premium UI interaction sounds
  playClick() {
    if (!this.soundEffectsEnabled) return;
    // An incredibly satisfying, warm physical wood-and-glass pluck
    this.playFMTone(620, 1.618, 0.5, 0.12, 0.12, 0.002, 'sine', 'sine');
    this.playFMTone(220, 1.0, 0.2, 0.06, 0.08, 0.004, 'triangle', 'sine');
  }

  playSwitch(on: boolean) {
    if (!this.soundEffectsEnabled) return;
    if (on) {
      // Shimmering upward organic FM chime (major pentatonic feel)
      this.playFMTone(523.25, 1.5, 0.4, 0.18, 0.08, 0.012);
      setTimeout(() => {
        this.playFMTone(783.99, 1.618, 0.3, 0.22, 0.06, 0.008);
      }, 40);
    } else {
      // Warm downward calming physical sweep
      this.playFMTone(783.99, 1.618, 0.3, 0.18, 0.06, 0.01);
      setTimeout(() => {
        this.playFMTone(523.25, 1.5, 0.4, 0.22, 0.08, 0.012);
      }, 40);
    }
  }

  playNavigation() {
    if (!this.soundEffectsEnabled) return;
    // A lush, beautiful, luxury ambient chord sweep (F# Maj 9th)
    const freqs = [369.99, 554.37, 739.99, 880.00, 1108.73];
    freqs.forEach((freq, idx) => {
      setTimeout(() => {
        this.playFMTone(freq, 1.618, 0.35, 0.35, 0.05, 0.015);
      }, idx * 35);
    });
  }

  playDismiss() {
    if (!this.soundEffectsEnabled) return;
    // Premium soft downward water-drop pop
    this.playFMTone(880, 1.414, 0.5, 0.15, 0.08, 0.005);
    setTimeout(() => {
      this.playFMTone(440, 1.0, 0.2, 0.2, 0.07, 0.01);
    }, 40);
  }

  playSlider() {
    if (!this.soundEffectsEnabled) return;
    // Very subtle luxury physical ticking
    this.playFMTone(1200, 1.414, 0.1, 0.015, 0.06, 0.001);
  }

  playDelete() {
    if (!this.soundEffectsEnabled) return;
    // An organic wooden bar/marimba resonance drop
    this.playFMTone(330, 2.0, 0.8, 0.25, 0.15, 0.01, 'triangle');
    setTimeout(() => {
      this.playFMTone(165, 1.0, 0.4, 0.2, 0.1, 0.008, 'sine');
    }, 45);
  }

  playKeypad() {
    if (!this.soundEffectsEnabled) return;
    // Delicate physical glass keytap
    this.playFMTone(987.77, 1.618, 0.4, 0.06, 0.08, 0.002);
  }

  playLapRing() {
    if (!this.soundEffectsEnabled) return;
    // A beautiful, highly resonant Tibetan singing bowl sound with multiple FM modes
    this.playFMTone(440, 1.414, 0.6, 0.8, 0.1, 0.02);
    this.playFMTone(440 * 1.5, 1.618, 0.4, 0.6, 0.06, 0.01);
    this.playFMTone(440 * 2.005, 1.0, 0.2, 0.5, 0.04, 0.005);
  }

  playTimerDoneChime() {
    if (!this.soundEffectsEnabled) return;
    // Majestic, warm crystalline harp chord arpeggio (C Maj 9th)
    const notes = [261.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playFMTone(freq, 1.618, 0.4, 0.8, 0.07, 0.02);
        this.playFMTone(freq * 2, 1.414, 0.2, 0.5, 0.03, 0.01);
      }, idx * 100);
    });
  }

  playSuccessSound() {
    if (!this.soundEffectsEnabled) return;
    // Luxurious rising major 9th FM chord sequence (A, C#, E, G#, B, E)
    const notes = [440.00, 554.37, 659.25, 830.61, 987.77, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playFMTone(freq, 1.618, 0.4, 0.45, 0.08, 0.015);
        this.playFMTone(freq * 1.5, 1.0, 0.15, 0.3, 0.03, 0.008);
      }, idx * 60);
    });
  }

  playErrorSound() {
    if (!this.soundEffectsEnabled) return;
    // A modern warm, non-harsh alert tone with physical modal properties
    this.playFMTone(220, 1.414, 0.6, 0.25, 0.12, 0.01, 'triangle');
    setTimeout(() => {
      this.playFMTone(180, 1.414, 0.6, 0.35, 0.10, 0.01, 'triangle');
    }, 100);
  }

  // Play a specific alarm sound
  startAlarmSound(soundId: string, targetVolume: number = 0.8, gradualUp: boolean = true, customDataUrl?: string) {
    this.stopAlarmSound();
    this.init();
    if (!this.ctx) return;

    this.currentActiveSoundId = soundId;
    let volume = gradualUp ? 0.05 : targetVolume;
    this.currentSoundVolume = volume;

    // Create a master volume controller
    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.activeVolumeGainNode = masterGain;

    // Keep track of the nodes for cleaning up
    const trackedNodes: { oscs: OscillatorNode[]; gains: GainNode[]; sources: AudioBufferSourceNode[]; filter?: BiquadFilterNode } = {
      oscs: [],
      gains: [],
      sources: []
    };
    this.activeNodes.push(trackedNodes);

    // Handle Gradual Volume Increase
    if (gradualUp) {
      const step = (targetVolume - 0.05) / 15; // Ramp up over 15 seconds
      let currentVal = 0.05;
      this.gradualIncrementTimer = window.setInterval(() => {
        if (!this.ctx) return;
        currentVal = Math.min(targetVolume, currentVal + step);
        masterGain.gain.linearRampToValueAtTime(currentVal, this.ctx.currentTime + 0.8);
      }, 1000);
    }

    // Play Custom Data URL Sound
    if (customDataUrl) {
      this.playCustomAudio(customDataUrl, masterGain, trackedNodes);
      return;
    }

    // Trigger algorithmic alarm loops
    this.synthesizeSound(soundId, masterGain, trackedNodes);
  }

  private async playCustomAudio(dataUrl: string, destination: AudioNode, trackedNodes: any) {
    try {
      this.init();
      if (!this.ctx) return;
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

      const source = this.ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;
      source.connect(destination);
      source.start();
      trackedNodes.sources.push(source);
    } catch (e) {
      console.error('Failed to play custom audio file:', e);
      // Fallback to Gentle Wake Up
      this.synthesizeSound('gentle-wake-up', destination, trackedNodes);
    }
  }

  // Smoothly fade out previous nodes and stop them
  fadeAndStopActiveNodes(fadeDuration: number = 0.3) {
    this.stopVibrationFallback();
    if (this.gradualIncrementTimer) {
      clearInterval(this.gradualIncrementTimer);
      this.gradualIncrementTimer = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }

    const currentCtx = this.ctx;
    if (currentCtx && currentCtx.state === 'running') {
      const stopTime = currentCtx.currentTime + fadeDuration;
      
      // Fade out the current active volume node
      if (this.activeVolumeGainNode) {
        try {
          this.activeVolumeGainNode.gain.setValueAtTime(this.activeVolumeGainNode.gain.value, currentCtx.currentTime);
          this.activeVolumeGainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);
        } catch (e) {}
        this.activeVolumeGainNode = null;
      }

      // Snapshot the active nodes to clean them up after fade finishes
      const nodesToStop = [...this.activeNodes];
      this.activeNodes = [];
      this.currentActiveSoundId = null;

      setTimeout(() => {
        nodesToStop.forEach((nodeSet) => {
          nodeSet.oscs.forEach((osc) => {
            try { osc.stop(); } catch (e) {}
            try { osc.disconnect(); } catch (e) {}
          });
          nodeSet.sources.forEach((src) => {
            try { src.stop(); } catch (e) {}
            try { src.disconnect(); } catch (e) {}
          });
          nodeSet.gains.forEach((g) => {
            try { g.disconnect(); } catch (e) {}
          });
          if (nodeSet.filter) {
            try { nodeSet.filter.disconnect(); } catch (e) {}
          }
        });
      }, fadeDuration * 1000 + 100);
    } else {
      this.stopAlarmSound();
    }
  }

  // Browse the sound library and play a short sample for preview
  previewSound(soundId: string, customDataUrl?: string, volumePercent: number = 80, durationMs: number = 5000, onEnded?: () => void) {
    this.fadeAndStopActiveNodes(0.2);
    this.init();
    if (!this.ctx) return;

    this.currentActiveSoundId = soundId;

    const previewGain = this.ctx.createGain();
    const targetVolumeFraction = volumePercent / 100;
    // Smooth fade in
    previewGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    previewGain.gain.linearRampToValueAtTime(Math.max(0.0001, targetVolumeFraction), this.ctx.currentTime + 0.15);
    previewGain.connect(this.ctx.destination);
    this.activeVolumeGainNode = previewGain;

    const trackedNodes: { oscs: OscillatorNode[]; gains: GainNode[]; sources: AudioBufferSourceNode[]; filter?: BiquadFilterNode } = {
      oscs: [],
      gains: [],
      sources: []
    };
    this.activeNodes.push(trackedNodes);

    if (customDataUrl) {
      this.playCustomAudio(customDataUrl, previewGain, trackedNodes);
    } else {
      this.synthesizeSound(soundId, previewGain, trackedNodes);
    }

    // Fade out and stop after specified durationMs
    this.previewTimeout = window.setTimeout(() => {
      if (!this.ctx) return;
      try {
        if (this.activeVolumeGainNode === previewGain) {
          previewGain.gain.setValueAtTime(previewGain.gain.value, this.ctx.currentTime);
          previewGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
          setTimeout(() => {
            if (this.currentActiveSoundId === soundId) {
              this.stopAlarmSound();
              if (onEnded) onEnded();
            }
          }, 900);
        }
      } catch (err) {}
    }, durationMs);
  }

  setVolume(volumePercent: number) {
    if (!this.ctx || !this.activeVolumeGainNode) return;
    const value = volumePercent / 100;
    try {
      this.activeVolumeGainNode.gain.setValueAtTime(value, this.ctx.currentTime);
    } catch (e) {
      console.error('Error adjusting synth volume in real time:', e);
    }
  }

  stopAlarmSound() {
    this.stopVibrationFallback();
    this.activeVolumeGainNode = null;
    if (this.gradualIncrementTimer) {
      clearInterval(this.gradualIncrementTimer);
      this.gradualIncrementTimer = null;
    }
    if (this.alarmInterval) {
      clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.previewTimeout) {
      clearTimeout(this.previewTimeout);
      this.previewTimeout = null;
    }
 
    // Stop and disconnect all active nodes
    this.activeNodes.forEach((nodeSet) => {
      nodeSet.oscs.forEach((osc) => {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); } catch (e) {}
      });
      nodeSet.sources.forEach((src) => {
        try { src.stop(); } catch (e) {}
        try { src.disconnect(); } catch (e) {}
      });
      nodeSet.gains.forEach((g) => {
        try { g.disconnect(); } catch (e) {}
      });
      if (nodeSet.filter) {
        try { nodeSet.filter.disconnect(); } catch (e) {}
      }
    });
 
    this.activeNodes = [];
    this.currentActiveSoundId = null;
  }

  // Synthesize a low-frequency hum/thump resembling motor vibration
  private playVibNote(freq: number, duration: number, volume: number = 0.5, type: OscillatorType = 'sine', sweepTarget?: number) {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (sweepTarget) {
        osc.frequency.exponentialRampToValueAtTime(sweepTarget, this.ctx.currentTime + duration);
      }

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume * 0.15, this.ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Vibration fallback sound failed:', e);
    }
  }

  // Plays a rhythmic, synthesized representation of a haptic pattern
  playVibrationFallback(patternId: string, durationMs: number = 3000) {
    this.stopVibrationFallback();
    this.init();
    if (!this.ctx) return;

    const playPatternStep = () => {
      if (patternId === 'gentle') {
        this.playVibNote(85, 0.2, 0.45, 'sine');
      } else if (patternId === 'heartbeat') {
        this.playVibNote(70, 0.12, 0.5, 'sine', 35);
        setTimeout(() => {
          this.playVibNote(80, 0.15, 0.6, 'sine', 40);
        }, 180);
      } else if (patternId === 'energetic' || patternId === 'strong') {
        this.playVibNote(110, 0.15, 0.7, 'triangle', 60);
      } else if (patternId === 'military' || patternId === 'pulse') {
        this.playVibNote(100, 0.22, 0.65, 'triangle', 50);
      }
    };

    // Play first step immediately
    playPatternStep();

    // Setup interval based on pattern
    let intervalMs = 1000;
    if (patternId === 'gentle') intervalMs = 800;
    else if (patternId === 'heartbeat') intervalMs = 1000;
    else if (patternId === 'energetic' || patternId === 'strong') intervalMs = 300;
    else if (patternId === 'military' || patternId === 'pulse') intervalMs = 500;

    this.vibrationFallbackInterval = setInterval(playPatternStep, intervalMs);

    // Stop after durationMs
    this.vibrationFallbackTimeout = setTimeout(() => {
      this.stopVibrationFallback();
    }, durationMs);
  }

  stopVibrationFallback() {
    if (this.vibrationFallbackInterval) {
      clearInterval(this.vibrationFallbackInterval);
      this.vibrationFallbackInterval = null;
    }
    if (this.vibrationFallbackTimeout) {
      clearTimeout(this.vibrationFallbackTimeout);
      this.vibrationFallbackTimeout = null;
    }
  }

  // Synthesizers definitions
  private synthesizeSound(soundId: string, outputNode: AudioNode, trackedNodes: any) {
    if (!this.ctx) return;

    const playNote = (
      freq: number, 
      duration: number, 
      delaySecs: number, 
      type: OscillatorType = 'sine', 
      volume: number = 0.3,
      attack: number = 0.1,
      release: number = 0.3
    ) => {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delaySecs);

        const startTime = this.ctx.currentTime + delaySecs;
        const peakTime = startTime + Math.min(attack, duration * 0.5);
        const stopTime = startTime + duration;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(volume, peakTime);
        gain.gain.setValueAtTime(volume, Math.max(startTime, stopTime - release));
        gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        osc.connect(gain);
        gain.connect(outputNode);

        osc.start(startTime);
        osc.stop(stopTime);

        trackedNodes.oscs.push(osc);
        trackedNodes.gains.push(gain);
      } catch (err) {}
    };

    const playFMNote = (
      carrierFreq: number,
      modulatorRatio: number,
      modulatorIndex: number,
      duration: number,
      delaySecs: number,
      volume: number = 0.3,
      type: OscillatorType = 'sine',
      modType: OscillatorType = 'sine'
    ) => {
      if (!this.ctx) return;
      try {
        const carrier = this.ctx.createOscillator();
        const modulator = this.ctx.createOscillator();
        const modGain = this.ctx.createGain();
        const gainNode = this.ctx.createGain();

        const startTime = this.ctx.currentTime + delaySecs;
        const stopTime = startTime + duration;

        carrier.type = type;
        modulator.type = modType;

        const modFreq = carrierFreq * modulatorRatio;
        carrier.frequency.setValueAtTime(carrierFreq, startTime);
        modulator.frequency.setValueAtTime(modFreq, startTime);

        const modDeviation = modFreq * modulatorIndex;
        modGain.gain.setValueAtTime(modDeviation, startTime);
        modGain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        gainNode.gain.setValueAtTime(0.0001, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gainNode.gain.setValueAtTime(volume, Math.max(startTime, stopTime - 0.1));
        gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        carrier.connect(gainNode);
        gainNode.connect(outputNode);

        modulator.start(startTime);
        carrier.start(startTime);

        modulator.stop(stopTime);
        carrier.stop(stopTime);

        trackedNodes.oscs.push(carrier, modulator);
        trackedNodes.gains.push(modGain, gainNode);
      } catch (err) {}
    };

    const playNoiseSweep = (
      baseFreq: number, 
      targetFreq: number, 
      duration: number, 
      delaySecs: number, 
      volume: number = 0.2,
      filterType: BiquadFilterType = 'bandpass'
    ) => {
      if (!this.ctx) return;
      try {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.getNoiseBuffer();
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.Q.value = 1.5;
        
        const startTime = this.ctx.currentTime + delaySecs;
        const stopTime = startTime + duration;

        filter.frequency.setValueAtTime(baseFreq, startTime);
        filter.frequency.exponentialRampToValueAtTime(targetFreq, stopTime);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + duration * 0.3);
        gain.gain.setValueAtTime(volume, Math.max(startTime, stopTime - duration * 0.2));
        gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(outputNode);

        noise.start(startTime);
        noise.stop(stopTime);

        trackedNodes.sources.push(noise);
        trackedNodes.gains.push(gain);
      } catch (err) {}
    };

    // Melodic loops callback helper
    const startMelodicLoop = (intervalMs: number, callback: () => void) => {
      callback();
      this.alarmInterval = window.setInterval(callback, intervalMs);
    };

    switch (soundId) {
      // ==========================================
      // 🔥 STRONG / HIGH-INTENSITY
      // ==========================================
      case 'hyperdrive': {
        startMelodicLoop(30000, () => {
          for (let sec = 0; sec < 30; sec += 0.44) { // 135 BPM
            const isHeavyDownbeat = Math.floor(sec / 0.44) % 4 === 0;
            const isOffbeat = Math.floor(sec / 0.44) % 2 === 1;
            playNote(55, 0.35, sec, 'triangle', isHeavyDownbeat ? 0.5 : 0.3, 0.01, 0.1);
            
            let pitch = 300;
            if (sec > 10) pitch = 400;
            if (sec > 20) pitch = 500;
            
            if (isHeavyDownbeat) {
              playNote(pitch, 0.3, sec, 'sawtooth', 0.2, 0.02, 0.1);
              playNote(pitch * 1.51, 0.25, sec, 'sawtooth', 0.1, 0.02, 0.1);
            } else if (isOffbeat && sec > 8) {
              playNote(pitch * 3, 0.1, sec, 'sawtooth', 0.15, 0.01, 0.05);
            }
            if (Math.floor(sec / 0.44) % 8 === 0) {
              playNoiseSweep(200, 800, 1.2, sec, 0.12, 'bandpass');
            }
          }
        });
        break;
      }

      case 'cyber-alert': {
        startMelodicLoop(30000, () => {
          for (let sec = 0; sec < 30; sec += 0.8) {
            const progress = sec / 30;
            const modFreq = 8 + progress * 12;
            const index = 4 + progress * 6;
            const carrierFreq = 700 + Math.sin(sec) * 100;
            
            for (let sub = 0; sub < 0.8; sub += 0.2) {
              const pulseTime = sec + sub;
              playFMNote(carrierFreq, 1.5, index, 0.12, pulseTime, 0.32, 'sawtooth', 'sine');
              if (progress > 0.4 && sub > 0.3) {
                playNote(1800, 0.08, pulseTime, 'square', 0.18, 0.01, 0.03);
              }
            }
            if (Math.floor(sec / 0.8) % 4 === 0) {
              playNoiseSweep(600, 1400, 0.6, sec, 0.15);
            }
          }
        });
        break;
      }

      case 'supernova-blare': {
        startMelodicLoop(30000, () => {
          for (let sec = 0; sec < 30; sec += 2.0) {
            const progress = sec / 30;
            const volume = 0.35 + progress * 0.15;
            
            playNote(110, 1.5, sec, 'sawtooth', volume, 0.05, 0.4);
            playNote(165, 1.4, sec, 'sawtooth', volume * 0.8, 0.05, 0.4);
            playNote(220, 1.3, sec, 'sawtooth', volume * 0.7, 0.04, 0.3);
            playNote(222, 1.3, sec, 'sawtooth', volume * 0.6, 0.04, 0.3);
            playNote(330, 1.2, sec, 'sawtooth', volume * 0.5, 0.03, 0.2);
            
            if (progress > 0.3) {
              playNote(880, 0.4, sec + 0.5, 'square', 0.2, 0.01, 0.1);
              playNote(880, 0.4, sec + 1.2, 'square', 0.2, 0.01, 0.1);
            }
            if (progress > 0.6) {
              playNote(1320, 0.25, sec + 0.2, 'square', 0.15, 0.01, 0.05);
              playNote(1320, 0.25, sec + 0.9, 'square', 0.15, 0.01, 0.05);
              playNote(1320, 0.25, sec + 1.6, 'square', 0.15, 0.01, 0.05);
            }
            playNoiseSweep(100, 1200, 1.5, sec, 0.15, 'lowpass');
          }
        });
        break;
      }

      case 'titan-pulse': {
        startMelodicLoop(30000, () => {
          for (let sec = 0; sec < 30; sec += 1.2) {
            const progress = sec / 30;
            const isEven = Math.floor(sec / 1.2) % 2 === 0;
            
            playNote(48, 0.8, sec, 'triangle', 0.5, 0.01, 0.3);
            playNote(50, 0.8, sec, 'sawtooth', 0.25, 0.05, 0.3);
            playFMNote(880, 1.414, 1.5, 0.4, sec, isEven ? 0.2 : 0.12, 'square', 'sine');
            
            if (progress > 0.3) {
              playNote(110, 0.25, sec + 0.4, 'sawtooth', 0.3, 0.02, 0.08);
              playNote(110, 0.25, sec + 0.8, 'sawtooth', 0.3, 0.02, 0.08);
            }
            if (progress > 0.6) {
              playNote(1500, 0.05, sec + 0.2, 'square', 0.18, 0.005, 0.02);
              playNote(1500, 0.05, sec + 0.3, 'square', 0.18, 0.005, 0.02);
              playNote(1500, 0.05, sec + 0.6, 'square', 0.18, 0.005, 0.02);
            }
          }
        });
        break;
      }

      case 'quantum-siren': {
        startMelodicLoop(30000, () => {
          for (let sec = 0; sec < 30; sec += 1.5) {
            const progress = sec / 30;
            const speed = progress > 0.5 ? 0.35 : 0.5;
            
            for (let sweep = 0; sweep < 1.5; sweep += speed * 2) {
              if (sweep + speed * 2 > 1.5) break;
              playNoiseSweep(400, 1800, speed, sec + sweep, 0.2, 'bandpass');
              playNote(600, speed, sec + sweep, 'square', 0.25, speed * 0.3, speed * 0.3);
              playNote(900, speed, sec + sweep, 'sawtooth', 0.15, speed * 0.3, speed * 0.3);
              
              playNoiseSweep(1800, 400, speed, sec + sweep + speed, 0.18, 'bandpass');
              playNote(900, speed, sec + sweep + speed, 'square', 0.25, speed * 0.3, speed * 0.3);
              playNote(600, speed, sec + sweep + speed, 'sawtooth', 0.15, speed * 0.3, speed * 0.3);
            }
            for (let click = 0; click < 1.5; click += 0.15) {
              playNote(3000, 0.03, sec + click, 'sine', 0.08, 0.001, 0.01);
            }
          }
        });
        break;
      }

      // ==========================================
      // ☀️ NORMAL / BALANCED
      // ==========================================
      case 'cosmic-resonance': {
        startMelodicLoop(30000, () => {
          playNote(130.81, 14.5, 0, 'sine', 0.3, 2.0, 2.0);
          playNote(196.00, 14.5, 0.5, 'sine', 0.18, 1.5, 1.5);
          playNote(174.61, 14.5, 15.0, 'sine', 0.3, 2.0, 2.0);
          playNote(261.63, 14.5, 15.5, 'sine', 0.18, 1.5, 1.5);
          
          const chord1 = [523.25, 659.25, 783.99, 987.77, 1174.66];
          const chord2 = [698.46, 880.00, 1046.50, 1318.51, 1567.98];
          
          chord1.forEach((freq, idx) => {
            playFMNote(freq, 1.618, 0.6, 6.0, idx * 0.4, 0.14, 'sine', 'sine');
            playFMNote(freq * 2, 1.414, 0.3, 4.0, idx * 0.4 + 0.1, 0.05, 'sine', 'sine');
          });
          chord2.forEach((freq, idx) => {
            playFMNote(freq, 1.618, 0.6, 6.0, 15.0 + idx * 0.4, 0.14, 'sine', 'sine');
            playFMNote(freq * 2, 1.414, 0.3, 4.0, 15.0 + idx * 0.4 + 0.1, 0.05, 'sine', 'sine');
          });
          playNoiseSweep(300, 1200, 8.0, 4.0, 0.06, 'bandpass');
          playNoiseSweep(1200, 300, 8.0, 19.0, 0.06, 'bandpass');
        });
        break;
      }

      case 'synthwave-pulse': {
        startMelodicLoop(30000, () => {
          const baseNotes = [65.41, 55.00, 43.65, 49.00];
          for (let measure = 0; measure < 8; measure++) {
            const root = baseNotes[Math.floor(measure / 2) % baseNotes.length];
            const startTime = measure * 3.75;
            for (let beat = 0; beat < 8; beat++) {
              const pulseTime = startTime + beat * 0.468;
              const octFreq = beat % 2 === 0 ? root * 2 : root * 4;
              playNote(octFreq, 0.3, pulseTime, 'triangle', 0.25, 0.01, 0.08);
              if (beat === 0) {
                playNote(root, 1.5, pulseTime, 'sine', 0.4, 0.1, 0.5);
              }
            }
            if (measure === 1 || measure === 3 || measure === 5 || measure === 7) {
              const melody = [523.25, 587.33, 659.25, 783.99];
              melody.forEach((freq, idx) => {
                playFMNote(freq, 1.5, 0.8, 1.5, startTime + idx * 0.936, 0.12, 'sawtooth', 'sine');
              });
            }
          }
        });
        break;
      }

      case 'golden-hour-bell': {
        startMelodicLoop(30000, () => {
          const bells = [
            { freq: 329.63, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 0 },
            { freq: 415.30, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 3.0 },
            { freq: 277.18, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 6.0 },
            { freq: 329.63, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 9.0 },
            { freq: 440.00, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 15.0 },
            { freq: 329.63, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 18.0 },
            { freq: 493.88, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 21.0 },
            { freq: 329.63, harmonics: [1.5, 2.0, 2.51, 3.0], delay: 24.0 }
          ];
          bells.forEach((bell) => {
            playFMNote(bell.freq, 1.414, 0.8, 6.0, bell.delay, 0.28, 'sine', 'sine');
            playFMNote(bell.freq * 0.5, 1.0, 0.2, 8.0, bell.delay, 0.22, 'triangle', 'sine');
            bell.harmonics.forEach((hMult, hIdx) => {
              playNote(bell.freq * hMult, 4.0 - hIdx * 0.8, bell.delay + 0.005 * hIdx, 'sine', 0.08 / (hIdx + 1), 0.002, 0.5);
            });
            playNoiseSweep(150, 400, 4.0, bell.delay, 0.05, 'lowpass');
          });
        });
        break;
      }

      case 'aurora-chime': {
        startMelodicLoop(30000, () => {
          const pentatonic = [659.25, 739.99, 830.61, 987.77, 1108.73, 1318.51, 1479.98, 1661.22];
          for (let sweepIdx = 0; sweepIdx < 5; sweepIdx++) {
            const startTime = sweepIdx * 6.0;
            playNoiseSweep(400, 1600, 5.0, startTime, 0.08, 'bandpass');
            pentatonic.forEach((freq, idx) => {
              const noteDelay = startTime + idx * 0.25;
              playFMNote(freq, 1.618, 1.2, 4.5, noteDelay, 0.12, 'sine', 'sine');
              playFMNote(freq * 1.5, 1.0, 0.3, 2.5, noteDelay + 0.05, 0.05, 'sine', 'sine');
            });
            pentatonic.slice().reverse().forEach((freq, idx) => {
              const noteDelay = startTime + 3.0 + idx * 0.2;
              playFMNote(freq * 0.5, 1.618, 0.8, 3.5, noteDelay, 0.08, 'sine', 'sine');
            });
          }
        });
        break;
      }

      case 'horizon-echo': {
        startMelodicLoop(30000, () => {
          const phrase1 = [
            { freq: 440.00, beat: 0, dur: 1.0 },
            { freq: 523.25, beat: 1.0, dur: 1.0 },
            { freq: 587.33, beat: 2.0, dur: 1.5 },
            { freq: 659.25, beat: 3.5, dur: 0.5 },
            { freq: 587.33, beat: 4.0, dur: 1.0 },
            { freq: 523.25, beat: 5.0, dur: 1.0 },
            { freq: 440.00, beat: 6.0, dur: 2.0 }
          ];
          const phrase2 = [
            { freq: 587.33, beat: 0, dur: 1.0 },
            { freq: 659.25, beat: 1.0, dur: 1.0 },
            { freq: 783.99, beat: 2.0, dur: 1.5 },
            { freq: 880.00, beat: 3.5, dur: 0.5 },
            { freq: 783.99, beat: 4.0, dur: 1.0 },
            { freq: 659.25, beat: 5.0, dur: 1.0 },
            { freq: 587.33, beat: 6.0, dur: 2.0 }
          ];
          const playPhrase = (phrase: any[], phraseDelay: number) => {
            phrase.forEach((note) => {
              const noteTime = phraseDelay + note.beat * 0.75;
              const volume = 0.22;
              playFMNote(note.freq, 1.01, 0.4, note.dur, noteTime, volume, 'sine', 'sine');
              playFMNote(note.freq, 1.01, 0.3, note.dur * 0.8, noteTime + 0.375, volume * 0.5, 'sine', 'sine');
              playFMNote(note.freq, 1.01, 0.2, note.dur * 0.6, noteTime + 0.75, volume * 0.25, 'sine', 'sine');
              playFMNote(note.freq, 1.01, 0.1, note.dur * 0.4, noteTime + 1.125, volume * 0.12, 'sine', 'sine');
            });
          };
          playPhrase(phrase1, 0);
          playPhrase(phrase2, 7.5);
          playPhrase(phrase1, 15.0);
          playPhrase(phrase2, 22.5);
        });
        break;
      }

      // ==========================================
      // 🌅 CALM / LOW-INTENSITY
      // ==========================================
      case 'zen-horizon': {
        startMelodicLoop(30000, () => {
          playNote(82.41, 29.5, 0, 'sine', 0.35, 3.0, 3.0);
          playNote(123.47, 29.0, 0.5, 'sine', 0.22, 2.5, 2.5);
          playNote(164.81, 28.5, 1.0, 'sine', 0.18, 2.0, 2.0);
          
          for (let strike = 0; strike < 4; strike++) {
            const strikeDelay = strike * 7.5;
            const strikeFreq = strike % 2 === 0 ? 369.99 : 493.88;
            playFMNote(strikeFreq, 1.414, 0.6, 6.0, strikeDelay, 0.15, 'sine', 'sine');
            playFMNote(strikeFreq * 1.5, 1.618, 0.4, 5.0, strikeDelay + 0.1, 0.08, 'sine', 'sine');
            playNoiseSweep(440, 1200, 5.0, strikeDelay + 0.5, 0.04, 'bandpass');
          }
        });
        break;
      }

      case 'vaporwave-dream': {
        startMelodicLoop(30000, () => {
          for (let wave = 0; wave < 3; wave++) {
            playNoiseSweep(150, 450, 5.5, wave * 10.0, 0.12, 'lowpass');
            playNoiseSweep(450, 150, 4.5, wave * 10.0 + 5.5, 0.09, 'lowpass');
          }
          const chords = [
            [130.81, 261.63, 329.63, 392.00, 493.88, 587.33],
            [110.00, 220.00, 261.63, 329.63, 392.00, 493.88],
            [87.31,  174.61, 261.63, 329.63, 349.23, 440.00],
            [98.00,  196.00, 293.66, 349.23, 392.00, 440.00]
          ];
          chords.forEach((chord, chordIdx) => {
            const chordDelay = chordIdx * 7.5;
            chord.forEach((freq, noteIdx) => {
              playNote(freq, 6.8, chordDelay + noteIdx * 0.08, 'sine', 0.14, 0.4, 1.2);
              playNote(freq + 1.2, 6.8, chordDelay + noteIdx * 0.08, 'sine', 0.10, 0.5, 1.2);
            });
          });
        });
        break;
      }

      case 'solar-wind': {
        startMelodicLoop(30000, () => {
          playNoiseSweep(80, 250, 15.0, 0, 0.11, 'lowpass');
          playNoiseSweep(250, 80, 15.0, 15.0, 0.11, 'lowpass');
          playNoiseSweep(300, 1800, 10.0, 2.0, 0.05, 'bandpass');
          playNoiseSweep(1800, 300, 10.0, 16.0, 0.05, 'bandpass');
          
          const scales = [739.99, 830.61, 932.33, 1108.73, 1254.37, 1479.98, 1661.22];
          for (let chime = 0; chime < 15; chime++) {
            const randDelay = Math.random() * 28.0;
            const randFreq = scales[Math.floor(Math.random() * scales.length)];
            playFMNote(randFreq, 1.618, 1.5, 3.5, randDelay, 0.07, 'sine', 'sine');
            playFMNote(randFreq * 2.001, 1.0, 0.2, 1.5, randDelay + 0.01, 0.03, 'sine', 'sine');
          }
        });
        break;
      }

      case 'morning-breeze': {
        startMelodicLoop(30000, () => {
          playNoiseSweep(150, 350, 15.0, 0, 0.06, 'lowpass');
          playNoiseSweep(350, 150, 15.0, 15.0, 0.06, 'lowpass');
          
          const progressions = [
            [261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63],
            [196.00, 293.66, 392.00, 493.88, 587.33, 493.88, 392.00, 293.66],
            [220.00, 329.63, 440.00, 523.25, 659.25, 523.25, 440.00, 329.63],
            [174.61, 261.63, 349.23, 440.00, 523.25, 440.00, 349.23, 261.63]
          ];
          progressions.forEach((chordNotes, chordIdx) => {
            const chordDelay = chordIdx * 7.5;
            chordNotes.forEach((freq, noteIdx) => {
              const noteDelay = chordDelay + noteIdx * 0.45;
              playNote(freq, 4.0, noteDelay, 'triangle', 0.16, 0.03, 0.8);
              playNote(freq, 5.0, noteDelay + 0.01, 'sine', 0.12, 0.1, 1.2);
              if (noteIdx === 4) {
                playFMNote(freq * 2, 1.618, 0.4, 2.5, noteDelay, 0.06, 'sine', 'sine');
              }
            });
          });
        });
        break;
      }

      default: {
        // Standard gentle fallback chime loop
        startMelodicLoop(30000, () => {
          playFMNote(440, 1.414, 0.5, 4.0, 0, 0.2);
          playFMNote(554.37, 1.5, 0.3, 3.5, 1.0, 0.15);
          playFMNote(659.25, 1.618, 0.4, 3.0, 2.0, 0.12);
        });
        break;
      }
    }
  }
}

export const synth = new AudioSynth();
synth.loadSettings();
export default synth;
