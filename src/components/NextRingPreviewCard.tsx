import React, { useMemo } from 'react';
import { Theme } from '../types';
import { BellRing, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { calculateNextRing, formatAlarmTime } from '../utils/alarmUtils';
import { motion, AnimatePresence } from 'motion/react';

interface NextRingPreviewCardProps {
  time: string;
  repeatDays: number[];
  currentTime: Date;
  theme: Theme;
  timeFormat?: '12h' | '24h';
}

const getOpaqueCardBgColor = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura':
      return '#0f172a';
    case 'cyberpunk':
      return '#18181b';
    case 'midnight-minimal':
      return '#171717';
    case 'rose-gold':
      return '#2d0a17';
    case 'forest-amber':
      return '#064e3b';
    case 'classic-silver':
      return '#1e293b';
    default:
      return '#0f172a';
  }
};

export default function NextRingPreviewCard({
  time,
  repeatDays,
  currentTime,
  theme,
  timeFormat = '12h',
}: NextRingPreviewCardProps) {
  const nextRingInfo = useMemo(() => {
    return calculateNextRing(time, repeatDays, currentTime);
  }, [time, repeatDays, currentTime]);

  if (!nextRingInfo) return null;

  const formattedAlarm = formatAlarmTime(time, timeFormat);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ 
        duration: 0.22, 
        ease: [0.25, 1, 0.5, 1],
        layout: { duration: 0.22, ease: [0.25, 1, 0.5, 1] }
      }}
      className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl relative overflow-hidden`}
      style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
      id="next-ring-preview-card"
    >
      {/* Background ambient subtle accent glow */}
      <div className={`absolute top-0 right-0 w-36 h-36 bg-${theme.primary}/10 rounded-full blur-2xl pointer-events-none`} />

      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl bg-${theme.primary}/15 text-${theme.primary} border border-${theme.primary}/20`}>
            <BellRing className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-black tracking-widest text-slate-200 uppercase">
            ⏰ Next Ring
          </span>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border tracking-wide uppercase ${
          nextRingInfo.hasPassedToday 
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
            : `bg-${theme.primary}/15 text-${theme.primary} border-${theme.primary}/20`
        }`}>
          {nextRingInfo.hasPassedToday ? 'Next Cycle' : 'Scheduled'}
        </span>
      </div>

      {/* 2. Warning Banner if Time Already Passed Today */}
      <AnimatePresence mode="wait">
        {nextRingInfo.hasPassedToday && (
          <motion.div
            key="passed-warning"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className="flex items-center gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-semibold shadow-inner"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>⚠️ The selected time has already passed today.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Countdown Phrase */}
      <div className="text-sm sm:text-base font-bold text-slate-100 flex flex-wrap items-center gap-1.5 leading-snug">
        <span className="text-slate-300">This alarm will ring in</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={nextRingInfo.remainingText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
            className={`font-black text-${theme.primary} underline decoration-${theme.primary}/40 underline-offset-4 inline-block`}
          >
            {nextRingInfo.remainingText}
          </motion.span>
        </AnimatePresence>
        <span>.</span>
      </div>

      {/* 4. Date & Time Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-black/30 border border-white/10 text-xs">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Date</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={nextRingInfo.fullDateFormatted}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="font-bold text-slate-100 truncate block"
              >
                📅 {nextRingInfo.fullDateFormatted}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl bg-black/30 border border-white/10 text-xs">
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex flex-col min-w-0 overflow-hidden">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Alarm Time</span>
            <AnimatePresence mode="wait">
              <motion.span
                key={formattedAlarm}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                className="font-bold text-slate-100 truncate block"
              >
                🕖 {formattedAlarm}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
