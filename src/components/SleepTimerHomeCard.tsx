import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Play, Pause, X, RotateCcw, Clock, VolumeX } from 'lucide-react';
import { useSleepTimer } from '../utils/sleepTimerContext';
import { Theme } from '../types';

interface SleepTimerHomeCardProps {
  theme: Theme;
  onOpenAdvanced?: () => void;
}

const PRESET_OPTIONS = [
  { label: '15 Minutes', mins: 15 },
  { label: '30 Minutes', mins: 30 },
  { label: '45 Minutes', mins: 45 },
  { label: '1 Hour', mins: 60 },
  { label: '2 Hours', mins: 120 },
];

export const SleepTimerHomeCard: React.FC<SleepTimerHomeCardProps> = ({ theme, onOpenAdvanced }) => {
  const {
    state,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    resetTimer,
    setPresetMinutes,
    formattedRemaining,
    progressPercent,
  } = useSleepTimer();

  const [selectedMins, setSelectedMins] = useState<number>(state.durationMinutes || 30);

  const handlePresetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mins = parseInt(e.target.value, 10);
    setSelectedMins(mins);
    setPresetMinutes(mins);
  };

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isCompleted = state.status === 'completed';
  const isActive = isRunning || isPaused;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-5 rounded-2xl ${theme.cardBg} border ${theme.border} relative overflow-hidden shadow-xl group`}
      id="home-sleep-timer-card"
    >
      {/* Ambient background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all`} />

      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-800/50 flex items-center justify-center text-indigo-400 shadow-inner">
            <Moon className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              Sleep Timer
              {isActive && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {isRunning ? 'Running' : 'Paused'}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Automatically stop your music
            </p>
          </div>
        </div>

        {onOpenAdvanced && (
          <button
            type="button"
            onClick={onOpenAdvanced}
            className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 py-1 px-2 rounded-lg bg-indigo-950/40 border border-indigo-900/30"
            title="Open Advanced Sleep Controls"
          >
            <Clock className="w-3 h-3" />
            Advanced
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!isActive && !isCompleted ? (
          /* IDLE / PRESET SELECTOR VIEW */
          <motion.div
            key="idle-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex items-center gap-2.5 pt-2 relative z-10"
          >
            <div className="relative flex-1">
              <select
                value={selectedMins}
                onChange={handlePresetSelect}
                className="w-full bg-slate-900/90 border border-slate-700/80 text-slate-100 text-xs font-bold py-2.5 px-3 rounded-xl appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                aria-label="Select Sleep Timer Duration"
              >
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.mins} value={opt.mins} className="bg-slate-900 text-slate-100">
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                ▼
              </div>
            </div>

            <button
              type="button"
              onClick={() => startTimer(selectedMins)}
              className="py-2.5 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              id="home-start-sleep-timer-btn"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start
            </button>
          </motion.div>
        ) : isCompleted ? (
          /* COMPLETED VIEW */
          <motion.div
            key="completed-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-indigo-950/40 border border-indigo-800/40 rounded-xl flex items-center justify-between gap-3 mt-2 relative z-10"
          >
            <div className="flex items-center gap-2">
              <VolumeX className="w-4 h-4 text-emerald-400 animate-bounce" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Media Playback Stopped</p>
                <p className="text-[9px] text-slate-400 font-medium">Smooth 5s fade-out completed</p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetTimer}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ) : (
          /* RUNNING / PAUSED COUNTDOWN VIEW */
          <motion.div
            key="active-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3 pt-1 relative z-10"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400">
                  Remaining Time
                </span>
                <div className="text-2xl font-black tracking-tight text-white font-mono leading-none mt-0.5">
                  {formattedRemaining.totalFormatted}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {isRunning ? (
                  <button
                    type="button"
                    onClick={pauseTimer}
                    className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Pause Sleep Timer"
                  >
                    <Pause className="w-3 h-3 fill-current" />
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resumeTimer}
                    className="py-1.5 px-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                    title="Resume Sleep Timer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Resume
                  </button>
                )}

                <button
                  type="button"
                  onClick={cancelTimer}
                  className="p-1.5 bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-slate-400 rounded-xl transition-all cursor-pointer"
                  title="Cancel Sleep Timer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden border border-slate-700/50 relative">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SleepTimerHomeCard;
