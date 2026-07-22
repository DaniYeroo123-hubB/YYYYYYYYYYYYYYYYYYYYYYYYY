import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Theme } from '../types';
import { Play, Pause, RotateCcw, Hourglass, Bell, Star } from 'lucide-react';
import { synth } from '../utils/synth';
import { useDateTimeSettings } from '../utils/settingsContext';
import { getSpringTransition, getButtonMotion } from '../utils/motion';
import { motion, AnimatePresence } from 'motion/react';
import haptics from '../utils/haptics';
import SleepTimerAdvancedCard from './SleepTimerAdvancedCard';

interface TimerTabProps {
  theme: Theme;
  onTimerCompleted?: (minutes: number) => void;
  onOpenSettings?: () => void;
}

const PRESETS = [
  { label: '1 Min', value: 60 },
  { label: '3 Min', value: 180 },
  { label: '5 Min', value: 300 },
  { label: '10 Min', value: 600 },
  { label: '15 Min', value: 900 },
  { label: '25 Min 🍅', value: 1500 }, // Pomodoro
  { label: '45 Min', value: 2700 },
  { label: '1 Hour', value: 3600 },
];

export default function TimerTab({ theme, onTimerCompleted }: TimerTabProps) {
  const { settings } = useDateTimeSettings();

  // Input States
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);

  // Active Countdown States
  const [isRunning, setIsRunning] = useState(false);
  const [totalDuration, setTotalDuration] = useState(0); // in seconds
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [showFinishedAlert, setShowFinishedAlert] = useState(false);

  const timerRef = useRef<number | null>(null);
  const timerSessionRef = useRef<{ startTime: number; sessionId: string } | null>(null);

  // Sync active timer session info with localStorage for Smart Notifications
  useEffect(() => {
    if (isRunning) {
      if (!timerSessionRef.current) {
        const now = Date.now();
        timerSessionRef.current = { startTime: now, sessionId: `timer-${now}` };
      }
      localStorage.setItem('dy_active_timer_info', JSON.stringify({
        isRunning: true,
        startTime: timerSessionRef.current.startTime,
        sessionId: timerSessionRef.current.sessionId,
      }));
    } else {
      if (timeLeft === 0 || totalDuration === 0) {
        timerSessionRef.current = null;
      }
      localStorage.setItem('dy_active_timer_info', JSON.stringify({
        isRunning: false,
        startTime: timerSessionRef.current?.startTime || null,
        sessionId: timerSessionRef.current?.sessionId || null,
      }));
    }
    window.dispatchEvent(new Event('dy_timer_state_changed'));
  }, [isRunning, timeLeft, totalDuration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    setShowFinishedAlert(true);
    synth.playTimerDoneChime();
    haptics.timerFinished();
    
    if (onTimerCompleted) {
      onTimerCompleted(Math.round(totalDuration / 60) || 1);
    }
  };

  const handleStart = () => {
    synth.init();
    synth.playClick();
    const duration = hours * 3600 + minutes * 60 + seconds;
    if (duration <= 0) {
      haptics.error();
      return;
    }

    haptics.success();
    setTotalDuration(duration);
    setTimeLeft(duration);
    setIsRunning(true);
  };

  const handlePauseResume = () => {
    synth.init();
    haptics.medium();
    const nextRunning = !isRunning;
    synth.playClick();
    setIsRunning(nextRunning);
  };

  const handleCancel = () => {
    synth.init();
    synth.playDismiss();
    haptics.heavy();
    setIsRunning(false);
    setTimeLeft(0);
    setTotalDuration(0);
  };

  const handlePresetSelect = (durationSecs: number) => {
    synth.init();
    synth.playClick();
    haptics.success();

    setHours(Math.floor(durationSecs / 3600));
    setMinutes(Math.floor((durationSecs % 3600) / 60));
    setSeconds(durationSecs % 60);

    setTotalDuration(durationSecs);
    setTimeLeft(durationSecs);
    setIsRunning(true);
  };

  const formatTimeLeft = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;

    const pad = (num: number) => num.toString().padStart(2, '0');

    return {
      h: pad(h),
      m: pad(m),
      s: pad(s),
      hasHours: h > 0,
    };
  };

  const formatted = formatTimeLeft(timeLeft);

  // SVG Dial Math
  const progressPercent = totalDuration > 0 ? (timeLeft / totalDuration) : 1;
  const strokeDashoffset = 502.4 - (502.4 * progressPercent);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in" id="timer-tab-wrapper">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        
        {/* LEFT COLUMN: SWEEPING COUNTDOWN TIMER RING */}
        <div className="relative flex flex-col items-center justify-center p-2" id="timer-progress-panel">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Ambient background glow */}
            <div className={`absolute inset-4 rounded-full bg-${theme.primary}/5 filter blur-xl`} />
            
            {/* SVG Circular Sweeper Progress Track */}
            <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 180 180">
              <circle
                cx="90"
                cy="90"
                r="80"
                fill="none"
                stroke="currentColor"
                className="text-slate-900"
                strokeWidth="4"
              />
              <motion.circle
                cx="90"
                cy="90"
                r="80"
                fill="none"
                stroke={`url(#timer-gradient-${theme.id})`}
                strokeWidth="6"
                strokeDasharray="502.4"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              <defs>
                <linearGradient id={`timer-gradient-${theme.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={theme.id === 'midnight-minimal' ? '#f1f5f9' : `var(--color-${theme.primary}, #38bdf8)`} />
                  <stop offset="100%" stopColor={theme.id === 'midnight-minimal' ? '#64748b' : `var(--color-${theme.secondary}, #ec4899)`} />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Digital Display of Time Left */}
            <div className="relative flex flex-col items-center justify-center z-10 font-mono select-none text-center">
              {totalDuration > 0 ? (
                <div className="flex items-baseline justify-center">
                  {formatted.hasHours && (
                    <>
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight leading-none">
                        {formatted.h}
                      </span>
                      <span className="text-xl font-bold text-slate-500 mx-1">:</span>
                    </>
                  )}
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-none">
                    {formatted.m}
                  </span>
                  <span className="text-2xl sm:text-3xl font-bold text-slate-500 mx-1">:</span>
                  <span className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-none">
                    {formatted.s}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center text-slate-500">
                  <Hourglass className="w-10 h-10 animate-pulse" />
                </div>
              )}
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-3">
                {isRunning ? 'Ticking Down' : 'Set Alarm'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PRESETS, TIME ADJUSTMENTS, AND ACTION CONTROLS */}
        <div className="flex-1 w-full space-y-6" id="timer-settings-panel">
          {totalDuration > 0 ? (
            /* Active Mode Controls Card */
            <div className={`p-6 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-6 relative overflow-hidden`} id="timer-active-dashboard">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
                  Countdown Complication
                </span>
                <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase bg-${theme.primary}/10 text-${theme.primary}`}>
                  {isRunning ? 'Running' : 'Paused'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  onClick={handlePauseResume}
                  {...getButtonMotion(settings.animationIntensity)}
                  transition={getSpringTransition(settings.animationIntensity)}
                  className={`py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-md cursor-pointer select-none transition-colors ${
                    isRunning 
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                      : `bg-gradient-to-tr ${theme.gradient} text-black hover:opacity-95`
                  }`}
                  id="timer-pause-resume"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" /> Resume
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={handleCancel}
                  {...getButtonMotion(settings.animationIntensity)}
                  transition={getSpringTransition(settings.animationIntensity)}
                  className={`py-3.5 px-6 rounded-xl border ${theme.border} bg-slate-950/30 hover:bg-slate-900 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer select-none`}
                  id="timer-cancel"
                >
                  <RotateCcw className="w-4 h-4 text-slate-400" /> Cancel
                </motion.button>
              </div>
            </div>
          ) : (
            /* Set Mode Calibration Card */
            <div className={`p-6 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-6`} id="timer-setup-dashboard">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  Timer Calibration
                </h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Select a duration preset or specify manual intervals below to calibrate the countdown sweep.
                </p>
              </div>

              {/* QUICK INTERVAL PRESETS */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Quick Registers</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" id="timer-presets-grid">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      onClick={() => handlePresetSelect(preset.value)}
                      className={`py-2 px-1.5 rounded-xl bg-slate-950/40 border ${theme.border} hover:border-${theme.primary}/40 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center active:scale-95 cursor-pointer`}
                      id={`preset-btn-${preset.label}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* TIME FIELDS SETTER */}
              <div className="space-y-3 pt-4 border-t border-slate-900/60" id="timer-scroll-gears">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Manual Selection</h3>
                <div className="flex gap-4 items-center justify-center bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
                  
                  {/* Hours */}
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={hours || ''}
                      placeholder="00"
                      onChange={(e) => setHours(Math.max(0, Math.min(23, parseInt(e.target.value) || 0)))}
                      className="w-12 text-center font-mono text-2xl font-black bg-transparent text-white border-b border-slate-800 focus:outline-none focus:border-cyan-400"
                      id="timer-hours-setter"
                    />
                    <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Hours</span>
                  </div>

                  <span className="text-lg font-bold text-slate-600 font-mono">:</span>

                  {/* Minutes */}
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={minutes || ''}
                      placeholder="00"
                      onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-12 text-center font-mono text-2xl font-black bg-transparent text-white border-b border-slate-800 focus:outline-none focus:border-cyan-400"
                      id="timer-minutes-setter"
                    />
                    <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Mins</span>
                  </div>

                  <span className="text-lg font-bold text-slate-600 font-mono">:</span>

                  {/* Seconds */}
                  <div className="flex flex-col items-center">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={seconds || ''}
                      placeholder="00"
                      onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                      className="w-12 text-center font-mono text-2xl font-black bg-transparent text-white border-b border-slate-800 focus:outline-none focus:border-cyan-400"
                      id="timer-seconds-setter"
                    />
                    <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Secs</span>
                  </div>
                </div>
              </div>

              {/* Start Timer Action */}
              <button
                onClick={handleStart}
                disabled={hours === 0 && minutes === 0 && seconds === 0}
                className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg cursor-pointer ${
                  (hours === 0 && minutes === 0 && seconds === 0)
                    ? 'bg-slate-900 border border-slate-800 text-slate-500 pointer-events-none'
                    : `bg-gradient-to-tr ${theme.gradient} text-black font-extrabold`
                }`}
                id="timer-start-calibration"
              >
                Set & Start Countdown
              </button>
            </div>
          )}
        </div>

      </div>

      {/* Dedicated Sleep Timer Section */}
      <SleepTimerAdvancedCard theme={theme} onOpenSettings={onOpenSettings} />

      {/* Finished alert Modal */}
      <AnimatePresence>
        {showFinishedAlert && (
          <div
            id="timer-completed-modal"
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fade-in"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden"
              id="timer-complete-box"
            >
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-cyan-500/10 to-transparent blur-xl pointer-events-none" />

              <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10 relative">
                <Bell className="w-7 h-7 text-cyan-400 animate-bounce" />
                <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
                  Time's Up! <Star className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                </h2>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                  The digital sweep countdown alarm has successfully reached zero.
                </p>
              </div>

              <button
                onClick={() => {
                  haptics.heavy();
                  setShowFinishedAlert(false);
                  setTotalDuration(0);
                  setTimeLeft(0);
                }}
                className={`w-full py-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} text-black font-extrabold text-sm shadow-xl active:scale-95 transition-all cursor-pointer`}
                id="timer-dismiss-alarm"
              >
                Deactivate Alarm
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
