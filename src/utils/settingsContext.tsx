import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import haptics from './haptics';
import synth from './synth';

import { SmartNotificationsConfig } from './smartNotifications';

export interface AppSettings {
  isAutoTime: boolean;
  manualTimeOffset: number; // Offset in milliseconds from system time
  isAutoTimezone: boolean;
  manualTimezone: string;
  isLocationTimezone: boolean;
  timeFormat: '12h' | '24h';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD' | 'DD Month YYYY';
  firstDayOfWeek: 'Monday' | 'Sunday' | 'Saturday';
  showSeconds: boolean;
  timezoneDisplay: 'time-only' | 'time-name' | 'time-gmt';
  worldClockDefaultCity: string; // Timezone ID or city name
  lastSyncTime: string;
  syncStatus: 'synced' | 'manual' | 'gps-synced' | 'error' | 'permission-denied';
  // Sound Settings
  interfaceSoundsEnabled: boolean;
  toggleSoundsEnabled: boolean;
  clickSoundsEnabled: boolean;
  themeChangeSoundsEnabled: boolean;
  alarmConfigSoundsEnabled: boolean;
  stopwatchSoundsEnabled: boolean;
  timerSoundsEnabled: boolean;
  achievementSoundsEnabled: boolean;
  hapticsEnabled: boolean;
  // Animation Settings
  animationsEnabled: boolean;
  animationIntensity: 'minimal' | 'balanced' | 'supreme' | 'cinematic';
  // Locale Settings
  language: string;
  region: string;
  // Bedtime Reminder Settings
  bedtimeReminderEnabled: boolean;
  bedtimeSleepGoalHours: number; // Default: 8
  // Sleep Timer Settings
  sleepTimerNotificationsEnabled: boolean;
  sleepTimerCompletionNotificationEnabled: boolean;
  sleepTimerFadeOutEnabled: boolean;
  sleepTimerFadeDuration: number; // in seconds
  sleepTimerDefaultDuration: number; // in minutes
  sleepTimerRememberLastDuration: boolean;
  sleepTimerAutoOpenLastUsed: boolean;
  // Smart Notifications Settings
  smartNotifications: SmartNotificationsConfig;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  getAppTime: () => Date;
  activeTimezone: string;
  getFormattedTime: (date?: Date, tz?: string) => { hrs: string; mins: string; secs: string; ampm: string };
  getFormattedDate: (date?: Date, tz?: string) => string;
  getFormattedShortDate: (date?: Date, tz?: string) => string;
  refreshLocationTimezone: () => Promise<boolean>;
  getGMTString: (tz: string) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

import { ALL_IANA_TIMEZONES } from './timezoneDb';

// Major cities across the world with GPS coordinates for proximity-based timezone search
export const GPS_CITIES = [
  { lat: 40.7128, lng: -74.0060, timezone: 'America/New_York', name: 'New York' },
  { lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles', name: 'Los Angeles' },
  { lat: 41.8781, lng: -87.6298, timezone: 'America/Chicago', name: 'Chicago' },
  { lat: 39.7392, lng: -104.9903, timezone: 'America/Denver', name: 'Denver' },
  { lat: 51.5074, lng: -0.1278, timezone: 'Europe/London', name: 'London' },
  { lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris', name: 'Paris' },
  { lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo', name: 'Tokyo' },
  { lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney', name: 'Sydney' },
  { lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai', name: 'Dubai' },
  { lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore', name: 'Singapore' },
  { lat: 30.0444, lng: 31.2357, timezone: 'Africa/Cairo', name: 'Cairo' },
  { lat: 55.7558, lng: 37.6173, timezone: 'Europe/Moscow', name: 'Moscow' },
  { lat: 28.6139, lng: 77.2090, timezone: 'Asia/Kolkata', name: 'New Delhi' },
  { lat: 31.2304, lng: 121.4737, timezone: 'Asia/Shanghai', name: 'Shanghai' },
  { lat: -23.5505,  lng: -46.6333, timezone: 'America/Sao_Paulo', name: 'São Paulo' },
  { lat: -26.2041, lng: 28.0473, timezone: 'Africa/Johannesburg', name: 'Johannesburg' },
  { lat: 21.3069, lng: -157.8583, timezone: 'Pacific/Honolulu', name: 'Honolulu' },
  { lat: 61.2181, lng: -149.9003, timezone: 'America/Anchorage', name: 'Anchorage' },
  { lat: -36.8485, lng: 174.7633, timezone: 'Pacific/Auckland', name: 'Auckland' },
  { lat: -31.9505, lng: 115.8605, timezone: 'Australia/Perth', name: 'Perth' },
  { lat: 13.7563, lng: 100.5018, timezone: 'Asia/Bangkok', name: 'Bangkok' },
  { lat: 22.3193, lng: 114.1694, timezone: 'Asia/Hong_Kong', name: 'Hong Kong' },
  { lat: -34.6037, lng: -58.3816, timezone: 'America/Argentina/Buenos_Aires', name: 'Buenos Aires' },
  { lat: 6.5244, lng: 3.3792, timezone: 'Africa/Lagos', name: 'Lagos' },
  { lat: -1.2921, lng: 36.8219, timezone: 'Africa/Nairobi', name: 'Nairobi' },
  { lat: 24.8607, lng: 67.0011, timezone: 'Asia/Karachi', name: 'Karachi' },
  { lat: 24.7136, lng: 46.6753, timezone: 'Asia/Riyadh', name: 'Riyadh' },
  { lat: 41.0082,  lng: 28.9784, timezone: 'Europe/Istanbul', name: 'Istanbul' },
  { lat: 37.9838, lng: 23.7275, timezone: 'Europe/Athens', name: 'Athens' },
  { lat: 52.5200, lng: 13.4050, timezone: 'Europe/Berlin', name: 'Berlin' },
  { lat: 19.4326, lng: -99.1332, timezone: 'America/Mexico_City', name: 'Mexico City' },
  { lat: 49.2827, lng: -123.1207, timezone: 'America/Vancouver', name: 'Vancouver' },
  { lat: 33.4484, lng: -112.0740, timezone: 'America/Phoenix', name: 'Phoenix' },
  { lat: 37.5665, lng: 126.9780, timezone: 'Asia/Seoul', name: 'Seoul' },
  { lat: 23.8103, lng: 90.4125, timezone: 'Asia/Dhaka', name: 'Dhaka' },
  { lat: -6.2088, lng: 106.8456, timezone: 'Asia/Jakarta', name: 'Jakarta' },
  { lat: 14.5995,  lng: 120.9842, timezone: 'Asia/Manila', name: 'Manila' },
  { lat: 35.6892, lng: 51.3890, timezone: 'Asia/Tehran', name: 'Tehran' },
  { lat: 33.3152, lng: 44.3661, timezone: 'Asia/Baghdad', name: 'Baghdad' },
  { lat: -12.0464, lng: -77.0428, timezone: 'America/Lima', name: 'Lima' },
  { lat: 4.7110, lng: -74.0721, timezone: 'America/Bogota', name: 'Bogota' },
  { lat: -33.4489, lng: -70.6693, timezone: 'America/Santiago', name: 'Santiago' },
  { lat: 10.4806, lng: -66.9036, timezone: 'America/Caracas', name: 'Caracas' },
  { lat: 33.5731, lng: -7.5898, timezone: 'Africa/Casablanca', name: 'Casablanca' },
  { lat: 38.7223, lng: -9.1393, timezone: 'Europe/Lisbon', name: 'Lisbon' },
  { lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid', name: 'Madrid' },
  { lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome', name: 'Rome' },
  { lat: 50.4501, lng: 30.5234, timezone: 'Europe/Kiev', name: 'Kiev' },
  { lat: -18.8792, lng: 47.5079, timezone: 'Indian/Antananarivo', name: 'Antananarivo' },
  { lat: -27.4705, lng: 153.0260, timezone: 'Australia/Brisbane', name: 'Brisbane' },
  { lat: -34.9285,  lng: 138.6007, timezone: 'Australia/Adelaide', name: 'Adelaide' },
  { lat: -37.8136, lng: 144.9631, timezone: 'Australia/Melbourne', name: 'Melbourne' },
];

export const ALL_TIMEZONES = ALL_IANA_TIMEZONES;

// Haversine distance formula to find closest coordinates
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const DEFAULT_SETTINGS: AppSettings = {
  isAutoTime: true,
  manualTimeOffset: 0,
  isAutoTimezone: true,
  manualTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
  isLocationTimezone: false,
  timeFormat: '12h',
  dateFormat: 'MM/DD/YYYY',
  firstDayOfWeek: 'Sunday',
  showSeconds: true,
  timezoneDisplay: 'time-name',
  worldClockDefaultCity: '',
  lastSyncTime: new Date().toISOString(),
  syncStatus: 'synced',
  // Sound Settings
  interfaceSoundsEnabled: true,
  toggleSoundsEnabled: true,
  clickSoundsEnabled: true,
  themeChangeSoundsEnabled: true,
  alarmConfigSoundsEnabled: true,
  stopwatchSoundsEnabled: true,
  timerSoundsEnabled: true,
  achievementSoundsEnabled: true,
  hapticsEnabled: true,
  // Animation Settings
  animationsEnabled: true,
  animationIntensity: 'supreme',
  // Locale Settings
  language: 'en',
  region: 'US',
  // Bedtime Reminder Settings
  bedtimeReminderEnabled: true,
  bedtimeSleepGoalHours: 8,
  // Sleep Timer Settings
  sleepTimerNotificationsEnabled: true,
  sleepTimerCompletionNotificationEnabled: true,
  sleepTimerFadeOutEnabled: true,
  sleepTimerFadeDuration: 5,
  sleepTimerDefaultDuration: 30,
  sleepTimerRememberLastDuration: true,
  sleepTimerAutoOpenLastUsed: false,
  // Smart Notifications Settings
  smartNotifications: {
    enabled: true,
    noAlarmTomorrow: true,
    longRunningTimer: true,
    silentModeReminder: true,
    systemNotificationsEnabled: true,
    noAlarmTomorrowSound: true,
    longRunningTimerSound: true,
    silentModeReminderSound: true,
    muteAllNotifications: false,
  },
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const isUpdatingLocation = useRef(false);

  // Load settings from storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dy_clock_dateTimeSettings');
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        
        // Sync singletons on load
        haptics.setHapticsEnabled(merged.hapticsEnabled);
        synth.setInterfaceSoundsEnabled(merged.interfaceSoundsEnabled);
      } else {
        // Initialize default city if empty
        const deviceTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const initial = {
          ...DEFAULT_SETTINGS,
          manualTimezone: deviceTZ || 'America/New_York',
        };
        setSettings(initial);
        localStorage.setItem('dy_clock_dateTimeSettings', JSON.stringify(initial));
        
        // Sync singletons on load
        haptics.setHapticsEnabled(initial.hapticsEnabled);
        synth.setInterfaceSoundsEnabled(initial.interfaceSoundsEnabled);
      }
    } catch (e) {
      console.warn('Failed to load datetime settings', e);
    }
  }, []);

  // Save settings helper
  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem('dy_clock_dateTimeSettings', JSON.stringify(updated));
      
      // Sync singletons on setting update
      if (key === 'hapticsEnabled') {
        haptics.setHapticsEnabled(value as boolean);
      } else if (key === 'interfaceSoundsEnabled') {
        synth.setInterfaceSoundsEnabled(value as boolean);
      }
      
      return updated;
    });
  };

  // Compute application current time with offset
  const getAppTime = (): Date => {
    const sysTime = new Date();
    if (settings.isAutoTime) {
      return sysTime;
    }
    return new Date(sysTime.getTime() + settings.manualTimeOffset);
  };

  // Determine active timezone
  const activeTimezone = (() => {
    if (settings.isAutoTimezone && !settings.isLocationTimezone) {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
    }
    return settings.manualTimezone;
  })();

  // Retrieve GMT Long Offset String dynamically
  const getGMTString = (tz: string): string => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'longOffset',
      });
      const parts = formatter.formatToParts(new Date());
      const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value;
      return offsetPart || 'GMT+00:00';
    } catch (e) {
      return 'GMT+00:00';
    }
  };

  // Format Time according to user settings
  const getFormattedTime = (date?: Date, tz?: string) => {
    const targetDate = date || getAppTime();
    const targetTZ = tz || activeTimezone;

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTZ,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(targetDate);
      let hrsVal = parts.find(p => p.type === 'hour')?.value || '12';
      const minsVal = parts.find(p => p.type === 'minute')?.value || '00';
      const secsVal = parts.find(p => p.type === 'second')?.value || '00';

      let ampmVal = '';
      if (settings.timeFormat === '12h') {
        let hrsInt = parseInt(hrsVal, 10);
        ampmVal = hrsInt >= 12 ? 'PM' : 'AM';
        hrsInt = hrsInt % 12;
        if (hrsInt === 0) hrsInt = 12;
        hrsVal = hrsInt.toString().padStart(2, '0');
      }

      return {
        hrs: hrsVal,
        mins: minsVal,
        secs: settings.showSeconds ? secsVal : '',
        ampm: ampmVal,
      };
    } catch (e) {
      console.error('Time formatting error', e);
      return { hrs: '12', mins: '00', secs: '00', ampm: 'AM' };
    }
  };

  // Format Date according to user settings
  const getFormattedDate = (date?: Date, tz?: string): string => {
    const targetDate = date || getAppTime();
    const targetTZ = tz || activeTimezone;

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTZ,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(targetDate);
      const year = parts.find(p => p.type === 'year')?.value || '';
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';

      const fullMonths = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const monthName = fullMonths[monthIndex] || '';

      const dayPad = day.padStart(2, '0');
      const monthPad = month.padStart(2, '0');

      switch (settings.dateFormat) {
        case 'DD/MM/YYYY':
          return `${dayPad}/${monthPad}/${year}`;
        case 'MM/DD/YYYY':
          return `${monthPad}/${dayPad}/${year}`;
        case 'YYYY/MM/DD':
          return `${year}/${monthPad}/${dayPad}`;
        case 'DD Month YYYY':
          return `${day} ${monthName} ${year}`;
        default:
          return `${monthPad}/${dayPad}/${year}`;
      }
    } catch (e) {
      return targetDate.toLocaleDateString();
    }
  };

  // Format Short Date according to user settings (for mobile headers/compact views)
  const getFormattedShortDate = (date?: Date, tz?: string): string => {
    const targetDate = date || getAppTime();
    const targetTZ = tz || activeTimezone;

    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: targetTZ,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = formatter.formatToParts(targetDate);
      const month = parts.find(p => p.type === 'month')?.value || '';
      const day = parts.find(p => p.type === 'day')?.value || '';

      const shortMonths = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      const monthIndex = parseInt(month, 10) - 1;
      const shortMonthName = shortMonths[monthIndex] || '';

      const dayPad = day.padStart(2, '0');
      const monthPad = month.padStart(2, '0');

      switch (settings.dateFormat) {
        case 'DD/MM/YYYY':
          return `${dayPad}/${monthPad}`;
        case 'MM/DD/YYYY':
          return `${monthPad}/${dayPad}`;
        case 'YYYY/MM/DD':
          return `${monthPad}/${dayPad}`;
        case 'DD Month YYYY':
          return `${day} ${shortMonthName}`;
        default:
          return `${shortMonthName} ${day}`;
      }
    } catch (e) {
      return targetDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
  };

  // Geolocate nearest timezone
  const refreshLocationTimezone = async (): Promise<boolean> => {
    if (isUpdatingLocation.current) return false;
    isUpdatingLocation.current = true;

    return new Promise<boolean>((resolve) => {
      if (!navigator.geolocation) {
        updateSetting('syncStatus', 'permission-denied');
        isUpdatingLocation.current = false;
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Find nearest curated city
          let nearestCity = GPS_CITIES[0];
          let minDistance = Infinity;

          for (const city of GPS_CITIES) {
            const dist = getDistance(latitude, longitude, city.lat, city.lng);
            if (dist < minDistance) {
              minDistance = dist;
              nearestCity = city;
            }
          }

          // Update settings with this timezone
          updateSetting('manualTimezone', nearestCity.timezone);
          updateSetting('syncStatus', 'gps-synced');
          updateSetting('lastSyncTime', new Date().toISOString());
          isUpdatingLocation.current = false;
          resolve(true);
        },
        (error) => {
          console.warn('Geolocation failed', error);
          updateSetting('syncStatus', 'permission-denied');
          isUpdatingLocation.current = false;
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  // Monitor Geolocation background interval when enabled
  useEffect(() => {
    if (settings.isLocationTimezone) {
      refreshLocationTimezone();
      
      const interval = setInterval(() => {
        refreshLocationTimezone();
      }, 5 * 60 * 1000); // 5 minutes refresh
      
      return () => clearInterval(interval);
    }
  }, [settings.isLocationTimezone]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        getAppTime,
        activeTimezone,
        getFormattedTime,
        getFormattedDate,
        getFormattedShortDate,
        refreshLocationTimezone,
        getGMTString,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useDateTimeSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useDateTimeSettings must be used within a SettingsProvider');
  }
  return context;
};
