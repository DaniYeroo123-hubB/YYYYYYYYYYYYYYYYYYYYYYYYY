import React, { useState, useEffect } from 'react';
import { Theme } from '../types';
import { Moon, Sun, ArrowLeft, VolumeX, Volume2, Shield } from 'lucide-react';
import haptics from '../utils/haptics';
import synth from '../utils/synth';
import { useDateTimeSettings } from '../utils/settingsContext';

interface BedsideModeProps {
  onClose: () => void;
  theme: Theme;
  activeAlarmsCount: number;
}

export default function BedsideMode({
  onClose,
  theme,
  activeAlarmsCount,
}: BedsideModeProps) {
  const { getAppTime, getFormattedTime, getFormattedDate, settings } = useDateTimeSettings();
  const [time, setTime] = useState(getAppTime());
  const [muted, setMuted] = useState(false);
  const [brightness, setBrightness] = useState<number>(30); // Dim by default for nightstands

  useEffect(() => {
    localStorage.setItem('dy_bedside_entered_at', new Date().toISOString());
    const timer = setInterval(() => {
      setTime(getAppTime());
    }, 1000);
    return () => {
      clearInterval(timer);
      localStorage.removeItem('dy_bedside_entered_at');
    };
  }, []);

  const digital = getFormattedTime(time);
  const formattedDate = getFormattedDate(time);

  const handleClose = () => {
    haptics.heavy();
    synth.playDismiss();
    onClose();
  };

  const handleMuteToggle = () => {
    haptics.medium();
    synth.playSwitch(!muted);
    setMuted(!muted);
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    haptics.tick();
    synth.playSlider();
    setBrightness(parseInt(e.target.value));
  };

  return (
    <div
      style={{ opacity: brightness / 100 }}
      className="fixed inset-0 bg-black text-slate-100 flex flex-col justify-between p-8 select-none z-[90] transition-opacity duration-500 ease-out cursor-none"
      onClick={handleClose}
      id="bedside-mode-viewport"
    >
      {/* Top control bar (hidden on mouse inactivity / touch, clickable to exit or mute) */}
      <div 
        className="flex justify-between items-center w-full z-20 pointer-events-auto"
        onClick={(e) => e.stopPropagation()} // Stop propagation from closing the screen
        id="bedside-top-bar"
      >
        <button
          onClick={handleClose}
          className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-400 hover:text-white transition-all cursor-pointer"
          id="bedside-exit-btn"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Bedside
        </button>
 
        <div className="flex items-center gap-4" id="bedside-top-controls">
          {/* Brightness slider */}
          <div className="flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-neutral-500" />
            <input
              type="range"
              min="10"
              max="100"
              value={brightness}
              onChange={handleBrightnessChange}
              className="w-18 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              title="Screen Brightness"
              id="bedside-brightness-slider"
            />
            <Sun className="w-3.5 h-3.5 text-neutral-400" />
          </div>
 
          {/* Muted toggle */}
          <button
            onClick={handleMuteToggle}
            className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
            id="bedside-mute-toggle"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>
        </div>
      </div>


      {/* Main Massive Clock Face */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6" id="bedside-clock-digits-container">
        {/* Dynamic moving dim-glowing background blur */}
        <div className={`absolute w-96 h-96 rounded-full bg-${theme.primary}/5 filter blur-3xl pointer-events-none`} />

        {/* Huge glowing numbers */}
        <div className="flex items-baseline font-mono select-none" id="bedside-huge-digits">
          <span className={`text-[15vw] leading-none font-extrabold tracking-tighter text-slate-100 glow-dim filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
            {digital.hrs}
          </span>
          <span className="text-[12vw] leading-none font-bold text-neutral-700 mx-2 animate-pulse">:</span>
          <span className="text-[15vw] leading-none font-extrabold tracking-tighter text-neutral-300">
            {digital.mins}
          </span>
          {settings.showSeconds && digital.secs && (
            <span className={`text-[6vw] font-semibold text-neutral-500 ml-4 font-mono tracking-tighter self-end mb-[2vw]`}>
              {digital.secs}
            </span>
          )}
          {settings.timeFormat === '12h' && digital.ampm && (
            <span className="text-[3vw] font-black text-purple-400 ml-4 self-end mb-[2vw] bg-purple-950/20 px-2.5 py-0.5 border border-purple-900/10 rounded-lg">
              {digital.ampm}
            </span>
          )}
        </div>

        {/* Date representation */}
        <p className="text-sm sm:text-base font-semibold text-neutral-400 tracking-wide text-center">
          {formattedDate}
        </p>
      </div>

      {/* Footer Status Indicators */}
      <div 
        className="w-full flex justify-between items-center text-xs text-neutral-500 font-semibold"
        id="bedside-footer"
      >
        <span className="flex items-center gap-1.5 uppercase tracking-widest text-[10px]">
          <Shield className="w-3.5 h-3.5 text-cyan-500/60" /> Sleep Mode Active
        </span>

        {activeAlarmsCount > 0 ? (
          <span className="text-right text-emerald-500 bg-emerald-950/20 py-1 px-2.5 rounded-lg border border-emerald-900/20">
            Alarm set for tomorrow ({activeAlarmsCount} active)
          </span>
        ) : (
          <span className="text-right text-neutral-600">
            No alarms set
          </span>
        )}
      </div>
    </div>
  );
}
