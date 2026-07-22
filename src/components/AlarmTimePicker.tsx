import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Theme } from '../types';
import haptics from '../utils/haptics';
import synth from '../utils/synth';
import { getThemeClasses } from '../utils/themes';

interface AlarmTimePickerProps {
  value: string; // "HH:MM" (24-hour format)
  onChange: (value: string) => void;
  theme: Theme;
}

export default function AlarmTimePicker({ value, onChange, theme }: AlarmTimePickerProps) {
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [hour, setHour] = useState(7); // 1-12
  const [minute, setMinute] = useState(0); // 0-59
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isPeriodManuallySet, setIsPeriodManuallySet] = useState(false);

  const isDraggingRef = useRef(false);
  const clockFaceRef = useRef<HTMLDivElement>(null);
  const lastSentValueRef = useRef<string>('');
  const hourBtnRef = useRef<HTMLButtonElement>(null);
  const minuteBtnRef = useRef<HTMLButtonElement>(null);

  // Synchronize focus dynamically on keyboard or mode switch
  useEffect(() => {
    if (mode === 'hours') {
      hourBtnRef.current?.focus({ preventScroll: true });
    } else {
      minuteBtnRef.current?.focus({ preventScroll: true });
    }
  }, [mode]);

  const updateTime = (h: number, m: number, p: 'AM' | 'PM') => {
    let h24 = h % 12;
    if (p === 'PM') h24 += 12;
    
    const hrsStr = String(h24).padStart(2, '0');
    const minsStr = String(m).padStart(2, '0');
    const newValue = `${hrsStr}:${minsStr}`;
    lastSentValueRef.current = newValue;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, targetMode: 'hours' | 'minutes') => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      haptics.tick();
      synth.playSlider();
      if (targetMode === 'hours') {
        let nextH = hour + 1;
        if (nextH > 12) nextH = 1;
        setHour(nextH);
        updateTime(nextH, minute, period);
      } else {
        let nextM = minute + 1;
        if (nextM > 59) nextM = 0;
        setMinute(nextM);
        updateTime(hour, nextM, period);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      haptics.tick();
      synth.playSlider();
      if (targetMode === 'hours') {
        let nextH = hour - 1;
        if (nextH < 1) nextH = 12;
        setHour(nextH);
        updateTime(nextH, minute, period);
      } else {
        let nextM = minute - 1;
        if (nextM < 0) nextM = 59;
        setMinute(nextM);
        updateTime(hour, nextM, period);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      haptics.light();
      synth.playClick();
      setMode(targetMode === 'hours' ? 'minutes' : 'hours');
    }
  };

  // Sync internal state with external value prop on initialization and updates
  useEffect(() => {
    if (value && value.includes(':')) {
      if (value !== lastSentValueRef.current) {
        const [hStr, mStr] = value.split(':');
        const h24 = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        
        const p = h24 >= 12 ? 'PM' : 'AM';
        let h12 = h24 % 12;
        if (h12 === 0) h12 = 12;

        setHour(h12);
        setMinute(m);
        setPeriod(p);
        setIsPeriodManuallySet(false); // Reset manual override flag for a brand-new external value
      }
    }
  }, [value]);

  const updateValueFromPointer = (clientX: number, clientY: number) => {
    if (!clockFaceRef.current) return;
    const rect = clockFaceRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;

    // Calculate angle in degrees from center (0 deg is top/12 o'clock)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hours') {
      // 12 sectors of 30 degrees each
      let selectedH = Math.round(angle / 30);
      if (selectedH === 0) selectedH = 12;
      if (selectedH > 12) selectedH = 12;

      if (selectedH !== hour) {
        // Automatically determine AM/PM boundary crossing
        if ((hour === 11 && selectedH === 12) || (hour === 12 && selectedH === 11)) {
          const nextPeriod = period === 'AM' ? 'PM' : 'AM';
          setPeriod(nextPeriod);
          haptics.medium();
          synth.playSwitch(nextPeriod === 'AM');
          setHour(selectedH);
          updateTime(selectedH, minute, nextPeriod);
        } else {
          let nextPeriod = period;
          if (!isPeriodManuallySet) {
            // Predict most likely period: morning hours 5-11 are AM, other hours (1-4, 12) are PM
            const predictedPeriod = (selectedH >= 5 && selectedH <= 11) ? 'AM' : 'PM';
            if (predictedPeriod !== period) {
              nextPeriod = predictedPeriod;
              setPeriod(nextPeriod);
              synth.playSwitch(nextPeriod === 'AM');
            }
          }
          haptics.tick();
          synth.playSlider();
          setHour(selectedH);
          updateTime(selectedH, minute, nextPeriod);
        }
      }
    } else {
      // 60 sectors of 6 degrees each
      let selectedM = Math.round(angle / 6) % 60;
      
      if (selectedM !== minute) {
        haptics.tick();
        synth.playSlider();
        setMinute(selectedM);
        updateTime(hour, selectedM, period);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    updateValueFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    updateValueFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Subtle tactile trigger upon lock-in
    haptics.medium();
    
    if (mode === 'hours') {
      synth.playClick();
      // Animate transition to minutes mode smoothly
      setTimeout(() => {
        setMode('minutes');
      }, 200);
    } else {
      synth.playSuccessSound();
    }
  };

  // Obtain rich Tailwind mapped colors for the current theme
  const themeClasses = getThemeClasses(theme.id);

  return (
    <div 
      className={`flex flex-col items-center justify-center p-5 sm:p-6 border ${theme.border} rounded-3xl relative overflow-hidden shadow-2xl w-full select-none`}
      style={{ backgroundColor: theme.id === 'neon-aura' ? '#0e172a' : theme.id === 'cyberpunk' ? '#18181b' : theme.id === 'midnight-minimal' ? '#171717' : theme.id === 'rose-gold' ? '#2d0f1a' : theme.id === 'forest-amber' ? '#062619' : theme.id === 'classic-silver' ? '#17223b' : '#0e172a' }}
      id="custom-radial-time-picker"
    >
      {/* Dynamic Ambient Background Wash from Theme */}
      <div className={`absolute inset-0 bg-gradient-to-b from-${theme.primary}/5 to-transparent pointer-events-none z-0`} />

      {/* 1. DIGIT READOUT & CONTROLS DISPLAY */}
      <div className="flex items-center justify-center gap-3 mb-6 relative z-10 font-sans">
        <div className="flex items-center bg-black/40 border border-slate-900/50 p-1.5 rounded-2xl shadow-inner">
          {/* HOUR SELECTOR TAB */}
          <button
            ref={hourBtnRef}
            type="button"
            onClick={() => {
              haptics.light();
              synth.playClick();
              setMode('hours');
            }}
            onKeyDown={(e) => handleKeyDown(e, 'hours')}
            className={`text-5xl font-extrabold tracking-tight px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-${theme.primary} ${
              mode === 'hours'
                ? `text-${theme.primary} bg-${theme.primary}/10 border border-${theme.primary}/20 shadow-[0_0_12px_rgba(var(--theme-primary-rgb,34,211,238),0.15)]`
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {hour}
          </button>

          <span className="text-3xl font-extrabold text-slate-700 mx-1.5 animate-pulse">:</span>

          {/* MINUTE SELECTOR TAB */}
          <button
            ref={minuteBtnRef}
            type="button"
            onClick={() => {
              haptics.light();
              synth.playClick();
              setMode('minutes');
            }}
            onKeyDown={(e) => handleKeyDown(e, 'minutes')}
            className={`text-5xl font-extrabold tracking-tight px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:ring-${theme.primary} ${
              mode === 'minutes'
                ? `text-${theme.primary} bg-${theme.primary}/10 border border-${theme.primary}/20 shadow-[0_0_12px_rgba(var(--theme-primary-rgb,34,211,238),0.15)]`
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {String(minute).padStart(2, '0')}
          </button>
        </div>

        {/* PERIOD SELECTOR AM/PM - Premium Segmented Control */}
        <div className="flex flex-col gap-1 bg-black/30 border border-slate-800/60 p-1 rounded-2xl shadow-inner ml-2">
          {(['AM', 'PM'] as const).map((p) => {
            const isSelected = period === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setIsPeriodManuallySet(true);
                  if (p !== period) {
                    haptics.medium();
                    synth.playSwitch(p === 'AM');
                    setPeriod(p);
                    updateTime(hour, minute, p);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') {
                    e.preventDefault();
                    setIsPeriodManuallySet(true);
                    const nextP = period === 'AM' ? 'PM' : 'AM';
                    haptics.medium();
                    synth.playSwitch(nextP === 'AM');
                    setPeriod(nextP);
                    updateTime(hour, minute, nextP);
                  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    setMode(mode === 'hours' ? 'minutes' : 'hours');
                  }
                }}
                className={`relative px-3.5 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-colors duration-300 cursor-pointer min-h-[32px] flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-${theme.primary} ${
                  isSelected ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="ampm-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 24 }}
                    className={`absolute inset-0 bg-gradient-to-r ${theme.gradient} rounded-xl shadow-lg`}
                  />
                )}
                <span className="relative z-10">{p}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CIRCULAR RADIAL CLOCK FACE */}
      <div className="relative flex items-center justify-center p-2 rounded-full bg-black/25 shadow-inner border border-slate-900/60 relative z-10">
        <div
          ref={clockFaceRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-full bg-slate-950 border border-slate-850 shadow-2xl flex items-center justify-center touch-none cursor-crosshair select-none overflow-hidden"
          style={{ touchAction: 'none' }}
        >
          {/* Subtle Dynamic Ambient Background Chime Inner Rim */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-${theme.primary}/5 via-transparent to-indigo-500/[0.02] rounded-full pointer-events-none`} />

          {/* Clean tick marks track rim */}
          <div className="absolute inset-5 rounded-full border border-slate-900/40 pointer-events-none" />

          {/* Center Pivot Point Node */}
          <div className={`absolute w-3 h-3 rounded-full bg-${theme.primary} shadow-md shadow-${theme.primary}/40 z-30`} />

          {/* Dynamic Hand (Framer Motion spring physics) */}
          <motion.div
            style={{
              position: 'absolute',
              bottom: '50%',
              left: '50%',
              width: '2.5px',
              height: mode === 'hours' ? '35%' : '42%', // Expansion of minute hand naturally!
              transformOrigin: 'bottom center',
              x: '-50%',
            }}
            animate={{
              rotate: mode === 'hours' ? hour * 30 : minute * 6,
            }}
            transition={{
              type: 'spring',
              stiffness: isDraggingRef.current ? 450 : 200,
              damping: isDraggingRef.current ? 26 : 22,
            }}
            className={`bg-${theme.primary} z-20`}
          >
            {/* Hand selector tip circle */}
            <div
              className={`absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border-2 border-${theme.primary} bg-${theme.primary}/15 backdrop-blur-[2px] flex items-center justify-center shadow-lg`}
              style={{
                boxShadow: `0 0 12px var(--theme-primary-color, rgba(34,211,238,0.25))`
              }}
            >
              <div className={`w-1.5 h-1.5 rounded-full bg-${theme.primary}`} />
            </div>
          </motion.div>

          {/* Minute tick-marks (only rendering non-multiples of 5 for minutes mode to reduce clutter) */}
          {mode === 'minutes' && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {Array.from({ length: 60 }).map((_, i) => {
                if (i % 5 === 0) return null; // Avoid overlapping with main labels
                const angleRad = (i * 6 * Math.PI) / 180;
                return (
                  <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-slate-600"
                    style={{
                      left: `calc(50% + ${44 * Math.sin(angleRad)}%)`,
                      top: `calc(50% - ${44 * Math.cos(angleRad)}%)`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                );
              })}
            </div>
          )}

          {/* Numbers arrangement */}
          <AnimatePresence mode="wait">
            {mode === 'hours' ? (
              <motion.div
                key="hours"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 pointer-events-none"
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const h = idx === 0 ? 12 : idx;
                  const angleRad = (idx * 30 * Math.PI) / 180;
                  const isSelected = hour === h;
                  return (
                    <div
                      key={h}
                      className={`absolute w-8 h-8 flex items-center justify-center font-sans text-[15px] font-bold transition-all duration-300 ${
                        isSelected
                          ? 'text-white font-black scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'text-slate-500'
                      }`}
                      style={{
                        left: `calc(50% + ${35 * Math.sin(angleRad)}%)`,
                        top: `calc(50% - ${35 * Math.cos(angleRad)}%)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {h}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="minutes"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="absolute inset-0 pointer-events-none"
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const m = idx * 5;
                  const angleRad = (idx * 30 * Math.PI) / 180;
                  const isSelected = minute === m;
                  return (
                    <div
                      key={m}
                      className={`absolute w-8 h-8 flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 ${
                        isSelected
                          ? 'text-white font-black scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                          : 'text-slate-500'
                      }`}
                      style={{
                        left: `calc(50% + ${42 * Math.sin(angleRad)}%)`,
                        top: `calc(50% - ${42 * Math.cos(angleRad)}%)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {String(m).padStart(2, '0')}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Micro Info Guide Tip */}
      <div className="w-full flex justify-center gap-2 mt-4 pt-2 z-10 border-t border-slate-900/30">
        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
          💡 Swipe or tap on dial face to edit
        </span>
      </div>
    </div>
  );
}
