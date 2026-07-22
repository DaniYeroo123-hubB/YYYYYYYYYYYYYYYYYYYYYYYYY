import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useDateTimeSettings } from './settingsContext';
import { addNotificationToHistory } from './notificationCenter';
import synth from './synth';
import haptics from './haptics';

export type SleepTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface SleepTimerState {
  status: SleepTimerStatus;
  durationMinutes: number; // Selected duration in minutes (e.g. 15, 30, 45, 60, 120 or custom)
  totalSeconds: number;
  remainingSeconds: number;
  endTime: number | null; // Epoch ms when countdown reaches 0
  pausedAtRemaining: number | null; // Remaining seconds when paused
  isCustom: boolean;
  customHours: number;
  customMinutes: number;
}

interface SleepTimerContextType {
  state: SleepTimerState;
  startTimer: (durationMinutesOverride?: number, customTotalSecondsOverride?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  cancelTimer: () => void;
  resetTimer: () => void;
  setPresetMinutes: (minutes: number) => void;
  setCustomDuration: (hours: number, minutes: number) => void;
  formattedRemaining: {
    hrs: string;
    mins: string;
    secs: string;
    totalFormatted: string;
  };
  progressPercent: number; // 0 to 100
}

const SleepTimerContext = createContext<SleepTimerContextType | undefined>(undefined);

const STORAGE_KEY = 'dy_sleep_timer_state_v1';

export const SleepTimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateSetting } = useDateTimeSettings();

  const [state, setState] = useState<SleepTimerState>(() => {
    const defaultMins = settings.sleepTimerDefaultDuration || 30;
    const totalSecs = defaultMins * 60;
    return {
      status: 'idle',
      durationMinutes: defaultMins,
      totalSeconds: totalSecs,
      remainingSeconds: totalSecs,
      endTime: null,
      pausedAtRemaining: null,
      isCustom: false,
      customHours: 0,
      customMinutes: defaultMins,
    };
  });

  // Media stop with smooth fade-out implementation
  const stopMediaAndFadeOut = useCallback((fadeDurationSeconds: number, isFadeEnabled: boolean) => {
    // 1. Web Audio API (synth)
    try {
      synth.fadeAndStopActiveNodes(isFadeEnabled ? fadeDurationSeconds : 0.1);
    } catch (e) {
      console.warn('Error stopping synth:', e);
    }

    // 2. DOM HTMLMediaElements (<audio> and <video>)
    try {
      const mediaElements = Array.from(document.querySelectorAll<HTMLMediaElement>('audio, video'));
      if (mediaElements.length > 0) {
        if (isFadeEnabled && fadeDurationSeconds > 0) {
          const steps = 20;
          const stepIntervalMs = (fadeDurationSeconds * 1000) / steps;

          mediaElements.forEach((el) => {
            if (!el.paused) {
              const initialVolume = el.volume;
              let currentStep = 0;
              const fadeInterval = setInterval(() => {
                currentStep++;
                const factor = Math.max(0, 1 - currentStep / steps);
                el.volume = initialVolume * factor;
                if (currentStep >= steps || el.volume <= 0.01) {
                  clearInterval(fadeInterval);
                  try {
                    el.pause();
                    el.volume = initialVolume;
                  } catch (err) {}
                }
              }, stepIntervalMs);
            }
          });
        } else {
          mediaElements.forEach((el) => {
            try {
              el.pause();
            } catch (err) {}
          });
        }
      }
    } catch (e) {
      console.warn('Error fading DOM media elements:', e);
    }

    // 3. MediaSession API
    try {
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } catch (e) {
      console.warn('Error setting mediaSession state:', e);
    }

    // 4. Dispatch custom window event
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dy_sleep_timer_completed'));
      }
    } catch (e) {}
  }, []);

  // Completion Notification
  const triggerCompletionNotifications = useCallback(
    (completionNotifEnabled: boolean, notifEnabled: boolean) => {
      if (!completionNotifEnabled && !notifEnabled) return;

      // Save to DY Clock's Notification Center
      try {
        addNotificationToHistory({
          title: '🌙 Sleep Timer Finished',
          message: 'Media playback has been stopped.',
          type: 'timer',
        });
      } catch (e) {
        console.warn('Error saving to notification center:', e);
      }

      // Haptic and Audio cue
      try {
        if (settings.interfaceSoundsEnabled) synth.playTimerDoneChime();
        if (settings.hapticsEnabled) haptics.gentleReminder();
      } catch (e) {}

      // OS Native System Notification if granted
      try {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('🌙 Sleep Timer Finished', {
            body: 'Media playback has been stopped.',
          });
        }
      } catch (e) {}

      // In-app Event
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dy_toast_notification', {
              detail: {
                title: '🌙 Sleep Timer Finished',
                message: 'Media playback has been stopped.',
              },
            })
          );
        }
      } catch (e) {}
    },
    [settings.interfaceSoundsEnabled, settings.hapticsEnabled]
  );

  // Restore state on mount & handle offline background expiration
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const storedState: SleepTimerState = JSON.parse(raw);
        if (storedState.status === 'running' && storedState.endTime) {
          const now = Date.now();
          const diff = Math.max(0, Math.round((storedState.endTime - now) / 1000));
          if (diff > 0) {
            setState({
              ...storedState,
              remainingSeconds: diff,
            });
          } else {
            // Expired while offline or tab inactive
            stopMediaAndFadeOut(
              settings.sleepTimerFadeDuration ?? 5,
              settings.sleepTimerFadeOutEnabled ?? true
            );
            triggerCompletionNotifications(
              settings.sleepTimerCompletionNotificationEnabled ?? true,
              settings.sleepTimerNotificationsEnabled ?? true
            );
            const finishedState: SleepTimerState = {
              ...storedState,
              status: 'completed',
              remainingSeconds: 0,
              endTime: null,
            };
            setState(finishedState);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(finishedState));
          }
        } else {
          setState(storedState);
        }
      }
    } catch (e) {
      console.warn('Failed to load initial sleep timer state:', e);
    }
  }, [
    settings.sleepTimerFadeDuration,
    settings.sleepTimerFadeOutEnabled,
    settings.sleepTimerCompletionNotificationEnabled,
    settings.sleepTimerNotificationsEnabled,
    stopMediaAndFadeOut,
    triggerCompletionNotifications,
  ]);

  // Sync state changes to LocalStorage
  const updateAndPersistState = useCallback((nextState: SleepTimerState) => {
    setState(nextState);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (e) {
      console.warn('Failed to persist sleep timer state:', e);
    }
  }, []);

  // Interval Loop for live countdown
  useEffect(() => {
    if (state.status !== 'running' || !state.endTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.round((state.endTime! - now) / 1000));

      if (diff <= 0) {
        clearInterval(interval);
        stopMediaAndFadeOut(
          settings.sleepTimerFadeDuration ?? 5,
          settings.sleepTimerFadeOutEnabled ?? true
        );
        triggerCompletionNotifications(
          settings.sleepTimerCompletionNotificationEnabled ?? true,
          settings.sleepTimerNotificationsEnabled ?? true
        );
        const finishedState: SleepTimerState = {
          ...state,
          status: 'completed',
          remainingSeconds: 0,
          endTime: null,
        };
        updateAndPersistState(finishedState);
      } else {
        setState((prev) => ({
          ...prev,
          remainingSeconds: diff,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [
    state,
    settings.sleepTimerFadeDuration,
    settings.sleepTimerFadeOutEnabled,
    settings.sleepTimerCompletionNotificationEnabled,
    settings.sleepTimerNotificationsEnabled,
    stopMediaAndFadeOut,
    triggerCompletionNotifications,
    updateAndPersistState,
  ]);

  const startTimer = useCallback(
    (durationMinutesOverride?: number, customTotalSecondsOverride?: number) => {
      const mins = durationMinutesOverride ?? state.durationMinutes;
      const totalSecs = customTotalSecondsOverride ?? mins * 60;

      if (totalSecs <= 0) return;

      const now = Date.now();
      const endTime = now + totalSecs * 1000;

      const nextState: SleepTimerState = {
        ...state,
        status: 'running',
        durationMinutes: mins,
        totalSeconds: totalSecs,
        remainingSeconds: totalSecs,
        endTime,
        pausedAtRemaining: null,
      };

      updateAndPersistState(nextState);

      if (settings.hapticsEnabled) haptics.success();
      if (settings.interfaceSoundsEnabled) synth.playSuccessSound();

      if (settings.sleepTimerRememberLastDuration) {
        updateSetting('sleepTimerDefaultDuration', mins);
      }
    },
    [state, settings, updateAndPersistState, updateSetting]
  );

  const pauseTimer = useCallback(() => {
    if (state.status !== 'running') return;

    const nextState: SleepTimerState = {
      ...state,
      status: 'paused',
      pausedAtRemaining: state.remainingSeconds,
      endTime: null,
    };

    updateAndPersistState(nextState);

    if (settings.hapticsEnabled) haptics.medium();
    if (settings.interfaceSoundsEnabled) synth.playClick();
  }, [state, settings, updateAndPersistState]);

  const resumeTimer = useCallback(() => {
    if (state.status !== 'paused' || !state.pausedAtRemaining) return;

    const remainingSecs = state.pausedAtRemaining;
    const now = Date.now();
    const endTime = now + remainingSecs * 1000;

    const nextState: SleepTimerState = {
      ...state,
      status: 'running',
      remainingSeconds: remainingSecs,
      endTime,
      pausedAtRemaining: null,
    };

    updateAndPersistState(nextState);

    if (settings.hapticsEnabled) haptics.success();
    if (settings.interfaceSoundsEnabled) synth.playSuccessSound();
  }, [state, settings, updateAndPersistState]);

  const cancelTimer = useCallback(() => {
    const totalSecs = state.durationMinutes * 60;
    const nextState: SleepTimerState = {
      ...state,
      status: 'idle',
      remainingSeconds: totalSecs,
      endTime: null,
      pausedAtRemaining: null,
    };

    updateAndPersistState(nextState);

    if (settings.hapticsEnabled) haptics.light();
    if (settings.interfaceSoundsEnabled) synth.playClick();
  }, [state, settings, updateAndPersistState]);

  const resetTimer = useCallback(() => {
    cancelTimer();
  }, [cancelTimer]);

  const setPresetMinutes = useCallback(
    (minutes: number) => {
      const totalSecs = minutes * 60;
      const nextState: SleepTimerState = {
        ...state,
        durationMinutes: minutes,
        totalSeconds: totalSecs,
        remainingSeconds: state.status === 'idle' ? totalSecs : state.remainingSeconds,
        isCustom: false,
      };
      updateAndPersistState(nextState);
    },
    [state, updateAndPersistState]
  );

  const setCustomDuration = useCallback(
    (hours: number, minutes: number) => {
      const totalMins = hours * 60 + minutes;
      const totalSecs = totalMins * 60;
      const nextState: SleepTimerState = {
        ...state,
        durationMinutes: totalMins,
        totalSeconds: totalSecs,
        remainingSeconds: state.status === 'idle' ? totalSecs : state.remainingSeconds,
        isCustom: true,
        customHours: hours,
        customMinutes: minutes,
      };
      updateAndPersistState(nextState);
    },
    [state, updateAndPersistState]
  );

  // Formatting helpers
  const hours = Math.floor(state.remainingSeconds / 3600);
  const mins = Math.floor((state.remainingSeconds % 3600) / 60);
  const secs = state.remainingSeconds % 60;

  const hrsStr = hours.toString().padStart(2, '0');
  const minsStr = mins.toString().padStart(2, '0');
  const secsStr = secs.toString().padStart(2, '0');

  const totalFormatted =
    hours > 0 ? `${hrsStr}:${minsStr}:${secsStr}` : `${minsStr}:${secsStr}`;

  const progressPercent =
    state.totalSeconds > 0
      ? Math.max(0, Math.min(100, Math.round((state.remainingSeconds / state.totalSeconds) * 100)))
      : 0;

  return (
    <SleepTimerContext.Provider
      value={{
        state,
        startTimer,
        pauseTimer,
        resumeTimer,
        cancelTimer,
        resetTimer,
        setPresetMinutes,
        setCustomDuration,
        formattedRemaining: {
          hrs: hrsStr,
          mins: minsStr,
          secs: secsStr,
          totalFormatted,
        },
        progressPercent,
      }}
    >
      {children}
    </SleepTimerContext.Provider>
  );
};

export const useSleepTimer = () => {
  const context = useContext(SleepTimerContext);
  if (!context) {
    throw new Error('useSleepTimer must be used within a SleepTimerProvider');
  }
  return context;
};
