import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Alarm, Theme } from '../types';
import { Bell, Clock } from 'lucide-react';
import { synth } from '../utils/synth';
import { motion } from 'motion/react';
import haptics from '../utils/haptics';
import { useDateTimeSettings } from '../utils/settingsContext';
import { formatAlarmTime } from '../utils/alarmUtils';

interface AlarmTriggerModalProps {
  alarm: Alarm;
  onDismiss: () => void;
  onSnooze: () => void;
  theme: Theme;
}

export default function AlarmTriggerModal({
  alarm,
  onDismiss,
  onSnooze,
  theme,
}: AlarmTriggerModalProps) {
  const { settings } = useDateTimeSettings();

  // 1. Live Real-Time System Clock (Updates every second)
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    setCurrentTime(new Date());
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  // Format current live time
  const formattedTimeParts = useMemo(() => {
    const is24h = settings.timeFormat === '24h';
    const hoursRaw = currentTime.getHours();
    const minutesStr = currentTime.getMinutes().toString().padStart(2, '0');
    const secondsStr = currentTime.getSeconds().toString().padStart(2, '0');

    if (is24h) {
      const hoursStr = hoursRaw.toString().padStart(2, '0');
      return {
        mainTime: `${hoursStr}:${minutesStr}:${secondsStr}`,
        period: '',
      };
    } else {
      const period = hoursRaw >= 12 ? 'PM' : 'AM';
      let h12 = hoursRaw % 12;
      if (h12 === 0) h12 = 12;
      const hoursStr = h12.toString().padStart(2, '0');
      return {
        mainTime: `${hoursStr}:${minutesStr}:${secondsStr}`,
        period,
      };
    }
  }, [currentTime, settings.timeFormat]);

  // Wake-Up Voice Playback Controller States
  const [currentPhase, setCurrentPhase] = useState<'alarm' | 'voice' | 'paused' | 'stopped'>('alarm');
  const [cycleCount, setCycleCount] = useState(1);

  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isCancelledRef = useRef(false);

  // Helper to replace placeholders in speech message
  const resolvePlaceholders = (text: string): string => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    const dayStr = now.toLocaleDateString([], { weekday: 'long' });

    const bedsideStart = localStorage.getItem('dy_bedside_entered_at');
    let sleepStr = '7 hours and 45 minutes';
    if (bedsideStart) {
      try {
        const entered = new Date(bedsideStart);
        const diffMs = now.getTime() - entered.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (diffHrs > 0 || diffMins > 0) {
          sleepStr = `${diffHrs > 0 ? `${diffHrs} hour${diffHrs > 1 ? 's' : ''}` : ''}${diffHrs > 0 && diffMins > 0 ? ' and ' : ''}${diffMins > 0 ? `${diffMins} minute${diffMins > 1 ? 's' : ''}` : ''}`;
        }
      } catch (e) {}
    }

    let batteryStr = '94%';
    if (typeof navigator !== 'undefined' && (navigator as any).battery) {
      batteryStr = `${Math.round((navigator as any).battery.level * 100)}%`;
    }

    const name = localStorage.getItem('dy_wake_voice_custom_name') || 'Daniel';

    return text
      .replace(/{name}/g, name)
      .replace(/{time}/g, timeStr)
      .replace(/{date}/g, dateStr)
      .replace(/{day}/g, dayStr)
      .replace(/{sleep_duration}/g, sleepStr)
      .replace(/{battery}/g, batteryStr);
  };

  // Speaks using browser Web Speech Synthesis
  const speakTtsPromise = (message: string, voiceURI: string, lang: string, volume: number): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || isCancelledRef.current) {
        resolve();
        return;
      }
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}

      const utterance = new SpeechSynthesisUtterance(message);

      if (voiceURI) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.voiceURI === voiceURI);
        if (voice) utterance.voice = voice;
      }
      utterance.lang = lang || 'en-US';
      utterance.volume = volume;

      let finished = false;
      const finish = () => {
        if (!finished) {
          finished = true;
          resolve();
        }
      };

      utterance.onend = finish;
      utterance.onerror = finish;

      window.speechSynthesis.speak(utterance);
    });
  };

  // Plays a local audio file or voice recording
  const playAudioFilePromise = (dataUrl: string, trimStart: number, trimEnd: number, volume: number): Promise<void> => {
    return new Promise((resolve) => {
      if (isCancelledRef.current) {
        resolve();
        return;
      }
      const audio = new Audio(dataUrl);
      currentAudioRef.current = audio;
      audio.currentTime = trimStart || 0;
      audio.volume = volume;

      let timer: number | null = null;
      const cleanUp = () => {
        if (timer) {
          window.clearTimeout(timer);
          timer = null;
        }
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {}
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
      };

      audio.onended = () => {
        cleanUp();
        resolve();
      };

      audio.onerror = () => {
        cleanUp();
        resolve();
      };

      audio
        .play()
        .then(() => {
          if (isCancelledRef.current) {
            cleanUp();
            resolve();
            return;
          }
          const playDuration = (trimEnd - trimStart) * 1000;
          if (playDuration > 0 && playDuration < 300000) {
            timer = window.setTimeout(() => {
              cleanUp();
              resolve();
            }, playDuration);
          }
        })
        .catch(() => {
          cleanUp();
          resolve();
        });
    });
  };

  // Helper for interruptible delay between cycles
  const waitInterruptible = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      if (isCancelledRef.current) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        resolve();
      }, ms);

      const checkInterval = setInterval(() => {
        if (isCancelledRef.current) {
          clearTimeout(timer);
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };

  // Comprehensive playback stop helper
  const stopAllPlayback = () => {
    isCancelledRef.current = true;
    synth.stopAlarmSound();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {}
      currentAudioRef.current = null;
    }
    try {
      navigator.vibrate?.(0);
    } catch (e) {}
  };

  // Sound triggering and Voice cycles loop on mount
  useEffect(() => {
    isCancelledRef.current = false;

    const config = alarm.wakeUpVoice;
    const isVoiceEnabled = config?.enabled ?? false;
    const playbackMode = config?.playbackMode || 'alarm-then-voice';

    // Base alarm config
    const soundId = alarm.soundId || 'cosmic-resonance';
    const alarmVol = (alarm.soundVolume ?? 80) / 100;
    const gradual = alarm.gradualUp ?? true;

    // Custom voice volume
    let voiceVol = alarmVol;
    if (config?.voiceVolumeMode === 'lower') voiceVol = Math.max(0.1, alarmVol - 0.2);
    else if (config?.voiceVolumeMode === 'higher') voiceVol = Math.min(1.0, alarmVol + 0.2);
    else if (config?.voiceVolumeMode === 'custom') voiceVol = (config.voiceCustomVolume ?? 80) / 100;

    // Vibration Profile Loops
    let vibInterval: number | null = null;
    const vibType = alarm.vibrationPattern || 'heartbeat';

    const startVib = () => {
      if (vibType === 'none') return;
      const runVib = () => {
        if (isCancelledRef.current) return;
        if (vibType === 'gentle') {
          haptics.gentleReminder();
        } else if (vibType === 'heartbeat') {
          navigator.vibrate?.([80, 80, 150]);
        } else if (vibType === 'energetic') {
          navigator.vibrate?.([400, 200, 400]);
        } else if (vibType === 'military') {
          navigator.vibrate?.([150, 100, 150, 100, 300]);
        } else {
          haptics.criticalAlarm();
        }
      };
      runVib();
      vibInterval = window.setInterval(runVib, 2500);
    };

    const stopVib = () => {
      if (vibInterval) {
        clearInterval(vibInterval);
        vibInterval = null;
      }
      try {
        navigator.vibrate?.(0);
      } catch (e) {}
    };

    // Helper to play alarm sound for a specified duration
    const playAlarmSoundForDuration = (durationMs: number): Promise<void> => {
      return new Promise((resolve) => {
        if (isCancelledRef.current) {
          resolve();
          return;
        }
        setCurrentPhase('alarm');
        synth.startAlarmSound(soundId, alarmVol, gradual, alarm.customDataUrl);
        startVib();

        let elapsed = 0;
        let fadeTimer: number | null = null;
        const interval = window.setInterval(() => {
          if (isCancelledRef.current) {
            clearInterval(interval);
            if (fadeTimer) clearTimeout(fadeTimer);
            synth.stopAlarmSound();
            stopVib();
            resolve();
            return;
          }

          elapsed += 1000;
          if (elapsed >= durationMs) {
            clearInterval(interval);
            synth.fadeAndStopActiveNodes(1.0);
            stopVib();
            fadeTimer = window.setTimeout(() => {
              resolve();
            }, 1000);
          }
        }, 1000);
      });
    };

    // Helper to play the Voice
    const speakTTS = async (): Promise<void> => {
      if (isCancelledRef.current) return;
      const ttsMessage = config?.ttsMessage || 'Good morning {name}! The time is {time}. Have an amazing day ahead.';
      const resolvedMsg = resolvePlaceholders(ttsMessage);
      await speakTtsPromise(
        resolvedMsg,
        config?.ttsVoiceURI || '',
        config?.ttsLanguage || 'en-US',
        voiceVol
      );
    };

    const playVoice = async (): Promise<void> => {
      if (isCancelledRef.current) return;
      setCurrentPhase('voice');

      if (config?.source === 'record' || config?.source === 'upload') {
        const dataUrl = config.audioDataUrl;
        if (dataUrl) {
          try {
            await playAudioFilePromise(
              dataUrl,
              config.audioTrimStart ?? 0,
              config.audioTrimEnd ?? 9999,
              voiceVol
            );
          } catch (err) {
            console.warn('Voice audio error. Falling back to offline TTS.', err);
            await speakTTS();
          }
        } else {
          await speakTTS();
        }
      } else {
        await speakTTS();
      }
    };

    // Main Control Loop Execution (Runs 3 cycles, then automatically completes)
    const runMainSequence = async () => {
      if (!isVoiceEnabled || playbackMode === 'alarm-only') {
        // Traditional mode: 3 cycles of alarm sound (15s each)
        for (let cycle = 1; cycle <= 3; cycle++) {
          if (isCancelledRef.current) break;
          setCycleCount(cycle);
          await playAlarmSoundForDuration(15000);
          if (isCancelledRef.current) break;
          if (cycle < 3) {
            setCurrentPhase('paused');
            await waitInterruptible(1000);
          }
        }
      } else if (playbackMode === 'voice-only') {
        // Voice-only mode: 3 cycles
        for (let cycle = 1; cycle <= 3; cycle++) {
          if (isCancelledRef.current) break;
          setCycleCount(cycle);
          await playVoice();
          if (isCancelledRef.current) break;
          if (cycle < 3) {
            setCurrentPhase('paused');
            await waitInterruptible(3000);
          }
        }
      } else if (playbackMode === 'voice-then-alarm') {
        // Voice -> Alarm mode: 3 cycles
        for (let cycle = 1; cycle <= 3; cycle++) {
          if (isCancelledRef.current) break;
          setCycleCount(cycle);
          await playVoice();
          if (isCancelledRef.current) break;
          await playAlarmSoundForDuration(15000);
          if (isCancelledRef.current) break;
        }
      } else {
        // Default: 'alarm-then-voice' mode: 3 cycles
        for (let cycle = 1; cycle <= 3; cycle++) {
          if (isCancelledRef.current) break;
          setCycleCount(cycle);
          await playAlarmSoundForDuration(15000);
          if (isCancelledRef.current) break;
          await playVoice();
          if (isCancelledRef.current) break;
        }
      }

      // If full sequence finished naturally without user cancellation:
      if (!isCancelledRef.current) {
        setCurrentPhase('stopped');
        stopAllPlayback();
        onDismiss(); // Automatically dismiss and close interface
      }
    };

    runMainSequence();

    return () => {
      stopAllPlayback();
      stopVib();
    };
  }, [alarm]);

  const handleSnoozeClick = () => {
    stopAllPlayback();
    haptics.snoozeAck();
    synth.playClick();
    onSnooze();
  };

  const handleDismissClick = () => {
    stopAllPlayback();
    haptics.heavy();
    synth.playSuccessSound();
    onDismiss();
  };

  return (
    <motion.div
      id="alarm-trigger-overlay"
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28 }}
      transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
      className="fixed inset-0 bg-slate-950 flex flex-col justify-between p-6 z-[120] select-none text-white overflow-hidden"
    >
      {/* Immersive Breathing Ambient Glow Background */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.35, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`w-[500px] h-[500px] rounded-full bg-${theme.primary}/20 filter blur-[80px] absolute`}
        />
        <motion.div
          animate={{
            scale: [1.1, 0.9, 1.1],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-[400px] h-[400px] rounded-full bg-indigo-500/10 filter blur-[60px] absolute"
        />
      </div>

      {/* Top Section - Status & Icon */}
      <div className="text-center space-y-4 z-10 pt-8 sm:pt-10" id="alarm-trigger-header">
        <motion.div
          animate={{
            scale: [1, 1.06, 1],
            boxShadow: [
              '0 0 0 0px rgba(239, 68, 68, 0.2)',
              '0 0 0 15px rgba(239, 68, 68, 0)',
              '0 0 0 0px rgba(239, 68, 68, 0)',
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-16 h-16 bg-red-500/15 border border-red-500/35 rounded-full flex items-center justify-center mx-auto"
        >
          <Bell className="w-8 h-8 text-red-500" />
        </motion.div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Alarm Active</p>
          <p className="text-sm font-semibold tracking-wider text-slate-300 capitalize bg-slate-900/60 py-1.5 px-5 rounded-full border border-slate-800/80 inline-block mt-1">
            🔔 {alarm.label}
          </p>

          {/* Wake-Up Voice Intelligent Badge */}
          {alarm.wakeUpVoice?.enabled && (
            <div className="mt-2.5 block">
              <span
                className={`text-[10px] font-black tracking-widest uppercase px-3.5 py-1.5 rounded-full border ${
                  currentPhase === 'alarm'
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : currentPhase === 'voice'
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse'
                    : currentPhase === 'paused'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
              >
                {currentPhase === 'alarm' && `🔔 Playing Alarm Sound (Cycle ${cycleCount}/3)`}
                {currentPhase === 'voice' && `🎙️ Speaking Wake-Up Voice (Cycle ${cycleCount}/3)`}
                {currentPhase === 'paused' && `⏳ Cycle Interval Pause (Cycle ${cycleCount}/3)`}
                {currentPhase === 'stopped' && `🔋 Sequence Finished`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Middle Section - Live Real-time System Clock */}
      <div className="flex-1 flex flex-col items-center justify-center z-10 py-6" id="alarm-trigger-clock">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          className="text-center space-y-3"
        >
          <div className="flex items-baseline justify-center gap-2 sm:gap-3">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-tighter text-white uppercase drop-shadow-xl select-none">
              {formattedTimeParts.mainTime}
            </h1>
            {formattedTimeParts.period && (
              <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-300 uppercase tracking-wider">
                {formattedTimeParts.period}
              </span>
            )}
          </div>

          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-bold tracking-wider uppercase shadow-inner">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Alarm Set For: {formatAlarmTime(alarm.time, settings.timeFormat)}</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Section - Controls (Snooze & Dismiss) */}
      <div className="max-w-md w-full mx-auto z-10 space-y-4 pb-6 sm:pb-10" id="alarm-trigger-controls">
        {alarm.snoozeEnabled !== false && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSnoozeClick}
            className="w-full py-4.5 rounded-2xl bg-white text-slate-950 font-extrabold text-base shadow-2xl shadow-white/5 active:brightness-90 transition-all flex items-center justify-center gap-2 cursor-pointer border border-white"
            id="alarm-snooze-btn"
          >
            Snooze <span className="opacity-60 text-xs font-bold">(9 Min)</span>
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDismissClick}
          className={`w-full py-4 rounded-2xl font-bold text-sm border active:brightness-90 transition-all cursor-pointer ${
            alarm.snoozeEnabled === false
              ? 'bg-white text-slate-950 border-white font-extrabold text-base'
              : 'bg-slate-900/80 text-slate-200 hover:text-white border-slate-800/60'
          }`}
          id="alarm-dismiss-btn"
        >
          Dismiss Alarm
        </motion.button>
      </div>

      {/* Decorative footer support branding */}
      <div className="text-center text-[10px] text-slate-600 font-bold tracking-widest uppercase z-10 pb-2" id="alarm-trigger-footer">
        ⚡ Powered by DY Clock System
      </div>
    </motion.div>
  );
}
