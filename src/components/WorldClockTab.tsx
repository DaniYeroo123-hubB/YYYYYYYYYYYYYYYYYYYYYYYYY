import React, { useState, useEffect } from 'react';
import { WorldClock, Theme } from '../types';
import { Search, Compass, Plus, Trash2, Sun, Moon, Clock, Globe, MapPin, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import haptics from '../utils/haptics';
import synth from '../utils/synth';
import { useDateTimeSettings } from '../utils/settingsContext';
import { WORLD_CITIES, getDSTDetails } from '../utils/timezoneDb';
import { getSpringTransition, getButtonMotion } from '../utils/motion';

interface WorldClockTabProps {
  clocks: WorldClock[];
  onAddClock: (cityName: string, timezone: string) => void;
  onDeleteClock: (id: string) => void;
  theme: Theme;
}

const getSolidBg = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura': return 'bg-[#030611]';
    case 'cyberpunk': return 'bg-[#09090b]';
    case 'midnight-minimal': return 'bg-[#050505]';
    case 'rose-gold': return 'bg-[#180309]';
    case 'forest-amber': return 'bg-[#02140a]';
    case 'classic-silver': return 'bg-[#0d1321]';
    default: return 'bg-slate-950';
  }
};

const getSolidBorder = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura': return 'border-cyan-500/40';
    case 'cyberpunk': return 'border-yellow-400/40';
    case 'midnight-minimal': return 'border-neutral-800';
    case 'rose-gold': return 'border-rose-500/40';
    case 'forest-amber': return 'border-emerald-500/30';
    case 'classic-silver': return 'border-slate-800';
    default: return 'border-slate-800';
  }
};

const getThemeBorderClass = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura': return 'border-cyan-400 ring-cyan-500/20';
    case 'cyberpunk': return 'border-yellow-400 ring-yellow-400/20';
    case 'midnight-minimal': return 'border-slate-200 ring-slate-200/20';
    case 'rose-gold': return 'border-rose-400 ring-rose-400/20';
    case 'forest-amber': return 'border-emerald-400 ring-emerald-400/20';
    case 'classic-silver': return 'border-slate-300 ring-slate-300/20';
    case 'cosmic-dusk': return 'border-fuchsia-400 ring-fuchsia-400/20';
    case 'aurora-dream': return 'border-emerald-400 ring-emerald-400/20';
    default: return 'border-cyan-400 ring-cyan-400/20';
  }
};

const getThemeBadgeClass = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura': return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30';
    case 'cyberpunk': return 'bg-yellow-950/60 text-yellow-400 border-yellow-500/30';
    case 'midnight-minimal': return 'bg-neutral-900 text-slate-200 border-slate-400/30';
    case 'rose-gold': return 'bg-rose-950/60 text-rose-400 border-rose-500/30';
    case 'forest-amber': return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
    case 'classic-silver': return 'bg-slate-800 text-slate-300 border-slate-600/30';
    case 'cosmic-dusk': return 'bg-fuchsia-950/60 text-fuchsia-400 border-fuchsia-500/30';
    case 'aurora-dream': return 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30';
    default: return 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30';
  }
};

const POPULAR_SUGGESTIONS = [
  { cityName: 'New York', country: 'United States', timezone: 'America/New_York' },
  { cityName: 'London', country: 'United Kingdom', timezone: 'Europe/London' },
  { cityName: 'Tokyo', country: 'Japan', timezone: 'Asia/Tokyo' },
  { cityName: 'Dubai', country: 'United Arab Emirates', timezone: 'Asia/Dubai' },
  { cityName: 'Paris', country: 'France', timezone: 'Europe/Paris' },
  { cityName: 'Sydney', country: 'Australia', timezone: 'Australia/Sydney' },
];

export default function WorldClockTab({
  clocks,
  onAddClock,
  onDeleteClock,
  theme,
}: WorldClockTabProps) {
  const { settings, getAppTime, getFormattedTime, getFormattedDate, getGMTString, activeTimezone, updateSetting } = useDateTimeSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [time, setTime] = useState(getAppTime());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [sortBy, setSortBy] = useState<'pin' | 'name' | 'offset-asc' | 'offset-desc'>('pin');

  const getTimezoneOffsetMinutes = (timezone: string): number => {
    try {
      const tzString = time.toLocaleString('en-US', { timeZone: timezone });
      const utcString = time.toLocaleString('en-US', { timeZone: 'UTC' });
      const tzTime = new Date(tzString).getTime();
      const utcTime = new Date(utcString).getTime();
      return Math.round((tzTime - utcTime) / 60000);
    } catch (e) {
      return 0;
    }
  };

  const sortedClocks = [...clocks].sort((a, b) => {
    // Pin / default city sorting
    if (sortBy === 'pin') {
      if (settings.worldClockDefaultCity === a.timezone) return -1;
      if (settings.worldClockDefaultCity === b.timezone) return 1;
      return 0;
    }

    // Name sorting
    if (sortBy === 'name') {
      return a.cityName.localeCompare(b.cityName);
    }

    // Offset sorting
    if (sortBy === 'offset-asc' || sortBy === 'offset-desc') {
      const offsetA = getTimezoneOffsetMinutes(a.timezone);
      const offsetB = getTimezoneOffsetMinutes(b.timezone);
      if (offsetA !== offsetB) {
        return sortBy === 'offset-asc' ? offsetA - offsetB : offsetB - offsetA;
      }
      return a.cityName.localeCompare(b.cityName);
    }

    return 0;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(getAppTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFocused(false);
        const el = document.getElementById('city-search-input');
        if (el) el.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleAddCity = (city: typeof WORLD_CITIES[0]) => {
    // Avoid duplicates
    if (clocks.some((c) => c.timezone === city.timezone)) {
      haptics.error();
      synth.playErrorSound();
      setErrorMessage(`${city.cityName} is already added!`);
      return;
    }
    haptics.success();
    synth.playSuccessSound();
    onAddClock(city.cityName, city.timezone);
    setSearchQuery('');
  };

  const handleSelectCity = (city: typeof WORLD_CITIES[0]) => {
    handleAddCity(city);
    setIsFocused(false);
    const el = document.getElementById('city-search-input');
    if (el) el.blur();
  };

  const getCityTimeDetails = (timezone: string) => {
    try {
      const formatted = getFormattedTime(time, timezone);
      
      const isNight = (() => {
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          hour12: false,
        });
        const hour = parseInt(formatter.format(time), 10);
        return hour < 6 || hour >= 18;
      })();

      const dateString = getFormattedDate(time, timezone);

      // Calculate time offset
      const localDateString = time.toLocaleString('en-US', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      const targetDateString = time.toLocaleString('en-US', { timeZone: timezone });
      
      const localTimeSec = new Date(localDateString).getTime();
      const targetTimeSec = new Date(targetDateString).getTime();
      const diffMs = targetTimeSec - localTimeSec;
      const diffHrs = Math.round(diffMs / 3600000);

      let offsetLabel = 'Same time';
      if (diffHrs > 0) offsetLabel = `+${diffHrs} hrs ahead`;
      if (diffHrs < 0) offsetLabel = `${diffHrs} hrs behind`;

      const dst = getDSTDetails(timezone, time);

      return {
        timeParts: formatted,
        dateStr: dateString,
        isNight,
        offsetLabel,
        abbreviation: dst.abbreviation,
        hasDST: dst.hasDST,
        isDSTNow: dst.isDSTNow,
      };
    } catch (e) {
      return {
        timeParts: { hrs: '00', mins: '00', secs: '00', ampm: '' },
        dateStr: 'Unknown Date',
        isNight: false,
        offsetLabel: 'Unknown offset',
        abbreviation: 'GMT',
        hasDST: false,
        isDSTNow: false,
      };
    }
  };

  // Filter available cities based on search
  const filteredCities = WORLD_CITIES.filter((city) => {
    const isAlreadyAdded = clocks.some((c) => c.timezone === city.timezone);
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      city.cityName.toLowerCase().includes(query) ||
      city.country.toLowerCase().includes(query) ||
      city.timezone.toLowerCase().includes(query);
    return matchesSearch && !isAlreadyAdded;
  });

  const suggestedCities = POPULAR_SUGGESTIONS.filter(
    city => !clocks.some(c => c.timezone === city.timezone)
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6" id="world-clock-tab-wrapper">
      {/* Search Header Panel */}
      <div className={`relative z-50 p-5 rounded-2xl ${theme.cardBg} border ${theme.border} space-y-4`} id="world-clock-header">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Compass className={`w-5 h-5 text-${theme.primary}`} /> Global Time Zones
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Add cities below to monitor real-time business offsets and timezones worldwide.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center" id="world-clock-sorting-controls">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => {
                if (settings.clickSoundsEnabled) synth.playClick();
                if (settings.hapticsEnabled) haptics.light();
                setSortBy(e.target.value as any);
              }}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-300 font-semibold py-1.5 px-3 rounded-lg focus:outline-none focus:border-cyan-500 cursor-pointer"
              id="world-clock-sort-select"
            >
              <option value="pin">Default / Pinned First</option>
              <option value="name">City Name (A-Z)</option>
              <option value="offset-asc">Time Offset (West to East)</option>
              <option value="offset-desc">Time Offset (East to West)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative z-[100]" id="city-search-container">
          {/* Backdrop Overlay for Search Focus */}
          <AnimatePresence>
            {(isFocused || searchQuery) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.65 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 bg-black z-[90] cursor-default pointer-events-auto"
                onClick={() => {
                  setIsFocused(false);
                  const el = document.getElementById('city-search-input');
                  if (el) el.blur();
                }}
              />
            )}
          </AnimatePresence>

          <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-slate-500 z-[101]" />
          <input
            type="text"
            id="city-search-input"
            value={searchQuery}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search & add major cities (e.g. New York, Tokyo, Dubai...)"
            className={`w-full py-3 pl-11 pr-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-medium text-white focus:outline-none focus:border-${theme.primary} placeholder-slate-500 relative z-[101] transition-all duration-300 ${
              isFocused || searchQuery ? 'ring-2 ring-cyan-500/10 border-cyan-500/40 shadow-lg' : ''
            }`}
          />

          {/* Autocomplete dropdown list */}
          <AnimatePresence>
            {(searchQuery || isFocused) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 15 }}
                transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                className={`absolute left-0 right-0 mt-2 p-1.5 rounded-2xl ${getSolidBg(theme.id)} border-2 ${getSolidBorder(theme.id)} shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] z-[100] max-h-96 overflow-y-auto flex flex-col gap-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-700`}
                id="search-results-dropdown"
              >
                {searchQuery ? (
                  /* Search Results Mode */
                  <>
                    <div className="flex items-center justify-between px-3.5 py-2.5 text-[10px] font-bold text-slate-400 tracking-widest uppercase select-none border-b border-slate-900/40">
                      <div className="flex items-center gap-1.5">
                        <Search className={`w-3.5 h-3.5 text-${theme.primary}`} /> 
                        <span>Search Results</span>
                      </div>
                      <span className="text-[9px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800/80 text-slate-500">
                        {filteredCities.length} found
                      </span>
                    </div>

                    {filteredCities.length === 0 ? (
                      <div className="py-8 px-4 text-center">
                        <MapPin className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold text-slate-400">No matching cities found</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Try searching for a different global city or check spelling.</p>
                      </div>
                    ) : (
                      filteredCities.map((city, idx) => {
                        const gmtStr = getGMTString(city.timezone);
                        return (
                          <motion.button
                            key={`${city.cityName}-${city.timezone}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                            onClick={() => handleSelectCity(city)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900/80 text-left text-xs font-semibold text-slate-300 hover:text-white transition-all group cursor-pointer border border-transparent hover:border-slate-800/60"
                            id={`search-item-${city.cityName}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 group-hover:bg-slate-950 transition-all">
                                <Globe className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white text-sm font-bold tracking-tight leading-snug">{city.cityName}</span>
                                <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
                                  {city.country} • {city.timezone}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80 group-hover:text-slate-400">
                                {gmtStr}
                              </span>
                              <span className="flex items-center gap-1 text-slate-400 group-hover:text-white font-bold text-[10px] uppercase tracking-wider bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 group-hover:border-slate-700 group-active:scale-95 transition-all">
                                <Plus className="w-3.5 h-3.5 stroke-[2.5px]" /> Add
                              </span>
                            </div>
                          </motion.button>
                        );
                      })
                    )}
                  </>
                ) : (
                  /* Suggestions Mode */
                  <>
                    <div className="flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-bold text-slate-400 tracking-widest uppercase select-none border-b border-slate-900/40">
                      <Compass className={`w-3.5 h-3.5 text-${theme.primary}`} /> 
                      <span>Recommended Global Hubs</span>
                    </div>

                    {suggestedCities.length === 0 ? (
                      <div className="py-6 px-4 text-center text-[10px] text-slate-500 font-medium">
                        All recommended cities have been added! Type to find more.
                      </div>
                    ) : (
                      suggestedCities.map((city, idx) => {
                        const gmtStr = getGMTString(city.timezone);
                        return (
                          <motion.button
                            key={`${city.cityName}-${city.timezone}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.02 }}
                            onClick={() => handleSelectCity(city)}
                            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900/80 text-left text-xs font-semibold text-slate-300 hover:text-white transition-all group cursor-pointer border border-transparent hover:border-slate-800/60"
                            id={`suggest-item-${city.cityName}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-slate-700 group-hover:bg-slate-950 transition-all">
                                <Globe className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-white text-sm font-bold tracking-tight leading-snug">{city.cityName}</span>
                                <span className="text-[10px] text-slate-500 font-medium group-hover:text-slate-400 transition-colors">
                                  {city.country} • {city.timezone}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80 group-hover:text-slate-400">
                                {gmtStr}
                              </span>
                              <span className="flex items-center gap-1 text-slate-400 group-hover:text-white font-bold text-[10px] uppercase tracking-wider bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800 group-hover:border-slate-700 group-active:scale-95 transition-all">
                                <Plus className="w-3.5 h-3.5 stroke-[2.5px]" /> Add
                              </span>
                            </div>
                          </motion.button>
                        );
                      })
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* World Clock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="world-clocks-grid">
        {clocks.length === 0 ? (
          <div className={`col-span-full p-10 text-center rounded-2xl ${theme.cardBg} border ${theme.border} space-y-3`} id="empty-clocks-view">
            <div className="w-12 h-12 bg-slate-950 border border-slate-800/80 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Compass className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No world clocks added</p>
              <p className="text-xs text-slate-500 mt-0.5">Use the search bar above to monitor global cities.</p>
            </div>
          </div>
        ) : (
          sortedClocks.map((clock) => {
            const details = getCityTimeDetails(clock.timezone);
            const isActive = activeTimezone === clock.timezone;
            const isPinned = settings.worldClockDefaultCity === clock.timezone;
            return (
              <motion.div
                key={clock.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={
                  settings.animationIntensity === 'minimal' ? { scale: 1.005 } :
                  settings.animationIntensity === 'balanced' ? { scale: 1.012, y: -2 } :
                  settings.animationIntensity === 'supreme' ? { scale: 1.022, y: -4, border: `1px solid var(--color-cyan-500, rgba(6, 182, 212, 0.35))`, boxShadow: "0 15px 30px -10px rgba(0,0,0,0.5)" } :
                  { scale: 1.03, y: -6, border: `1px solid var(--color-cyan-500, rgba(6, 182, 212, 0.45))`, boxShadow: "0 25px 45px -12px rgba(0,0,0,0.6)" }
                }
                transition={getSpringTransition(settings.animationIntensity)}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  haptics.success();
                  synth.playSuccessSound();
                  updateSetting('isAutoTimezone', false);
                  updateSetting('manualTimezone', clock.timezone);
                }}
                className={`p-5 rounded-xl border relative overflow-hidden group cursor-pointer ${
                  isActive
                    ? `${getThemeBorderClass(theme.id)} border-2 ring bg-slate-900/95 shadow-lg`
                    : details.isNight
                    ? 'bg-slate-950/90 border-slate-900/60 shadow-[inset_0_0_12px_rgba(255,255,255,0.02)]'
                    : 'bg-slate-900/40 border-slate-800/60'
                }`}
                id={`clock-card-${clock.id}`}
                title={`Click to set entire app system timezone to ${clock.cityName}`}
              >
                {/* Decorative background sun/moon glow */}
                <div className="absolute right-0 top-0 w-24 h-24 rounded-full filter blur-2xl opacity-15 pointer-events-none transform translate-x-4 -translate-y-4"
                     style={{
                       backgroundColor: details.isNight ? '#3b82f6' : '#f59e0b'
                     }}
                 />

                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                      {clock.cityName}
                      {details.isNight ? (
                        <Moon className="w-3.5 h-3.5 text-blue-400 fill-blue-900/20" />
                      ) : (
                        <Sun className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                      )}
                      {isActive && (
                        <span className={`flex items-center gap-1 text-[8px] font-black uppercase border px-1.5 py-0.5 rounded ml-1 animate-pulse ${getThemeBadgeClass(theme.id)}`}>
                          ● System Active
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">
                      {clock.timezone.split('/')[0]} / {clock.timezone.split('/')[1]?.replace('_', ' ')} • {details.abbreviation} {details.hasDST ? (details.isDSTNow ? '• DST' : '• Std') : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Favorite / Pin Button */}
                    <button
                      onClick={() => {
                        haptics.medium();
                        synth.playClick();
                        updateSetting('worldClockDefaultCity', isPinned ? '' : clock.timezone);
                      }}
                      className={`p-1.5 rounded bg-slate-950 border transition-all ${
                        isPinned
                          ? 'text-yellow-400 border-yellow-500/40 bg-yellow-950/20 shadow-[0_0_8px_rgba(234,179,8,0.25)] scale-110'
                          : 'text-slate-500 border-slate-900/50 hover:text-yellow-400 hover:border-yellow-950/40 opacity-0 group-hover:opacity-100 focus:opacity-100'
                      }`}
                      title={isPinned ? "Unpin default city" : "Pin as default city"}
                      id={`pin-clock-btn-${clock.cityName}`}
                    >
                      <Star className={`w-3.5 h-3.5 ${isPinned ? 'fill-yellow-400' : ''}`} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => {
                        haptics.heavy();
                        synth.playDelete();
                        onDeleteClock(clock.id);
                      }}
                      className="p-1.5 rounded bg-slate-950 border border-slate-900/50 text-slate-500 hover:text-red-400 hover:border-red-950/40 hover:bg-red-950/20 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title={`Delete ${clock.cityName}`}
                      id={`delete-clock-btn-${clock.cityName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-5 flex justify-between items-end">
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black font-mono tracking-tight text-white glow-text">
                        {details.timeParts.hrs}:{details.timeParts.mins}
                      </span>
                      {settings.showSeconds && details.timeParts.secs && (
                        <span className="text-lg font-bold font-mono text-slate-500">
                          :{details.timeParts.secs}
                        </span>
                      )}
                      {settings.timeFormat === '12h' && details.timeParts.ampm && (
                        <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 border border-cyan-900/15 rounded ml-1 uppercase">
                          {details.timeParts.ampm}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-slate-400">
                      {details.dateStr}
                    </p>
                  </div>

                  <span className={`text-[10px] font-bold py-1 px-2 rounded-lg ${
                    details.offsetLabel === 'Same time'
                      ? 'bg-slate-950 border border-slate-900 text-slate-400'
                      : 'bg-cyan-950/30 border border-cyan-900/30 text-cyan-400'
                  }`}>
                    {details.offsetLabel}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Toast Notification Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[10000] pointer-events-none"
            id="world-clock-error-toast"
          >
            <div className="bg-slate-900/95 border border-amber-500/50 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md pointer-events-auto">
              <div className="p-1.5 rounded-lg bg-amber-950/50 border border-amber-500/30 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-amber-400">Duplicate Clock</p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
