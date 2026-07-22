import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Play, Pause, X, RotateCcw, Settings2, Sparkles, VolumeX, ShieldCheck, Clock } from 'lucide-react';
import { useSleepTimer } from '../utils/sleepTimerContext';
import { useDateTimeSettings } from '../utils/settingsContext';
import { Theme } from '../types';

interface SleepTimerAdvancedCardProps {
  theme: Theme;
  onOpenSettings?: () => void;
}

const PRESET_BUTTONS = [
  { label: '15 Min', mins: 15 },
  { label: '30 Min', mins: 30 },
  { label: '45 Min', mins: 45 },
  { label: '1 Hour', mins: 60 },
  { label: '2 Hours', mins: 120 },
];

export const SleepTimerAdvancedCard: React.FC<SleepTimerAdvancedCardProps> = ({ theme, onOpenSettings }) => {
  const { settings } = useDateTimeSettings();
  const {
    state,
    startTimer,
    pauseTimer,
    resumeTimer,
    cancelTimer,
    resetTimer,
    setPresetMinutes,
    setCustomDuration,
    formattedRemaining,
    progressPercent,
  } = useSleepTimer();

  const [activeTabMode, setActiveTabMode] = useState<'presets' | 'custom'>('presets');
  const [customHrs, setCustomHrs] = useState<number>(0);
  const [customMins, setCustomMins] = useState<number>(15);

  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isCompleted = state.status === 'completed';
  const isActive = isRunning || isPaused;

  const handleCustomStart = () => {
    const totalMins = customHrs * 60 + customMins;
    if (totalMins <= 0) return;
    setCustomDuration(customHrs, customMins);
    startTimer(totalMins);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
      className={`p-6 rounded-3xl ${theme.cardBg} border ${theme.border} space-y-5 shadow-2xl relative overflow-hidden`}
      id="sleep-timer-advanced-card"
    >
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-900 to-purple-900 border border-indigo-700/50 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/10">
            <Moon className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-wide">Sleep Timer</h2>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800/60">
                Media Auto-Stop
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Fall asleep peacefully while listening to music, podcasts, or relaxing sounds
            </p>
          </div>
        </div>

        {onOpenSettings && (
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all cursor-pointer shadow-sm"
            title="Configure Sleep Timer Settings"
          >
            <Settings2 className="w-4 h-4 text-indigo-400" />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {!isActive && !isCompleted ? (
          <motion.div
            key="config-mode"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 relative z-10"
          >
            {/* Toggle Mode: Presets vs Custom */}
            <div className="flex items-center justify-between gap-2 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTabMode('presets')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTabMode === 'presets'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Quick Presets
              </button>
              <button
                type="button"
                onClick={() => setActiveTabMode('custom')}
                className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTabMode === 'custom'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" /> Custom Duration
              </button>
            </div>

            {/* PRESETS GRID */}
            {activeTabMode === 'presets' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_BUTTONS.map((preset) => {
                    const isSelected = !state.isCustom && state.durationMinutes === preset.mins;
                    return (
                      <button
                        key={preset.mins}
                        type="button"
                        onClick={() => {
                          setPresetMinutes(preset.mins);
                          startTimer(preset.mins);
                        }}
                        className={`p-3.5 rounded-2xl border text-left transition-all active:scale-95 cursor-pointer group relative overflow-hidden ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-slate-900/70 border-slate-800/80 hover:border-indigo-500/40 text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-400 group-hover:text-indigo-300 transition-colors">
                          Preset
                        </div>
                        <div className="text-base font-black text-white mt-0.5 flex items-center justify-between">
                          <span>{preset.label}</span>
                          <Play className="w-3.5 h-3.5 fill-indigo-400 text-indigo-400 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CUSTOM DURATION PICKER */}
            {activeTabMode === 'custom' && (
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-center gap-4 text-center">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Hours</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={customHrs}
                      onChange={(e) => setCustomHrs(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-black text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-2xl font-black text-slate-500 self-end pb-2">:</span>
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Minutes</label>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customMins}
                      onChange={(e) => setCustomMins(Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)))}
                      className="w-20 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-black text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCustomStart}
                  className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:opacity-95 text-white font-black text-sm rounded-xl shadow-xl shadow-indigo-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Start Custom Sleep Timer
                </button>
              </div>
            )}

            {/* Features Info Badge */}
            <div className="p-3 bg-indigo-950/30 border border-indigo-900/40 rounded-xl flex items-center justify-between text-[11px] text-slate-300">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>
                  Fade-out volume smoothly over{' '}
                  <strong className="text-white">{settings.sleepTimerFadeDuration || 5} seconds</strong>
                </span>
              </span>
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50">
                100% Offline
              </span>
            </div>
          </motion.div>
        ) : isCompleted ? (
          /* COMPLETED STATE */
          <motion.div
            key="completed-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-slate-900/90 border border-indigo-500/40 rounded-2xl text-center space-y-4 relative z-10 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
              <VolumeX className="w-7 h-7 animate-bounce" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Media Playback Stopped</h3>
              <p className="text-xs text-slate-300 mt-1">
                Sleep timer completed! Audio was smoothly faded out and stopped.
              </p>
            </div>

            <button
              type="button"
              onClick={resetTimer}
              className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset Sleep Timer
            </button>
          </motion.div>
        ) : (
          /* ACTIVE / COUNTDOWN MODE */
          <motion.div
            key="active-mode"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-slate-900/90 border border-indigo-500/40 rounded-2xl space-y-5 relative z-10 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  {isRunning ? 'Sleep Timer Active' : 'Sleep Timer Paused'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800 py-0.5 px-2 rounded-md">
                {progressPercent}% remaining
              </span>
            </div>

            {/* Giant Digital Countdown Display */}
            <div className="text-center py-2">
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-white drop-shadow-[0_0_20px_rgba(129,140,248,0.3)]">
                {formattedRemaining.totalFormatted}
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Music and media will stop automatically at 00:00
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800/90 h-3 rounded-full overflow-hidden border border-slate-700 relative shadow-inner">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full"
                style={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {isRunning ? (
                <button
                  type="button"
                  onClick={pauseTimer}
                  className="py-2.5 px-6 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  Pause
                </button>
              ) : (
                <button
                  type="button"
                  onClick={resumeTimer}
                  className="py-2.5 px-6 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Resume
                </button>
              )}

              <button
                type="button"
                onClick={cancelTimer}
                className="py-2.5 px-6 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SleepTimerAdvancedCard;
