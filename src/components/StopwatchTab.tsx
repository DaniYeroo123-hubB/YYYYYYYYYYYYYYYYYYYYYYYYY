import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Lap, Theme } from '../types';
import { Play, Pause, RotateCcw, Flag, Award } from 'lucide-react';
import { synth } from '../utils/synth';
import haptics from '../utils/haptics';
import { useDateTimeSettings } from '../utils/settingsContext';
import { getSpringTransition, getButtonMotion } from '../utils/motion';
import { motion, AnimatePresence } from 'motion/react';
import { getThemeClasses } from '../utils/themes';

interface StopwatchTabProps {
  theme: Theme;
  onStartStopwatch?: () => void;
  onLapRecorded?: (stopwatchSeconds: number) => void;
}

export default function StopwatchTab({ theme, onStartStopwatch, onLapRecorded }: StopwatchTabProps) {
  const { settings } = useDateTimeSettings();
  const themeClasses = useMemo(() => getThemeClasses(theme.id), [theme.id]);

  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // in milliseconds
  const [laps, setLaps] = useState<Lap[]>([]);

  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);

  // High precision update loop
  const updateTimer = (timestamp: number) => {
    if (previousTimeRef.current !== null) {
      const delta = timestamp - previousTimeRef.current;
      setTime((prevTime) => prevTime + delta);
    }
    previousTimeRef.current = timestamp;
    requestRef.current = requestAnimationFrame(updateTimer);
  };

  useEffect(() => {
    if (isRunning) {
      previousTimeRef.current = null;
      requestRef.current = requestAnimationFrame(updateTimer);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isRunning]);

  const handleStartPause = () => {
    synth.init();
    haptics.medium();
    const nextRunning = !isRunning;
    
    if (nextRunning) {
      synth.playClick();
      if (onStartStopwatch) {
        onStartStopwatch();
      }
    } else {
      synth.playClick();
    }
    setIsRunning(nextRunning);
  };

  const handleReset = () => {
    synth.init();
    synth.playDismiss();
    haptics.heavy();
    setIsRunning(false);
    setTime(0);
    setLaps([]);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  const handleLap = () => {
    if (!isRunning) return;
    synth.playTick();
    haptics.tick();

    const currentTotal = time;
    const lapNumber = laps.length + 1;
    const previousTotal = laps.length > 0 ? laps[laps.length - 1].splitTime : 0;
    const lapTime = currentTotal - previousTotal;

    const newLap: Lap = {
      lapNumber,
      lapTime,
      splitTime: currentTotal,
    };

    const updatedLaps = [...laps, newLap];

    if (updatedLaps.length > 1) {
      let minIdx = 0;
      let maxIdx = 0;
      let minVal = updatedLaps[0].lapTime;
      let maxVal = updatedLaps[0].lapTime;

      updatedLaps.forEach((lap, index) => {
        lap.isBest = false;
        lap.isWorst = false;
        if (lap.lapTime < minVal) {
          minVal = lap.lapTime;
          minIdx = index;
        }
        if (lap.lapTime > maxVal) {
          maxVal = lap.lapTime;
          maxIdx = index;
        }
      });

      updatedLaps[minIdx].isBest = true;
      updatedLaps[maxIdx].isWorst = true;
    }

    if (onLapRecorded) {
      onLapRecorded(time / 1000);
    }

    setLaps(updatedLaps);
  };

  // Format time into minutes, seconds, centiseconds
  const formatTime = (totalMs: number) => {
    const minutes = Math.floor(totalMs / 60000);
    const seconds = Math.floor((totalMs % 60000) / 1000);
    const centiseconds = Math.floor((totalMs % 1000) / 10);

    const pad = (num: number) => num.toString().padStart(2, '0');

    return {
      minutes: pad(minutes),
      seconds: pad(seconds),
      centiseconds: pad(centiseconds),
    };
  };

  const formatted = formatTime(time);

  // Calculate visual rotation/percentage (for 60 seconds progress)
  const secondsFraction = (time % 60000) / 60000;
  const strokeDashoffset = 502.4 - (502.4 * secondsFraction);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in" id="stopwatch-tab-wrapper">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
        
        {/* LEFT COLUMN: SWEEPING DIGITAL PROGRESS DISPLAY */}
        <div className="relative flex flex-col items-center justify-center p-2" id="stopwatch-progress-panel">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            {/* Ambient background glow matching theme */}
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
                stroke={`url(#stopwatch-gradient-${theme.id})`}
                strokeWidth="6"
                strokeDasharray="502.4"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-75"
              />
              <defs>
                <linearGradient id={`stopwatch-gradient-${theme.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={theme.id === 'midnight-minimal' ? '#f1f5f9' : `var(--color-${theme.primary}, #38bdf8)`} />
                  <stop offset="100%" stopColor={theme.id === 'midnight-minimal' ? '#64748b' : `var(--color-${theme.secondary}, #ec4899)`} />
                </linearGradient>
              </defs>
            </svg>

            {/* Centered Large High-Contrast Digital Display */}
            <div className="relative flex flex-col items-center justify-center z-10 font-mono select-none text-center">
              <div className="flex items-baseline justify-center">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-none">
                  {formatted.minutes}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-500 mx-1">:</span>
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight leading-none">
                  {formatted.seconds}
                </span>
                <span className="text-2xl sm:text-3xl font-bold text-slate-500 mx-1">.</span>
                <span className={`text-3xl sm:text-4xl font-semibold text-${theme.primary} tracking-tight leading-none min-w-[3rem]`}>
                  {formatted.centiseconds}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-3">
                {isRunning ? 'Ticking' : 'Stopped'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTION CONTROLS & LAP HISTORY LIST */}
        <div className="flex-1 w-full space-y-6" id="stopwatch-data-panel">
          <div className={`p-6 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-6 relative overflow-hidden`} id="stopwatch-controls-card">
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 flex items-center gap-1.5">
                Stopwatch Engine
              </span>
              <span className={`text-[9px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase bg-${theme.primary}/10 text-${theme.primary}`}>
                {isRunning ? 'Active' : time > 0 ? 'Paused' : 'Ready'}
              </span>
            </div>

            {/* Action Buttons with smooth micro-interactions */}
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                onClick={handleStartPause}
                {...getButtonMotion(settings.animationIntensity)}
                transition={getSpringTransition(settings.animationIntensity)}
                className={`py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 text-xs font-bold shadow-md cursor-pointer select-none transition-colors ${
                  isRunning 
                    ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                    : `bg-gradient-to-tr ${theme.gradient} text-black hover:opacity-95`
                }`}
                id="stopwatch-start-pause"
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" /> Start
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={isRunning ? handleLap : handleReset}
                disabled={time === 0}
                {...getButtonMotion(settings.animationIntensity)}
                transition={getSpringTransition(settings.animationIntensity)}
                className={`py-3.5 px-6 rounded-xl border ${theme.border} bg-slate-950/30 hover:bg-slate-900 text-slate-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-20 disabled:pointer-events-none`}
                id="stopwatch-lap-reset"
              >
                {isRunning ? (
                  <>
                    <Flag className="w-4 h-4 text-cyan-400" /> Lap
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 text-slate-400" /> Reset
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Laps List ledger */}
          <AnimatePresence>
            {laps.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={getSpringTransition(settings.animationIntensity)}
                className={`p-5 rounded-2xl ${theme.cardBg} border ${theme.border} overflow-hidden flex flex-col`}
                id="stopwatch-laps-panel"
              >
                <div className="flex justify-between items-center mb-4 border-b border-slate-900/60 pb-3">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-indigo-400" /> Recorded Splits
                  </h3>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-900">
                    {laps.length} Splits
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2 pr-1" id="stopwatch-laps-scroller">
                  {laps.slice().reverse().map((lap) => {
                    const fLap = formatTime(lap.lapTime);
                    const fSplit = formatTime(lap.splitTime);
                    
                    let badgeColor = 'text-slate-400 bg-slate-950 border-slate-900';
                    let rowBg = 'bg-slate-950/20 border-slate-900/40';
                    
                    if (lap.isBest) {
                      badgeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30';
                      rowBg = 'bg-emerald-950/10 border-emerald-900/20';
                    } else if (lap.isWorst) {
                      badgeColor = 'text-rose-400 bg-rose-950/40 border-rose-900/30';
                      rowBg = 'bg-rose-950/10 border-rose-900/20';
                    }

                    return (
                      <motion.div
                        key={lap.lapNumber}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${rowBg}`}
                        id={`stopwatch-lap-row-${lap.lapNumber}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-extrabold text-[11px] border ${badgeColor}`}>
                            #{lap.lapNumber}
                          </span>
                          <div>
                            <p className="font-extrabold text-white font-mono text-sm leading-none">
                              {fLap.minutes}:{fLap.seconds}.{fLap.centiseconds}
                            </p>
                            <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wide flex items-center gap-1">
                              {lap.isBest && <Award className="w-2.5 h-2.5 text-emerald-400" />}
                              {lap.isWorst && <Award className="w-2.5 h-2.5 text-rose-400" />}
                              Lap Time
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold text-slate-400 font-mono text-xs leading-none">
                            {fSplit.minutes}:{fSplit.seconds}.{fSplit.centiseconds}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-wide">Split Time</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
