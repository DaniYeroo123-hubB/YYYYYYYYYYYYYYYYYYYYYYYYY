export interface WakeUpVoiceConfig {
  enabled: boolean;
  source: 'tts' | 'upload' | 'record';
  ttsVoiceURI?: string;
  ttsLanguage?: string;
  ttsMessage?: string;
  voiceVolumeMode?: 'same' | 'lower' | 'higher' | 'custom';
  voiceCustomVolume?: number; // 0 to 100
  playbackMode?: 'alarm-only' | 'voice-only' | 'alarm-then-voice' | 'voice-then-alarm';
  audioDataUrl?: string; // For upload or record audio files (Base64/Blob URL)
  audioTrimStart?: number; // in seconds
  audioTrimEnd?: number; // in seconds
  audioDuration?: number; // full duration in seconds
  audioName?: string; // original uploaded filename or recorded date
  audioCreatedDate?: string;
}

export interface Alarm {
  id: string;
  time: string; // "HH:MM"
  label: string;
  enabled: boolean;
  repeatDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  soundId?: string; // id of the alarm sound
  soundVolume?: number; // 0 to 100
  gradualUp?: boolean; // gradual volume increase
  vibrationPattern?: string; // haptic vibration profile ID
  customDataUrl?: string; // Base64 or Blob URL for custom audio file
  snoozeEnabled?: boolean; // snooze configuration status
  wakeUpVoice?: WakeUpVoiceConfig;
  bedtimeReminderMode?: 'global' | 'custom' | 'disabled';
  bedtimeSleepGoalHours?: number;
}

export interface WorldClock {
  id: string;
  cityName: string;
  timezone: string; // e.g. "America/New_York"
}

export type ThemeId = 'neon-aura' | 'cyberpunk' | 'midnight-minimal' | 'rose-gold' | 'forest-amber' | 'classic-silver' | 'cosmic-dusk' | 'aurora-dream' | 'sunset-velvet';

export interface Theme {
  id: ThemeId;
  name: string;
  primary: string; // Tailwind color classes
  secondary: string;
  bg: string;
  cardBg: string;
  text: string;
  border: string;
  glow: string;
  gradient: string;
  surface?: string;
  surfaceAlt?: string;
  overlay?: string;
  muted?: string;
  input?: string;
  chip?: string;
  hero?: string;
  shadow?: string;
  accent?: string;
}

export interface Lap {
  lapNumber: number;
  lapTime: number; // in ms
  splitTime: number; // in ms
  isBest?: boolean;
  isWorst?: boolean;
}
