import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Alarm, Theme } from '../types';
import { 
  Plus, Trash2, Bell, Volume, Volume1, Volume2, Search, Heart, Music, 
  Upload, Sparkles, Check, Play, Square, ChevronDown, 
  Tag, VolumeX, SlidersHorizontal, Clock, Edit2, ShieldAlert,
  Sun, Flame, Trees, BellRing, CloudRain, Waves, Star, History, FolderOpen,
  Moon, Info, Settings, Mic, Languages, FileAudio, Scissors, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import haptics from '../utils/haptics';
import { useDateTimeSettings } from '../utils/settingsContext';
import { BUILTIN_SOUNDS, synth } from '../utils/synth';
import { getSpringTransition, getButtonMotion, getStaggerContainerVariants, getStaggerItemVariants } from '../utils/motion';
import AlarmTimePicker from './AlarmTimePicker';
import NextRingPreviewCard from './NextRingPreviewCard';
import { formatAlarmTime } from '../utils/alarmUtils';

const getOpaqueBgColor = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura':
      return '#020617'; // Solid slate-950
    case 'cyberpunk':
      return '#09090b'; // Solid zinc-950
    case 'midnight-minimal':
      return '#0a0a0a'; // Solid neutral-950
    case 'rose-gold':
      return '#1c050e'; // Solid rose-950
    case 'forest-amber':
      return '#022c16'; // Solid emerald-950
    case 'classic-silver':
      return '#0f172a'; // Solid slate-900
    default:
      return '#020617';
  }
};

const getOpaqueCardBgColor = (themeId: string) => {
  switch (themeId) {
    case 'neon-aura':
      return '#0f172a'; // Solid slate-900 card
    case 'cyberpunk':
      return '#18181b'; // Solid zinc-900 card
    case 'midnight-minimal':
      return '#171717'; // Solid neutral-900 card
    case 'rose-gold':
      return '#2d121c'; // Solid rose-900 card
    case 'forest-amber':
      return '#053d20'; // Solid emerald-900 card
    case 'classic-silver':
      return '#1e293b'; // Solid slate-800 card
    default:
      return '#0f172a';
  }
};

interface AlarmTabProps {
  alarms: Alarm[];
  onAddAlarm: (alarm: Omit<Alarm, 'id'>) => void;
  onUpdateAlarm: (alarm: Alarm) => void;
  onToggleAlarm: (id: string) => void;
  onDeleteAlarm: (id: string) => void;
  theme: Theme;
}

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const VIBRATION_PROFILES = [
  { id: 'none', label: '📴 Off', desc: 'No vibration' },
  { id: 'gentle', label: '🍃 Gentle', desc: 'Soft and relaxing' },
  { id: 'heartbeat', label: '💓 Heartbeat', desc: 'Feels like a heartbeat' },
  { id: 'energetic', label: '⚡ Strong', desc: 'Fast repeated vibrations' },
  { id: 'military', label: '🥁 Pulse', desc: 'Strong rhythmic pulses' },
];

const STYLE_RECOMMENDATIONS = [
  {
    name: '🌅 Calming Sunrise',
    soundId: 'morning-breeze',
    volume: 70,
    gradualUp: true,
    vibrationPattern: 'gentle',
    desc: 'Intimate flowing piano, 70% volume, gentle vibration rise'
  },
  {
    name: '🧘 Zen Awakening',
    soundId: 'zen-horizon',
    volume: 50,
    gradualUp: true,
    vibrationPattern: 'none',
    desc: 'Deep Tibetan singing bowl, 50% volume, silent'
  },
  {
    name: '🚨 Heavy Sleep Shield',
    soundId: 'hyperdrive',
    volume: 100,
    gradualUp: false,
    vibrationPattern: 'energetic',
    desc: 'Heavy 135 BPM industrial beat, 100% volume, rapid vibration'
  }
];

export default function AlarmTab({
  alarms,
  onAddAlarm,
  onUpdateAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  theme,
}: AlarmTabProps) {
  const { settings, getFormattedTime, activeTimezone, getAppTime } = useDateTimeSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAlarmId, setEditingAlarmId] = useState<string | null>(null);
  
  // Sleep Preference States
  const [preferredSleepDuration, setPreferredSleepDuration] = useState<number>(() => {
    const saved = localStorage.getItem('dy_preferred_sleep_duration');
    return saved ? parseFloat(saved) : 8.0;
  });
  const [showSleepPrefModal, setShowSleepPrefModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(getAppTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(getAppTime());
    }, 1000);
    return () => clearInterval(interval);
  }, [getAppTime]);
  
  // Basic Alarm fields
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Wake Up');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [snoozeEnabled, setSnoozeEnabled] = useState(true);
  const [bedtimeReminderMode, setBedtimeReminderMode] = useState<'global' | 'disabled' | 'custom'>('global');
  const [bedtimeSleepGoalHours, setBedtimeSleepGoalHours] = useState(8);

  // Sound selection fields
  const [soundId, setSoundId] = useState('cosmic-resonance');
  const [soundVolume, setSoundVolume] = useState(80);
  const [gradualUp, setGradualUp] = useState(true);
  const [vibrationPattern, setVibrationPattern] = useState('heartbeat');
  const [customDataUrl, setCustomDataUrl] = useState<string | undefined>(undefined);
  
  // Custom interface states
  const [audioLabExpanded, setAudioLabExpanded] = useState(false);

  // Sound search and filter fields
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  // Persistence of favorites, custom uploads & recently used
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dy_sound_favorites');
      return saved ? JSON.parse(saved) : ['morning-breeze', 'sunrise', 'soft-piano', 'meditation-bells'];
    } catch (e) {
      return ['sunrise', 'soft-piano'];
    }
  });

  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dy_recently_used_sounds');
      return saved ? JSON.parse(saved) : ['morning-breeze', 'sunrise', 'soft-piano'];
    } catch (e) {
      return [];
    }
  });

  const [customSounds, setCustomSounds] = useState<{ id: string; name: string; dataUrl: string }[]>(() => {
    try {
      const saved = localStorage.getItem('dy_custom_sounds');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Wake-Up Voice Fields
  const [wakeVoiceEnabled, setWakeVoiceEnabled] = useState(false);
  const [wakeVoiceSource, setWakeVoiceSource] = useState<'tts' | 'upload' | 'record'>('tts');
  const [wakeVoiceTtsVoiceURI, setWakeVoiceTtsVoiceURI] = useState('');
  const [wakeVoiceTtsLanguage, setWakeVoiceTtsLanguage] = useState('en-US');
  const [wakeVoiceTtsMessage, setWakeVoiceTtsMessage] = useState('Good morning {name}! The time is {time}. Have an amazing day ahead.');
  const [wakeVoiceVolumeMode, setWakeVoiceVolumeMode] = useState<'same' | 'lower' | 'higher' | 'custom'>('same');
  const [wakeVoiceCustomVolume, setWakeVoiceCustomVolume] = useState(80);
  const [wakeVoicePlaybackMode, setWakeVoicePlaybackMode] = useState<'alarm-only' | 'voice-only' | 'alarm-then-voice' | 'voice-then-alarm'>('alarm-then-voice');
  const [wakeVoiceAudioDataUrl, setWakeVoiceAudioDataUrl] = useState<string | undefined>(undefined);
  const [wakeVoiceAudioTrimStart, setWakeVoiceAudioTrimStart] = useState(0);
  const [wakeVoiceAudioTrimEnd, setWakeVoiceAudioTrimEnd] = useState(0);
  const [wakeVoiceAudioDuration, setWakeVoiceAudioDuration] = useState(0);
  const [wakeVoiceAudioName, setWakeVoiceAudioName] = useState<string | undefined>(undefined);
  const [wakeVoiceAudioCreatedDate, setWakeVoiceAudioCreatedDate] = useState<string | undefined>(undefined);
  
  // Custom name placeholder target setting
  const [wakeVoiceCustomName, setWakeVoiceCustomName] = useState(() => {
    return localStorage.getItem('dy_wake_voice_custom_name') || 'Daniel';
  });

  // Expandable UI state for Wake-Up Voice section
  const [wakeVoiceSectionExpanded, setWakeVoiceSectionExpanded] = useState(false);

  // Available offline TTS voices
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Previews State
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState(false);
  const [isPlayingTtsPreview, setIsPlayingTtsPreview] = useState(false);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);
  const voicePreviewTimeoutRef = useRef<number | null>(null);

  // Load offline TTS voices
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      stopVoiceFilePreview();
      stopTtsPreview();
    };
  }, []);

  const resolvePlaceholders = (text: string, customName: string): string => {
    const now = new Date();
    // Time
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Date
    const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    // Day
    const dayStr = now.toLocaleDateString([], { weekday: 'long' });
    // Sleep duration
    const bedsideStart = localStorage.getItem('dy_bedside_entered_at');
    let sleepStr = '7 hours and 45 minutes';
    if (bedsideStart) {
      try {
        const entered = new Date(bedsideStart);
        const diffMs = now.getTime() - entered.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        if (diffHrs > 0 || diffMins > 0) {
          sleepStr = `${diffHrs > 0 ? `${diffHrs} hour${diffHrs > 1 ? 's' : ''}` : ''}${diffHrs > 0 && diffMins > 0 ? ' and ' : ''}${diffMins > 0 ? `${diffMins} minute${diffMins > 1 ? 's' : ''}` : ''}`;
        }
      } catch (e) {}
    }
    // Battery
    let batteryStr = '94%';
    if (typeof navigator !== 'undefined' && (navigator as any).battery) {
      batteryStr = `${Math.round((navigator as any).battery.level * 100)}%`;
    }

    return text
      .replace(/{name}/g, customName || 'Daniel')
      .replace(/{time}/g, timeStr)
      .replace(/{date}/g, dateStr)
      .replace(/{day}/g, dayStr)
      .replace(/{sleep_duration}/g, sleepStr)
      .replace(/{battery}/g, batteryStr);
  };

  const startRecording = async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices not supported');
      }
      stopVoiceFilePreview();
      stopTtsPreview();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result as string;
          setWakeVoiceAudioDataUrl(base64Data);
          setWakeVoiceAudioName(`Recording_${new Date().toLocaleDateString().replace(/\//g, '-')}`);
          setWakeVoiceAudioCreatedDate(new Date().toLocaleDateString());
          
          // Determine duration
          const tempAudio = new Audio(base64Data);
          tempAudio.onloadedmetadata = () => {
            const dur = Math.round(tempAudio.duration * 10) / 10;
            setWakeVoiceAudioDuration(dur);
            setWakeVoiceAudioTrimStart(0);
            setWakeVoiceAudioTrimEnd(dur);
          };
        };
        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Start timer
      setRecordingDuration(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      mediaRecorder.start();
      setIsRecording(true);
      haptics.medium();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setErrorMessage('Microphone access is required to record voice commands.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      haptics.heavy();
    }
  };

  const playVoiceFilePreview = (dataUrl: string, trimStart: number, trimEnd: number) => {
    // Stop any existing sound/vibration
    synth.stopAlarmSound();
    stopVibrationPreview();
    stopVoiceFilePreview();
    stopTtsPreview();

    const audio = new Audio(dataUrl);
    voicePreviewAudioRef.current = audio;
    audio.currentTime = trimStart;
    
    // Volume calculation
    let vol = soundVolume / 100;
    if (wakeVoiceVolumeMode === 'lower') vol = Math.max(0.1, vol - 0.2);
    else if (wakeVoiceVolumeMode === 'higher') vol = Math.min(1.0, vol + 0.2);
    else if (wakeVoiceVolumeMode === 'custom') vol = wakeVoiceCustomVolume / 100;
    audio.volume = vol;

    audio.play().then(() => {
      setIsPlayingVoicePreview(true);
      const duration = (trimEnd - trimStart) * 1000;
      voicePreviewTimeoutRef.current = window.setTimeout(() => {
        stopVoiceFilePreview();
      }, duration);
    }).catch(err => {
      console.warn('Voice preview play failed:', err);
    });

    audio.onended = () => {
      stopVoiceFilePreview();
    };
  };

  const stopVoiceFilePreview = () => {
    if (voicePreviewAudioRef.current) {
      try {
        voicePreviewAudioRef.current.pause();
      } catch (e) {}
      voicePreviewAudioRef.current = null;
    }
    if (voicePreviewTimeoutRef.current) {
      window.clearTimeout(voicePreviewTimeoutRef.current);
      voicePreviewTimeoutRef.current = null;
    }
    setIsPlayingVoicePreview(false);
  };

  const playTtsPreview = () => {
    // Stop any existing sound/vibration
    synth.stopAlarmSound();
    stopVibrationPreview();
    stopVoiceFilePreview();
    stopTtsPreview();

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const message = resolvePlaceholders(wakeVoiceTtsMessage, wakeVoiceCustomName);
    const utterance = new SpeechSynthesisUtterance(message);

    if (wakeVoiceTtsVoiceURI) {
      const voice = availableVoices.find(v => v.voiceURI === wakeVoiceTtsVoiceURI);
      if (voice) {
        utterance.voice = voice;
      }
    }
    utterance.lang = wakeVoiceTtsLanguage;

    // Volume calculation
    let vol = soundVolume / 100;
    if (wakeVoiceVolumeMode === 'lower') vol = Math.max(0.1, vol - 0.2);
    else if (wakeVoiceVolumeMode === 'higher') vol = Math.min(1.0, vol + 0.2);
    else if (wakeVoiceVolumeMode === 'custom') vol = wakeVoiceCustomVolume / 100;
    utterance.volume = vol;

    utterance.onstart = () => {
      setIsPlayingTtsPreview(true);
    };
    utterance.onend = () => {
      setIsPlayingTtsPreview(false);
    };
    utterance.onerror = () => {
      setIsPlayingTtsPreview(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopTtsPreview = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingTtsPreview(false);
  };

  const vibrationTimeoutRef = useRef<number | null>(null);

  const stopVibrationPreview = () => {
    if (vibrationTimeoutRef.current) {
      window.clearTimeout(vibrationTimeoutRef.current);
      vibrationTimeoutRef.current = null;
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
    synth.stopVibrationFallback();
  };

  const playOnlySoundPreview = (
    soundIdToPlay: string,
    customUrlToPlay: string | undefined,
    volumePercent: number,
    durationMs: number = 3000,
    onEnded?: () => void
  ) => {
    // 1. Stop everything instantly
    synth.stopAlarmSound();
    stopVibrationPreview();
    setPreviewingId(null);

    // 2. Play only the sound preview
    setPreviewingId(soundIdToPlay);
    synth.previewSound(soundIdToPlay, customUrlToPlay, volumePercent, durationMs, () => {
      setPreviewingId(prev => prev === soundIdToPlay ? null : prev);
      if (onEnded) onEnded();
    });
  };

  const playVibrationOnlyPreview = (patternId: string, durationMs: number = 2500) => {
    // 1. Stop everything instantly (sound preview and any current vibration/fallback)
    synth.stopAlarmSound();
    stopVibrationPreview();
    setPreviewingId(null);

    // 2. If 'none' / Off, do not play any pattern
    if (patternId === 'none') {
      return;
    }

    // 3. Play haptics or fallback audio based on platform
    const hasVibrator = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    const isMobile = typeof window !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (hasVibrator && isMobile) {
      let pattern: number | number[] = 0;
      if (patternId === 'gentle') {
        pattern = [150, 250, 150, 250, 150, 250, 150];
      } else if (patternId === 'heartbeat') {
        pattern = [80, 80, 150, 600, 80, 80, 150, 600, 80, 80, 150];
      } else if (patternId === 'energetic') {
        pattern = [450, 200, 450, 200, 450, 200, 450];
      } else if (patternId === 'military') {
        pattern = [150, 100, 150, 100, 300, 400, 150, 100, 150, 100, 300];
      }

      if (pattern) {
        try {
          navigator.vibrate(pattern);
        } catch (e) {
          console.warn('Vibration failed:', e);
        }
      }

      vibrationTimeoutRef.current = window.setTimeout(() => {
        try {
          navigator.vibrate(0);
        } catch (e) {}
        vibrationTimeoutRef.current = null;
      }, durationMs);
    } else {
      // Fallback: Synthesized audio representation played on desktop / web where physical vibrator doesn't exist
      synth.playVibrationFallback(patternId, durationMs);
    }
  };

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => {
      synth.stopAlarmSound();
      stopVibrationPreview();
    };
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleToggleDay = (dayIndex: number) => {
    haptics.tick();
    synth.playClick();
    if (repeatDays.includes(dayIndex)) {
      setRepeatDays(repeatDays.filter((d) => d !== dayIndex));
    } else {
      setRepeatDays([...repeatDays, dayIndex].sort());
    }
  };

  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.light();
    synth.playClick();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('dy_sound_favorites', JSON.stringify(updated));
  };

  const [dragActive, setDragActive] = useState(false);

  const processAudioFile = (file: File) => {
    if (!file) return;

    if (file.size > 3.5 * 1024 * 1024) {
      haptics.error();
      synth.playErrorSound();
      setErrorMessage("Performance Safeguard: Please choose an audio file under 3.5 MB to keep DY Clock running fast and smooth!");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      const newCustom = {
        id: `custom-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // strip extension
        dataUrl: b64
      };

      const updated = [...customSounds, newCustom];
      setCustomSounds(updated);
      localStorage.setItem('dy_custom_sounds', JSON.stringify(updated));
      
      setSoundId(newCustom.id);
      setCustomDataUrl(b64);
      haptics.success();
      handlePreviewSound(newCustom.id, b64);
    };
    reader.readAsDataURL(file);
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      haptics.light();
      synth.playClick();
      processAudioFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processAudioFile(file);
    }
  };

  const addToRecentlyUsed = (id: string) => {
    setRecentlyUsed(prev => {
      const updated = [id, ...prev.filter(x => x !== id)].slice(0, 10);
      localStorage.setItem('dy_recently_used_sounds', JSON.stringify(updated));
      return updated;
    });
  };

  const getVolumeLabel = (vol: number) => {
    if (vol === 0) return "Muted";
    if (vol <= 20) return "Very Quiet";
    if (vol <= 40) return "Quiet";
    if (vol <= 60) return "Comfortable";
    if (vol <= 80) return "Loud";
    if (vol < 100) return "Very Loud";
    return "Maximum";
  };

  const playSliderReleasePreview = (volume: number) => {
    const currentCustomUrl = customDataUrl || customSounds.find(s => s.id === soundId)?.dataUrl;
    playOnlySoundPreview(soundId, currentCustomUrl, volume, 2000);
  };

  const playSelectionPreview = (id: string, customUrl?: string, volume: number = soundVolume) => {
    const resolvedUrl = customUrl || customSounds.find(s => s.id === id)?.dataUrl;
    playOnlySoundPreview(id, resolvedUrl, volume, 3000);
  };

  const handlePreviewSound = (id: string, customUrl?: string) => {
    addToRecentlyUsed(id);
    if (previewingId === id) {
      synth.stopAlarmSound();
      stopVibrationPreview();
      setPreviewingId(null);
    } else {
      const resolvedUrl = customUrl || customSounds.find(s => s.id === id)?.dataUrl;
      playOnlySoundPreview(id, resolvedUrl, soundVolume, 5000);
    }
  };

  const applyVibePreset = (preset: typeof STYLE_RECOMMENDATIONS[0]) => {
    haptics.success();
    setSoundId(preset.soundId);
    setSoundVolume(preset.volume);
    setGradualUp(preset.gradualUp);
    setVibrationPattern(preset.vibrationPattern);
    
    // Auto preview preset sound using preset volume
    const customMatch = customSounds.find(s => s.id === preset.soundId);
    addToRecentlyUsed(preset.soundId);
    playOnlySoundPreview(preset.soundId, customMatch?.dataUrl, preset.volume, 4000);
  };

  const handleStartEdit = (alarm: Alarm) => {
    haptics.medium();
    synth.playClick();
    
    setEditingAlarmId(alarm.id);
    setTime(alarm.time);
    setLabel(alarm.label);
    setRepeatDays(alarm.repeatDays);
    setSnoozeEnabled(alarm.snoozeEnabled ?? true);
    setSoundId(alarm.soundId || 'gentle-wake-up');
    setSoundVolume(alarm.soundVolume ?? 80);
    setGradualUp(alarm.gradualUp ?? true);
    setVibrationPattern(alarm.vibrationPattern || 'heartbeat');
    setCustomDataUrl(alarm.customDataUrl);
    setBedtimeReminderMode(alarm.bedtimeReminderMode || 'global');
    setBedtimeSleepGoalHours(alarm.bedtimeSleepGoalHours || 8);

    // Load Wake-Up Voice Fields
    const voice = alarm.wakeUpVoice || {
      enabled: false,
      source: 'tts',
      ttsVoiceURI: '',
      ttsLanguage: 'en-US',
      ttsMessage: 'Good morning {name}! The time is {time}. Have an amazing day ahead.',
      voiceVolumeMode: 'same',
      voiceCustomVolume: 80,
      playbackMode: 'alarm-then-voice',
    };
    setWakeVoiceEnabled(voice.enabled);
    setWakeVoiceSource(voice.source);
    setWakeVoiceTtsVoiceURI(voice.ttsVoiceURI || '');
    setWakeVoiceTtsLanguage(voice.ttsLanguage || 'en-US');
    setWakeVoiceTtsMessage(voice.ttsMessage || 'Good morning {name}! The time is {time}. Have an amazing day ahead.');
    setWakeVoiceVolumeMode(voice.voiceVolumeMode || 'same');
    setWakeVoiceCustomVolume(voice.voiceCustomVolume ?? 80);
    setWakeVoicePlaybackMode(voice.playbackMode || 'alarm-then-voice');
    setWakeVoiceAudioDataUrl(voice.audioDataUrl);
    setWakeVoiceAudioTrimStart(voice.audioTrimStart ?? 0);
    setWakeVoiceAudioTrimEnd(voice.audioTrimEnd ?? 0);
    setWakeVoiceAudioDuration(voice.audioDuration ?? 0);
    setWakeVoiceAudioName(voice.audioName);
    setWakeVoiceAudioCreatedDate(voice.audioCreatedDate);
    setWakeVoiceSectionExpanded(voice.enabled);
    
    setShowAddForm(true);
  };

  const handleUseAsTemplate = (alarm: Alarm) => {
    haptics.medium();
    synth.playClick();
    
    // Crucial: ensure editingAlarmId is null so saving creates a brand-new alarm
    setEditingAlarmId(null);

    // Default new alarm time to current master timezone hour/minute (24-hour format)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: activeTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hrsVal = parts.find(p => p.type === 'hour')?.value || '00';
    const minsVal = parts.find(p => p.type === 'minute')?.value || '00';
    setTime(`${hrsVal}:${minsVal}`);

    // Copy ALL alarm settings from template
    setLabel(alarm.label);
    setRepeatDays(alarm.repeatDays ? [...alarm.repeatDays] : []);
    setSnoozeEnabled(alarm.snoozeEnabled ?? true);
    setSoundId(alarm.soundId || 'gentle-wake-up');
    setSoundVolume(alarm.soundVolume ?? 80);
    setGradualUp(alarm.gradualUp ?? true);
    setVibrationPattern(alarm.vibrationPattern || 'heartbeat');
    setCustomDataUrl(alarm.customDataUrl);
    setBedtimeReminderMode(alarm.bedtimeReminderMode || 'global');
    setBedtimeSleepGoalHours(alarm.bedtimeSleepGoalHours || 8);

    // Load Wake-Up Voice Fields from template
    const voice = alarm.wakeUpVoice || {
      enabled: false,
      source: 'tts',
      ttsVoiceURI: '',
      ttsLanguage: 'en-US',
      ttsMessage: 'Good morning {name}! The time is {time}. Have an amazing day ahead.',
      voiceVolumeMode: 'same',
      voiceCustomVolume: 80,
      playbackMode: 'alarm-then-voice',
    };
    setWakeVoiceEnabled(voice.enabled);
    setWakeVoiceSource(voice.source);
    setWakeVoiceTtsVoiceURI(voice.ttsVoiceURI || '');
    setWakeVoiceTtsLanguage(voice.ttsLanguage || 'en-US');
    setWakeVoiceTtsMessage(voice.ttsMessage || 'Good morning {name}! The time is {time}. Have an amazing day ahead.');
    setWakeVoiceVolumeMode(voice.voiceVolumeMode || 'same');
    setWakeVoiceCustomVolume(voice.voiceCustomVolume ?? 80);
    setWakeVoicePlaybackMode(voice.playbackMode || 'alarm-then-voice');
    setWakeVoiceAudioDataUrl(voice.audioDataUrl);
    setWakeVoiceAudioTrimStart(voice.audioTrimStart ?? 0);
    setWakeVoiceAudioTrimEnd(voice.audioTrimEnd ?? 0);
    setWakeVoiceAudioDuration(voice.audioDuration ?? 0);
    setWakeVoiceAudioName(voice.audioName);
    setWakeVoiceAudioCreatedDate(voice.audioCreatedDate);
    setWakeVoiceSectionExpanded(voice.enabled);

    // Open Add Alarm fullscreen form
    setShowAddForm(true);
  };

  const handleCancel = () => {
    haptics.medium();
    synth.playDismiss();
    
    // Stop any active previews
    synth.stopAlarmSound();
    setPreviewingId(null);
    stopVibrationPreview();
    stopRecording();
    stopVoiceFilePreview();
    stopTtsPreview();

    // Reset form fields
    setTime('07:00');
    setLabel('Wake Up');
    setRepeatDays([]);
    setSoundId('gentle-wake-up');
    setSoundVolume(80);
    setGradualUp(true);
    setVibrationPattern('heartbeat');
    setCustomDataUrl(undefined);
    setSnoozeEnabled(true);
    setBedtimeReminderMode('global');
    setBedtimeSleepGoalHours(8);
    setAudioLabExpanded(false);

    // Reset Wake-Up Voice
    setWakeVoiceEnabled(false);
    setWakeVoiceSource('tts');
    setWakeVoiceTtsVoiceURI('');
    setWakeVoiceTtsLanguage('en-US');
    setWakeVoiceTtsMessage('Good morning {name}! The time is {time}. Have an amazing day ahead.');
    setWakeVoiceVolumeMode('same');
    setWakeVoiceCustomVolume(80);
    setWakeVoicePlaybackMode('alarm-then-voice');
    setWakeVoiceAudioDataUrl(undefined);
    setWakeVoiceAudioTrimStart(0);
    setWakeVoiceAudioTrimEnd(0);
    setWakeVoiceAudioDuration(0);
    setWakeVoiceAudioName(undefined);
    setWakeVoiceAudioCreatedDate(undefined);
    setWakeVoiceSectionExpanded(false);
    
    setShowAddForm(false);
    setEditingAlarmId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    haptics.success();
    synth.playSuccessSound();
    
    // Stop any active previews
    synth.stopAlarmSound();
    setPreviewingId(null);
    stopVibrationPreview();
    stopRecording();
    stopVoiceFilePreview();
    stopTtsPreview();

    const alarmPayload: Omit<Alarm, 'id'> = {
      time,
      label: label.trim() || 'Alarm',
      enabled: true,
      repeatDays,
      soundId,
      soundVolume,
      gradualUp,
      vibrationPattern,
      customDataUrl: soundId.startsWith('custom-') ? customDataUrl : undefined,
      snoozeEnabled,
      bedtimeReminderMode,
      bedtimeSleepGoalHours,
      wakeUpVoice: {
        enabled: wakeVoiceEnabled,
        source: wakeVoiceSource,
        ttsVoiceURI: wakeVoiceTtsVoiceURI,
        ttsLanguage: wakeVoiceTtsLanguage,
        ttsMessage: wakeVoiceTtsMessage,
        voiceVolumeMode: wakeVoiceVolumeMode,
        voiceCustomVolume: wakeVoiceCustomVolume,
        playbackMode: wakeVoicePlaybackMode,
        audioDataUrl: wakeVoiceAudioDataUrl,
        audioTrimStart: wakeVoiceAudioTrimStart,
        audioTrimEnd: wakeVoiceAudioTrimEnd,
        audioDuration: wakeVoiceAudioDuration,
        audioName: wakeVoiceAudioName,
        audioCreatedDate: wakeVoiceAudioCreatedDate,
      },
    };

    if (editingAlarmId) {
      onUpdateAlarm({
        ...alarmPayload,
        id: editingAlarmId,
      });
    } else {
      onAddAlarm(alarmPayload as any);
    }

    // Reset form
    setTime('07:00');
    setLabel('Wake Up');
    setRepeatDays([]);
    setSoundId('gentle-wake-up');
    setSoundVolume(80);
    setGradualUp(true);
    setVibrationPattern('heartbeat');
    setCustomDataUrl(undefined);
    setSnoozeEnabled(true);
    setAudioLabExpanded(false);

    setWakeVoiceEnabled(false);
    setWakeVoiceSource('tts');
    setWakeVoiceTtsVoiceURI('');
    setWakeVoiceTtsLanguage('en-US');
    setWakeVoiceTtsMessage('Good morning {name}! The time is {time}. Have an amazing day ahead.');
    setWakeVoiceVolumeMode('same');
    setWakeVoiceCustomVolume(80);
    setWakeVoicePlaybackMode('alarm-then-voice');
    setWakeVoiceAudioDataUrl(undefined);
    setWakeVoiceAudioTrimStart(0);
    setWakeVoiceAudioTrimEnd(0);
    setWakeVoiceAudioDuration(0);
    setWakeVoiceAudioName(undefined);
    setWakeVoiceAudioCreatedDate(undefined);
    setWakeVoiceSectionExpanded(false);

    setShowAddForm(false);
    setEditingAlarmId(null);
  };

  // Helper to fetch readable sound name
  const getSoundName = (id?: string) => {
    if (!id) return 'Gentle Wake Up';
    if (id.startsWith('custom-')) {
      const c = customSounds.find(s => s.id === id);
      return c ? `📤 ${c.name}` : 'Custom Audio';
    }
    const b = BUILTIN_SOUNDS.find(s => s.id === id);
    return b ? b.name : 'Morning Breeze';
  };

  const getVibrationLabel = (id?: string) => {
    const found = VIBRATION_PROFILES.find(v => v.id === id);
    return found ? found.label : '💓 Heartbeat';
  };

  // Filtering Logic
  const allSoundsCombined = [
    ...customSounds.map(s => ({
      id: s.id,
      name: s.name,
      category: 'Uploaded 📥',
      description: 'Custom imported device audio file.',
      isCustom: true,
      dataUrl: s.dataUrl,
      durationText: 'User file',
      typeText: 'Uploaded'
    })),
    ...BUILTIN_SOUNDS.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      isCustom: false,
      dataUrl: undefined,
      durationText: s.durationText,
      typeText: s.typeText
    }))
  ];

  const categoriesList = [
    { id: 'All', name: 'All', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'Favorites', name: 'Favorites', icon: <Heart className="w-3.5 h-3.5 fill-current" /> },
    { id: 'Recent', name: 'Recent', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'Calm Wake Up', name: 'Calm Wake Up', icon: <Sun className="w-3.5 h-3.5" /> },
    { id: 'Normal Alarm', name: 'Everyday', icon: <Bell className="w-3.5 h-3.5" /> },
    { id: 'Strong Wake Up', name: 'Heavy Sleepers', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'Nature', name: 'Nature', icon: <Trees className="w-3.5 h-3.5" /> },
    { id: 'Piano', name: 'Piano', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'Bells', name: 'Bells', icon: <BellRing className="w-3.5 h-3.5" /> },
    { id: 'Rain', name: 'Rain', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { id: 'Ocean', name: 'Ocean', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'Uploaded', name: 'Custom', icon: <FolderOpen className="w-3.5 h-3.5" /> }
  ];

  const filteredSounds = allSoundsCombined.filter(sound => {
    const matchesSearch = sound.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sound.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (activeCategory) {
      case 'All':
        return true;
      case 'Favorites':
        return favorites.includes(sound.id);
      case 'Recent':
        return recentlyUsed.includes(sound.id);
      case 'Calm Wake Up':
        return sound.category === 'Calm Wake Up';
      case 'Normal Alarm':
        return sound.category === 'Normal Alarm';
      case 'Strong Wake Up':
        return sound.category === 'Strong Wake Up';
      case 'Nature':
        return ['solar-wind', 'morning-breeze', 'zen-horizon'].includes(sound.id);
      case 'Piano':
        return ['morning-breeze'].includes(sound.id);
      case 'Bells':
        return ['golden-hour-bell', 'aurora-chime', 'cosmic-resonance', 'zen-horizon'].includes(sound.id);
      case 'Rain':
        return ['solar-wind'].includes(sound.id);
      case 'Ocean':
        return ['vaporwave-dream'].includes(sound.id);
      case 'Uploaded':
        return sound.isCustom;
      default:
        return true;
    }
  });

  if (activeCategory === 'Recent') {
    filteredSounds.sort((a, b) => {
      const idxA = recentlyUsed.indexOf(a.id);
      const idxB = recentlyUsed.indexOf(b.id);
      return idxA - idxB;
    });
  }

  // Real-time Sleep Intelligence Calculations
  const calculateBedtime = (alarmTimeStr: string, durationHours: number) => {
    if (!alarmTimeStr || !alarmTimeStr.includes(':')) {
      return { timeStr: '22:00', formatted: '10:00 PM', hrs: 22, mins: 0 };
    }
    const [hrs, mins] = alarmTimeStr.split(':').map(Number);
    const durationMinutes = Math.round(durationHours * 60);
    const alarmTotalMins = hrs * 60 + mins;
    
    let bedtimeTotalMins = (alarmTotalMins - durationMinutes) % (24 * 60);
    if (bedtimeTotalMins < 0) {
      bedtimeTotalMins += 24 * 60;
    }
    
    const bedHrs = Math.floor(bedtimeTotalMins / 60);
    const bedMins = bedtimeTotalMins % 60;
    const bedTimeStr = `${String(bedHrs).padStart(2, '0')}:${String(bedMins).padStart(2, '0')}`;
    
    return {
      timeStr: bedTimeStr,
      formatted: formatAlarmTime(bedTimeStr, settings.timeFormat),
      hrs: bedHrs,
      mins: bedMins
    };
  };

  const option1 = calculateBedtime(time, preferredSleepDuration); // 5 stars
  const option2 = calculateBedtime(time, preferredSleepDuration - 0.5); // 4 stars
  const option3 = calculateBedtime(time, preferredSleepDuration - 1.0); // 3 stars

  const activeTZTime = (() => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: activeTimezone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      });
      const parts = formatter.formatToParts(currentTime);
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '1970', 10);
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10) - 1;
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const second = parseInt(parts.find(p => p.type === 'second')?.value || '0', 10);
      
      return new Date(year, month, day, hour, minute, second);
    } catch (e) {
      return currentTime;
    }
  })();

  const getCountdownString = () => {
    const targetBedDate = new Date(activeTZTime);
    targetBedDate.setHours(option1.hrs, option1.mins, 0, 0);

    if (targetBedDate.getTime() < activeTZTime.getTime()) {
      targetBedDate.setTime(targetBedDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const diffMs = targetBedDate.getTime() - activeTZTime.getTime();
    const totalSeconds = Math.floor(diffMs / 1000);
    const hoursLeft = Math.floor(totalSeconds / 3600);
    const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
    const secondsLeft = totalSeconds % 60;

    return `${hoursLeft}h ${minutesLeft}m ${secondsLeft}s`;
  };

  return (
    <div className="space-y-6" id="alarm-tab-view">
      
      {/* SECTION HEADER BLOCK */}
      <div className="flex items-center justify-between" id="alarm-tab-header">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bell className={`w-5 h-5 text-${theme.primary}`} /> Alarms
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">
            {alarms.filter(a => a.enabled).length} Active Awakening Alarms
          </p>
        </div>
        
        <motion.button
          onClick={() => {
            haptics.medium();
            synth.playClick();
            setEditingAlarmId(null);
            
            // Default new alarm time to current master timezone hour/minute (24-hour format)
            const formatter = new Intl.DateTimeFormat('en-US', {
              timeZone: activeTimezone,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            const parts = formatter.formatToParts(new Date());
            const hrsVal = parts.find(p => p.type === 'hour')?.value || '00';
            const minsVal = parts.find(p => p.type === 'minute')?.value || '00';
            setTime(`${hrsVal}:${minsVal}`);
            
            setShowAddForm(true);
          }}
          {...getButtonMotion(settings.animationIntensity)}
          transition={getSpringTransition(settings.animationIntensity)}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-${theme.primary} text-slate-950 shadow-lg shadow-${theme.primary}/10 cursor-pointer`}
          id="btn-add-alarm-trigger"
        >
          <Plus className="w-4 h-4 text-slate-950" /> Add Alarm
        </motion.button>
      </div>

      {/* Add / Edit Alarm Form Panel - Rebuilt as a dedicated full-screen page with premium page transition inside a Portal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ x: 28, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 28, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
              className="fixed inset-0 z-[9999] overflow-y-auto flex flex-col bg-slate-950"
              style={{ backgroundColor: getOpaqueBgColor(theme.id) }}
              id="add-alarm-fullscreen-page"
            >
            {/* Ambient luxury glow accents */}
            <div className={`absolute top-0 left-1/4 w-96 h-96 bg-${theme.primary}/[0.04] rounded-full blur-3xl pointer-events-none`} />
            <div className={`absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none`} />

            <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
              
              {/* 1. PREMIUM HEADER NAVIGATION */}
              <div 
                className={`sticky top-0 border-b border-${theme.primary}/20 px-4 sm:px-6 py-4 flex items-center justify-between z-30`}
                style={{ backgroundColor: getOpaqueBgColor(theme.id) }}
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`px-4 py-2 rounded-xl text-xs font-black text-slate-400 hover:text-${theme.primary} transition-colors cursor-pointer`}
                  id="fullscreen-cancel-btn"
                >
                  Cancel
                </button>
                
                <div className="text-center">
                  <h3 className="text-xs font-black tracking-widest text-white uppercase font-sans">
                    {editingAlarmId ? 'Edit Awakening' : 'Create Awakening'}
                  </h3>
                </div>

                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black bg-${theme.primary} text-slate-950 shadow-lg shadow-${theme.primary}/20 hover:scale-[1.03] active:scale-95 transition-all cursor-pointer`}
                  id="fullscreen-save-btn"
                >
                  Save
                </button>
              </div>

              {/* 2. MAIN SCROLLABLE FORM - SINGLE-COLUMN SPECIFICATION with extra bottom padding for safe area and touch targets */}
              <div className="flex-1 w-full max-w-xl mx-auto px-4 py-8 sm:py-10 pb-28 sm:pb-36 space-y-6 relative z-10">
                
                {/* PRIMARY FOCUS: RADIAL CLOCK TIME PICKER */}
                <div id="time-picker-section">
                  <AlarmTimePicker value={time} onChange={setTime} theme={theme} />
                </div>

                {/* NEXT RING PREVIEW CARD */}
                <NextRingPreviewCard
                  time={time}
                  repeatDays={repeatDays}
                  currentTime={currentTime}
                  theme={theme}
                  timeFormat={settings.timeFormat}
                />

                {/* SECOND: REPEAT DAYS FREQUENCY CARD */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl`} 
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="repeat-days-section"
                >
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Repeat Frequency</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {repeatDays.length === 7 
                        ? 'Every day' 
                        : repeatDays.length === 5 && !repeatDays.includes(0) && !repeatDays.includes(6)
                          ? 'Weekdays'
                          : repeatDays.length === 2 && repeatDays.includes(0) && repeatDays.includes(6)
                            ? 'Weekends'
                            : repeatDays.length === 0 
                              ? 'Once' 
                              : `${repeatDays.length} days selected`}
                    </span>
                  </div>
                  
                  <div className="flex justify-between gap-1.5 sm:gap-2.5" id="day-selector-row">
                    {DAYS_SHORT.map((day, idx) => {
                      const isSelected = repeatDays.includes(idx);
                      return (
                        <motion.button
                          key={day}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => handleToggleDay(idx)}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-xs font-black border flex items-center justify-center transition-all duration-300 cursor-pointer ${
                            isSelected
                              ? `bg-${theme.primary} text-slate-950 border-${theme.primary} shadow-lg shadow-${theme.primary}/15 font-black`
                              : `bg-black/20 text-slate-400 border border-${theme.primary}/10 hover:border-${theme.primary}/30`
                          }`}
                          id={`day-btn-${idx}`}
                          title={`Repeat on ${day}`}
                        >
                          {day[0]}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* THIRD: ALARM LABEL CARD */}
                <div 
                  className={`space-y-3 p-5 sm:p-6 border ${theme.border} rounded-3xl shadow-xl`}
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                >
                  <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase px-1 block">Alarm Label</label>
                  <div className="relative flex items-center">
                    <Tag className={`absolute left-4 w-4 h-4 text-${theme.primary}/50 pointer-events-none`} />
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Morning Meditation"
                      className={`w-full py-4 pl-11 pr-4 rounded-2xl bg-black/25 border border-${theme.primary}/15 text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:border-${theme.primary} focus:ring-1 focus:ring-${theme.primary}/30 transition-all duration-300`}
                      id="alarm-label-input"
                    />
                  </div>
                </div>

                {/* FOURTH: ALARM SOUND CONFIGURATIONS */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl`} 
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="alarm-sound-section"
                >
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Alarm Sound</span>
                    <span className={`text-[10px] font-bold text-${theme.primary} uppercase tracking-wider`}>
                      {getSoundName(soundId)}
                    </span>
                  </div>

                  {/* Volume level control with live preview */}
                  <div className="space-y-3 bg-black/15 p-4 rounded-2xl border border-slate-900/40">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-400">
                      <span>MASTER VOLUME</span>
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={soundVolume}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className={`font-bold text-${theme.primary}`}
                        >
                          {soundVolume}%
                        </motion.span>
                      </AnimatePresence>
                    </div>

                    <div className="relative w-full h-6 flex items-center select-none">
                      {/* Left Icon depending on volume level */}
                      <div className="shrink-0 w-[24px]">
                        {soundVolume === 0 ? (
                          <VolumeX className="w-4.5 h-4.5 text-rose-500/80" />
                        ) : soundVolume <= 33 ? (
                          <Volume className="w-4.5 h-4.5 text-slate-500" />
                        ) : soundVolume <= 66 ? (
                          <Volume1 className="w-4.5 h-4.5 text-slate-300" />
                        ) : (
                          <Volume2 className={`w-4.5 h-4.5 text-${theme.primary}`} />
                        )}
                      </div>

                      {/* Slider Track Wrapper with exact margins */}
                      <div className="relative flex-1 h-6 flex items-center ml-2">
                        {/* 1. Track background */}
                        <div className="absolute inset-x-0 h-1.5 rounded-full bg-slate-950 border border-slate-900/40 overflow-hidden">
                          {/* 2. Track animated fill */}
                          <motion.div 
                            className={`absolute left-0 top-0 bottom-0 bg-${theme.primary}`}
                            style={{ width: `${soundVolume}%` }}
                            animate={{ width: `${soundVolume}%` }}
                            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                          />
                        </div>

                        {/* 3. Invisible Native Input on top for perfect drag mechanics */}
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={soundVolume}
                          onChange={(e) => {
                            const vol = parseInt(e.target.value, 10);
                            setSoundVolume(vol);
                            synth.setVolume(vol); // dynamic live adjustment
                            haptics.light();
                          }}
                          onMouseUp={() => {
                            playSliderReleasePreview(soundVolume);
                          }}
                          onTouchEnd={() => {
                            playSliderReleasePreview(soundVolume);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          aria-label="Alarm Volume"
                        />

                        {/* 4. Animated Custom Thumb */}
                        <motion.div
                          className={`absolute w-4.5 h-4.5 rounded-full bg-white shadow-xl border-2 border-current text-${theme.primary} pointer-events-none z-10 flex items-center justify-center`}
                          style={{ 
                            left: `calc(${soundVolume}% - 9px)`
                          }}
                          animate={{ 
                            left: `calc(${soundVolume}% - 9px)`,
                          }}
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 1.25 }}
                          transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Live descriptive level label */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-1.5 border-t border-slate-900/40">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">DESCRIPTIVE LEVEL</span>
                      <AnimatePresence mode="popLayout">
                        <motion.span
                          key={getVolumeLabel(soundVolume)}
                          initial={{ opacity: 0, scale: 0.95, y: -2 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 2 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          className={`font-black uppercase tracking-widest text-[10px] text-${theme.primary}`}
                        >
                          {getVolumeLabel(soundVolume)}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Gradual Rise toggle */}
                  <div className="flex items-center justify-between p-3.5 bg-black/25 border border-slate-900/60 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-black text-slate-200 block uppercase tracking-wide">Gradual Volume Rise</span>
                      <span className="text-[9px] text-slate-500 block">Linearly scale volume over 15s</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        setGradualUp(!gradualUp);
                      }}
                      className={`w-11 h-6.5 rounded-full p-0.5 transition-all duration-300 relative flex items-center cursor-pointer outline-none ${
                        gradualUp ? `bg-${theme.primary} border border-${theme.primary}/20` : `bg-black/40 border border-${theme.primary}/15`
                      }`}
                      aria-label="Toggle gradual volume rise"
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-slate-950 shadow-md"
                        animate={{ x: gradualUp ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  {/* Expandable Sound Browser */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        haptics.medium();
                        synth.playClick();
                        setAudioLabExpanded(!audioLabExpanded);
                      }}
                      className="w-full p-3.5 bg-black/25 border border-slate-900/60 rounded-2xl flex items-center justify-between hover:bg-white/[0.02] transition-all text-left cursor-pointer outline-none"
                      id="sound-browser-trigger"
                    >
                      <div className="flex items-center gap-3">
                        <Music className={`w-4 h-4 text-${theme.primary}`} />
                        <span className="text-xs font-black text-white uppercase tracking-wider">Browse Sound Library</span>
                      </div>
                      <motion.div
                        animate={{ rotate: audioLabExpanded ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="text-slate-400"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {audioLabExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                          className="overflow-hidden space-y-4 pt-1"
                        >
                          {/* Drag and Drop Custom upload area */}
                          <div 
                            onDragEnter={handleDrag}
                            onDragOver={handleDrag}
                            onDragLeave={handleDrag}
                            onDrop={handleDrop}
                            className={`relative flex flex-col items-center justify-center text-center p-5 rounded-2xl border-2 border-dashed transition-all duration-300 ${
                              dragActive 
                                ? `border-${theme.primary} bg-${theme.primary}/10 scale-[1.01]` 
                                : `border-${theme.primary}/20 bg-black/25 hover:border-${theme.primary}/40`
                            }`}
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef} 
                              onChange={handleCustomAudioUpload}
                              accept="audio/*" 
                              className="hidden" 
                            />
                            <div className="p-3 bg-black/30 rounded-full mb-2">
                              <Upload className={`w-5 h-5 text-${theme.primary} ${dragActive ? 'animate-bounce' : ''}`} />
                            </div>
                            <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider block">Import Custom File</span>
                            <p className="text-[9px] text-slate-500 max-w-[240px] mt-1 leading-normal">
                              Drag and drop or click to upload your custom sound. Supports MP3, WAV, OGG, M4A, AAC, FLAC (Max 3.5MB).
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                haptics.medium();
                                fileInputRef.current?.click();
                              }}
                              className={`mt-3 py-1.5 px-4 rounded-xl bg-black/35 hover:bg-black/55 border border-${theme.primary}/25 hover:border-${theme.primary}/50 text-slate-200 text-[10px] font-black transition-all cursor-pointer`}
                            >
                              Choose File
                            </button>
                          </div>

                          {/* Suggested preset vibes */}
                          <div className="space-y-2">
                            <span className={`text-[9px] font-black tracking-widest text-${theme.primary} uppercase`}>Recommended Profiles</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {STYLE_RECOMMENDATIONS.map((preset) => (
                                <button
                                  key={preset.name}
                                  type="button"
                                  onClick={() => applyVibePreset(preset)}
                                  className="p-3 rounded-2xl bg-black/20 border border-slate-900 hover:border-slate-800 text-left transition-all hover:scale-[1.02] active:scale-95 group cursor-pointer"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-white group-hover:text-cyan-400">{preset.name}</span>
                                    <Sparkles className="w-3 h-3 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                  <p className="text-[9px] text-slate-500 mt-1 leading-tight">{preset.desc}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Sound library browser */}
                          <div className="space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                              <span className={`text-[9px] font-black tracking-widest text-${theme.primary} uppercase`}>All Sound Presets</span>
                              
                              <div className="relative w-full sm:max-w-[200px]">
                                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-${theme.primary}/40`} />
                                <input 
                                  type="text" 
                                  placeholder="Search sound..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className={`w-full py-2 pl-9 pr-3 rounded-xl bg-black/25 border border-${theme.primary}/15 text-[11px] font-semibold text-white focus:outline-none focus:border-${theme.primary} placeholder-slate-600 transition-all duration-200`}
                                  aria-label="Search sound presets"
                                />
                              </div>
                            </div>

                            {/* Sound category switcher */}
                            <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none" id="categories-tabs">
                              {categoriesList.map((cat) => {
                                const isActive = activeCategory === cat.id;
                                if (cat.id === 'Uploaded' && customSounds.length === 0) return null;
                                return (
                                  <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => {
                                      haptics.light();
                                      setActiveCategory(cat.id);
                                    }}
                                    className={`py-1.5 px-3 rounded-full text-[10px] font-black whitespace-nowrap border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isActive
                                        ? `bg-${theme.primary} text-slate-950 border-${theme.primary} shadow-md shadow-${theme.primary}/10`
                                        : `bg-black/25 text-slate-400 border border-${theme.primary}/10 hover:border-${theme.primary}/30 hover:text-white`
                                    }`}
                                  >
                                    {cat.icon}
                                    <span>{cat.name}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Sound scrolling list */}
                            <div className="max-h-[280px] overflow-y-auto border border-slate-900 bg-black/20 rounded-2xl p-2 space-y-1.5 custom-scrollbar">
                              {filteredSounds.length === 0 ? (
                                <div className="p-8 text-center text-slate-600 text-[11px] font-black uppercase tracking-wider">
                                  No sounds found matching filter
                                </div>
                              ) : (
                                filteredSounds.map((sound) => {
                                  const isSelected = soundId === sound.id;
                                  const isFav = favorites.includes(sound.id);
                                  const isPlaying = previewingId === sound.id;

                                  return (
                                    <div
                                      key={sound.id}
                                      onClick={() => {
                                        haptics.light();
                                        setSoundId(sound.id);
                                        let resolvedUrl = undefined;
                                        if (sound.isCustom) {
                                          resolvedUrl = sound.dataUrl;
                                          setCustomDataUrl(sound.dataUrl);
                                        } else {
                                          setCustomDataUrl(undefined);
                                        }
                                        playSelectionPreview(sound.id, resolvedUrl, soundVolume);
                                      }}
                                      className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${
                                        isSelected
                                          ? `bg-${theme.primary}/10 border-${theme.primary}/35 text-${theme.primary} shadow-md shadow-${theme.primary}/5`
                                          : 'hover:bg-white/[0.02] border-transparent text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 max-w-[75%]">
                                        {/* Status selector radio bubble */}
                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                                          isSelected ? `border-${theme.primary}` : 'border-slate-800'
                                        }`}>
                                          {isSelected && (
                                            <motion.div 
                                              layoutId="activeSoundIndicator"
                                              className={`w-2 h-2 rounded-full bg-${theme.primary}`} 
                                            />
                                          )}
                                        </div>

                                        <div className="truncate">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-[11px] font-black tracking-tight text-white">
                                              {sound.name}
                                            </p>
                                            <span className={`text-[8px] border py-0.5 px-1 rounded uppercase tracking-wider shrink-0 ${
                                              sound.isCustom
                                                ? `bg-indigo-500/15 border-indigo-500/30 text-indigo-400`
                                                : `bg-slate-950/40 border-slate-800 text-slate-500`
                                            }`}>
                                              {sound.typeText || 'Loop'}
                                            </span>
                                            {isPlaying && (
                                              <span className={`text-[8px] bg-${theme.primary}/15 border border-${theme.primary}/30 py-0.5 px-1.5 rounded uppercase tracking-wider shrink-0 text-${theme.primary} flex items-center gap-1 font-extrabold`}>
                                                <span className="flex items-end gap-0.5 h-2 w-2">
                                                  <motion.span 
                                                    className="w-0.5 bg-current rounded" 
                                                    animate={{ height: ['20%', '100%', '20%'] }} 
                                                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.1 }}
                                                  />
                                                  <motion.span 
                                                    className="w-0.5 bg-current rounded" 
                                                    animate={{ height: ['40%', '100%', '40%'] }} 
                                                    transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                                                  />
                                                  <motion.span 
                                                    className="w-0.5 bg-current rounded" 
                                                    animate={{ height: ['15%', '100%', '15%'] }} 
                                                    transition={{ repeat: Infinity, duration: 0.7, delay: 0.2 }}
                                                  />
                                                </span>
                                                Playing
                                              </span>
                                            )}
                                            {!sound.isCustom && (
                                              <span className="text-[8px] text-slate-600 font-semibold px-1 rounded bg-black/20">
                                                {sound.category}
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[9px] text-slate-500 truncate mt-1">{sound.description}</p>
                                          
                                          {/* Duration details */}
                                          <span className="text-[8px] text-slate-600 uppercase font-bold tracking-widest mt-1 block">
                                            ⏳ {sound.durationText}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Playback Control Button */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            haptics.medium();
                                            handlePreviewSound(sound.id, sound.dataUrl);
                                          }}
                                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                            isPlaying 
                                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' 
                                              : `bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white border border-${theme.primary}/20 hover:border-${theme.primary}/40`
                                          }`}
                                          title={isPlaying ? 'Stop Preview' : 'Play Preview'}
                                        >
                                          {isPlaying ? <Square className="w-3.5 h-3.5 fill-rose-400" /> : <Play className="w-3.5 h-3.5 fill-slate-400 ml-0.5" />}
                                        </button>

                                        {/* Favorite Toggle Heart */}
                                        {!sound.isCustom && (
                                          <button
                                            type="button"
                                            onClick={(e) => handleToggleFavorite(sound.id, e)}
                                            className={`p-2 rounded-lg hover:bg-white/[0.04] transition-all cursor-pointer ${
                                              isFav ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'
                                            }`}
                                            title={isFav ? 'Remove from Favorites' : 'Add to Favorites'}
                                          >
                                            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 stroke-amber-400' : ''}`} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* FIFTH: VIBRATION PATTERNS */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl`}
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="vibration-section"
                >
                  <div className="flex justify-between items-center px-1">
                    <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Vibration Pattern</span>
                    <span className={`text-[10px] font-bold text-${theme.primary} uppercase tracking-wider`}>
                      {getVibrationLabel(vibrationPattern).replace(/.*?\s/, '')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" id="vibration-profiles-grid">
                    {VIBRATION_PROFILES.map((profile) => {
                      const isActive = vibrationPattern === profile.id;
                      return (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            setVibrationPattern(profile.id);
                            playVibrationOnlyPreview(profile.id, 2500);
                          }}
                          className={`py-3 px-1 flex items-center justify-center rounded-2xl border text-center transition-all cursor-pointer font-black tracking-wide text-xs md:text-[13px] h-11 ${
                            isActive
                              ? `bg-${theme.primary} text-slate-950 border-${theme.primary} shadow-lg`
                              : `bg-black/20 border border-${theme.primary}/10 text-slate-400 hover:border-${theme.primary}/30`
                          }`}
                        >
                          {profile.label.replace(/.*?\s/, '')}
                        </button>
                      );
                    })}
                  </div>

                  {/* Premium Description Information Panel */}
                  <div className="pt-3.5 border-t border-slate-900/40 mt-3.5 space-y-1.5" id="vibration-description-panel">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">VIBRATION DESCRIPTION</span>
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={vibrationPattern}
                          initial={{ opacity: 0, scale: 0.95, y: -2 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 2 }}
                          transition={{ duration: 0.15 }}
                          className={`font-black uppercase tracking-widest text-[10px] text-${theme.primary}`}
                        >
                          {vibrationPattern === 'none' ? 'OFF' : vibrationPattern === 'military' ? 'PULSE' : vibrationPattern === 'energetic' ? 'STRONG' : vibrationPattern.toUpperCase()}
                        </motion.span>
                      </AnimatePresence>
                    </div>
                    
                    <div className="min-h-[20px] flex items-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={vibrationPattern}
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -2 }}
                          transition={{ duration: 0.15 }}
                          className="text-[11px] font-semibold text-slate-400 leading-relaxed"
                        >
                          {VIBRATION_PROFILES.find(p => p.id === vibrationPattern)?.desc || 'No vibration'}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* NEW PREMIUM WAKE-UP VOICE SECTION */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden`}
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="wake-up-voice-section"
                >
                  <div className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 bg-black/25 rounded-xl border border-${theme.primary}/15 text-${theme.primary}/60`}>
                        <Mic className={`w-4.5 h-4.5 text-${theme.primary}`} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-200 block uppercase tracking-wider">Wake-Up Voice</span>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Intelligent offline greetings & playback</span>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        haptics.medium();
                        synth.playSwitch(!wakeVoiceEnabled);
                        setWakeVoiceEnabled(!wakeVoiceEnabled);
                        if (!wakeVoiceEnabled) {
                          setWakeVoiceSectionExpanded(true);
                        }
                      }}
                      className={`w-11 h-6.5 rounded-full p-0.5 transition-all duration-300 relative flex items-center cursor-pointer outline-none ${
                        wakeVoiceEnabled 
                          ? `bg-gradient-to-r ${theme.gradient} border border-${theme.primary}/30` 
                          : `bg-black/30 border border-${theme.primary}/10`
                      }`}
                      id="wake-voice-toggle-btn"
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-slate-950 shadow-md"
                        animate={{ x: wakeVoiceEnabled ? 20 : 0 }}
                      />
                    </button>
                  </div>

                  {/* Header details dropdown handle */}
                  <div 
                    onClick={() => {
                      haptics.tick();
                      setWakeVoiceSectionExpanded(!wakeVoiceSectionExpanded);
                    }}
                    className="flex items-center justify-between px-1.5 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-400 cursor-pointer transition-all border-t border-slate-900/30"
                  >
                    <span>CONFIGURATIONS</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${wakeVoiceSectionExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence initial={false}>
                    {wakeVoiceSectionExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden space-y-5 pt-2"
                      >
                        {/* 1. Voice Source Selector */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Voice Source</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'tts', label: 'Offline Voice', icon: Sparkles },
                              { id: 'upload', label: 'Upload File', icon: Upload },
                              { id: 'record', label: 'Record custom', icon: Mic },
                            ].map((src) => {
                              const isSel = wakeVoiceSource === src.id;
                              const Icon = src.icon;
                              return (
                                <button
                                  key={src.id}
                                  type="button"
                                  onClick={() => {
                                    haptics.medium();
                                    synth.playClick();
                                    setWakeVoiceSource(src.id as any);
                                    stopVoiceFilePreview();
                                    stopTtsPreview();
                                  }}
                                  className={`py-3 px-1 flex flex-col items-center justify-center gap-1.5 rounded-2xl border text-center transition-all cursor-pointer min-h-[70px] ${
                                    isSel
                                      ? `bg-${theme.primary} text-slate-950 border-${theme.primary} shadow-lg font-black`
                                      : `bg-black/20 border border-${theme.primary}/10 text-slate-400 hover:border-${theme.primary}/30`
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="text-[10px] font-black tracking-wide leading-none">{src.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Source Configuration Details */}
                        {wakeVoiceSource === 'tts' && (
                          <div className="space-y-4 bg-black/15 p-4 rounded-2xl border border-slate-900/30">
                            {/* Custom Name */}
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Name Greeting Placeholder ({'{name}'})</label>
                              <input
                                type="text"
                                value={wakeVoiceCustomName}
                                onChange={(e) => {
                                  setWakeVoiceCustomName(e.target.value);
                                  localStorage.setItem('dy_wake_voice_custom_name', e.target.value);
                                }}
                                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500/40"
                                placeholder="Your Name (e.g. Daniel)"
                              />
                            </div>

                            {/* Message editor */}
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Custom Speech Message</label>
                              <textarea
                                value={wakeVoiceTtsMessage}
                                onChange={(e) => setWakeVoiceTtsMessage(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 focus:outline-none focus:border-cyan-500/40 resize-none leading-relaxed"
                                placeholder="Write what the offline system voice should say..."
                              />
                              
                              {/* Placeholder Chips */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block">Placeholder Tap-to-Insert:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    { tag: '{name}', desc: 'Name' },
                                    { tag: '{time}', desc: 'Time' },
                                    { tag: '{date}', desc: 'Date' },
                                    { tag: '{day}', desc: 'Day' },
                                    { tag: '{sleep_duration}', desc: 'Sleep' },
                                    { tag: '{battery}', desc: 'Battery' },
                                  ].map((chip) => (
                                    <button
                                      key={chip.tag}
                                      type="button"
                                      onClick={() => {
                                        setWakeVoiceTtsMessage(prev => prev + ' ' + chip.tag);
                                        haptics.tick();
                                      }}
                                      className="py-1 px-2 text-[9px] font-black rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
                                    >
                                      {chip.tag}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Language & Voice Selector Dropdowns */}
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block flex items-center gap-1">
                                  <Languages className="w-3 h-3" /> Language
                                </label>
                                <select
                                  value={wakeVoiceTtsLanguage}
                                  onChange={(e) => {
                                    setWakeVoiceTtsLanguage(e.target.value);
                                    // Auto-select first voice matching language
                                    const match = availableVoices.find(v => v.lang === e.target.value);
                                    if (match) setWakeVoiceTtsVoiceURI(match.voiceURI);
                                  }}
                                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-2 py-2 text-xs font-semibold text-slate-300 focus:outline-none"
                                >
                                  {availableVoices.length === 0 ? (
                                    <>
                                      <option value="en-US">English (en-US)</option>
                                      <option value="es-ES">Spanish (es-ES)</option>
                                      <option value="fr-FR">French (fr-FR)</option>
                                      <option value="de-DE">German (de-DE)</option>
                                      <option value="ja-JP">Japanese (ja-JP)</option>
                                    </>
                                  ) : (
                                    Array.from(new Set(availableVoices.map(v => v.lang)))
                                      .sort()
                                      .map(lang => (
                                        <option key={lang} value={lang}>{lang}</option>
                                      ))
                                  )}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">System Voice</label>
                                <select
                                  value={wakeVoiceTtsVoiceURI}
                                  onChange={(e) => setWakeVoiceTtsVoiceURI(e.target.value)}
                                  className="w-full bg-slate-950/60 border border-slate-800/80 rounded-xl px-2 py-2 text-xs font-semibold text-slate-300 focus:outline-none"
                                >
                                  {availableVoices.filter(v => v.lang === wakeVoiceTtsLanguage).length === 0 ? (
                                    <option value="">System Default</option>
                                  ) : (
                                    availableVoices
                                      .filter(v => v.lang === wakeVoiceTtsLanguage)
                                      .map(voice => (
                                        <option key={voice.voiceURI} value={voice.voiceURI}>
                                          {voice.name} {voice.localService ? '(Offline)' : ''}
                                        </option>
                                      ))
                                  )}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {wakeVoiceSource === 'upload' && (
                          <div className="space-y-4 bg-black/15 p-4 rounded-2xl border border-slate-900/30">
                            {/* Drag & Drop Area */}
                            {!wakeVoiceAudioDataUrl ? (
                              <div 
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const file = e.dataTransfer.files?.[0];
                                  if (file && file.type.startsWith('audio/')) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => {
                                      const base64 = ev.target?.result as string;
                                      setWakeVoiceAudioDataUrl(base64);
                                      setWakeVoiceAudioName(file.name);
                                      setWakeVoiceAudioCreatedDate(new Date().toLocaleDateString());
                                      const tempAudio = new Audio(base64);
                                      tempAudio.onloadedmetadata = () => {
                                        const d = Math.round(tempAudio.duration * 10) / 10;
                                        setWakeVoiceAudioDuration(d);
                                        setWakeVoiceAudioTrimStart(0);
                                        setWakeVoiceAudioTrimEnd(d);
                                      };
                                    };
                                    reader.readAsDataURL(file);
                                    haptics.success();
                                  } else {
                                    setErrorMessage('Please upload a valid audio file (MP3, WAV, M4A, AAC, OGG).');
                                  }
                                }}
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'audio/*';
                                  input.onchange = (ev) => {
                                    const file = (ev.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        const base64 = e.target?.result as string;
                                        setWakeVoiceAudioDataUrl(base64);
                                        setWakeVoiceAudioName(file.name);
                                        setWakeVoiceAudioCreatedDate(new Date().toLocaleDateString());
                                        const tempAudio = new Audio(base64);
                                        tempAudio.onloadedmetadata = () => {
                                          const d = Math.round(tempAudio.duration * 10) / 10;
                                          setWakeVoiceAudioDuration(d);
                                          setWakeVoiceAudioTrimStart(0);
                                          setWakeVoiceAudioTrimEnd(d);
                                        };
                                      };
                                      reader.readAsDataURL(file);
                                      haptics.success();
                                    }
                                  };
                                  input.click();
                                }}
                                className="border border-dashed border-slate-800 hover:border-slate-700 bg-slate-950/40 p-6 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all text-center"
                              >
                                <Upload className={`w-8 h-8 text-${theme.primary}/60`} />
                                <span className="text-xs font-bold text-slate-300">Drag & drop voice file or click to browse</span>
                                <span className="text-[10px] text-slate-500 font-semibold uppercase">Supports MP3, WAV, M4A, AAC, OGG</span>
                              </div>
                            ) : (
                              /* File detail card & Trimmer */
                              <div className="space-y-4">
                                <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <FileAudio className={`w-5 h-5 text-${theme.primary}`} />
                                    <div>
                                      <p className="text-xs font-bold text-slate-200 truncate max-w-[150px]">{wakeVoiceAudioName}</p>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                        Uploaded {wakeVoiceAudioCreatedDate} • {wakeVoiceAudioDuration}s
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => {
                                      haptics.medium();
                                      stopVoiceFilePreview();
                                      setWakeVoiceAudioDataUrl(undefined);
                                      setWakeVoiceAudioName(undefined);
                                      setWakeVoiceAudioDuration(0);
                                      setWakeVoiceAudioTrimStart(0);
                                      setWakeVoiceAudioTrimEnd(0);
                                    }}
                                    className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Lightweight Trimming Tool */}
                                <div className="space-y-3 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900/40">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span className="flex items-center gap-1"><Scissors className="w-3.5 h-3.5 text-cyan-400" /> VOICE TRIMMER</span>
                                    <span className="font-mono text-slate-300">
                                      {wakeVoiceAudioTrimStart.toFixed(1)}s - {wakeVoiceAudioTrimEnd.toFixed(1)}s (Duration: {(wakeVoiceAudioTrimEnd - wakeVoiceAudioTrimStart).toFixed(1)}s)
                                    </span>
                                  </div>

                                  {/* Custom Waveform Representation */}
                                  <div className="h-10 flex items-end gap-0.5 justify-center px-1 bg-slate-950/80 rounded-lg relative overflow-hidden">
                                    {[20, 45, 60, 30, 15, 40, 75, 90, 65, 30, 20, 45, 70, 85, 95, 60, 20, 35, 55, 80, 50, 25, 45, 65, 40, 15, 30, 50, 25, 10].map((h, idx) => {
                                      const barPct = idx / 30;
                                      const isTrimmedActive = 
                                        barPct >= (wakeVoiceAudioTrimStart / (wakeVoiceAudioDuration || 1)) &&
                                        barPct <= (wakeVoiceAudioTrimEnd / (wakeVoiceAudioDuration || 1));
                                      return (
                                        <div 
                                          key={idx}
                                          style={{ height: `${h}%` }}
                                          className={`w-full rounded-t transition-colors ${
                                            isTrimmedActive ? `bg-${theme.primary}` : 'bg-slate-800'
                                          }`}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Sliders */}
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[8px] font-black tracking-wider text-slate-500 uppercase">
                                        <span>Start Trim</span>
                                        <span>{wakeVoiceAudioTrimStart.toFixed(1)}s</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max={wakeVoiceAudioTrimEnd}
                                        step="0.1"
                                        value={wakeVoiceAudioTrimStart}
                                        onChange={(e) => {
                                          setWakeVoiceAudioTrimStart(parseFloat(e.target.value));
                                          haptics.tick();
                                        }}
                                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[8px] font-black tracking-wider text-slate-500 uppercase">
                                        <span>End Trim</span>
                                        <span>{wakeVoiceAudioTrimEnd.toFixed(1)}s</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={wakeVoiceAudioTrimStart}
                                        max={wakeVoiceAudioDuration || 10}
                                        step="0.1"
                                        value={wakeVoiceAudioTrimEnd}
                                        onChange={(e) => {
                                          setWakeVoiceAudioTrimEnd(parseFloat(e.target.value));
                                          haptics.tick();
                                        }}
                                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {wakeVoiceSource === 'record' && (
                          <div className="space-y-4 bg-black/15 p-4 rounded-2xl border border-slate-900/30">
                            {/* Recording Controls */}
                            {!isRecording && !wakeVoiceAudioDataUrl ? (
                              <div className="flex flex-col items-center justify-center py-6 gap-3 border border-dashed border-slate-800 bg-slate-950/40 rounded-2xl text-center">
                                <button
                                  type="button"
                                  onClick={startRecording}
                                  className="w-12 h-12 bg-red-600/20 hover:bg-red-600/35 border border-red-500/40 hover:border-red-500/60 rounded-full flex items-center justify-center shadow-lg hover:shadow-red-500/5 transition-all cursor-pointer group"
                                >
                                  <div className="w-5 h-5 bg-red-500 rounded-full group-hover:scale-110 transition-transform" />
                                </button>
                                <div>
                                  <p className="text-xs font-bold text-slate-300">Record custom offline voice</p>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Microphone active locally only</p>
                                </div>
                              </div>
                            ) : isRecording ? (
                              <div className="flex flex-col items-center justify-center py-6 gap-3 border border-red-500/20 bg-red-950/10 rounded-2xl text-center">
                                <motion.div 
                                  animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                  className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white"
                                >
                                  <Mic className="w-5 h-5" />
                                </motion.div>
                                <div>
                                  <p className="text-xs font-black text-red-400 uppercase tracking-widest font-mono">RECORDING... {recordingDuration}s</p>
                                  <p className="text-[9px] text-slate-500 font-semibold uppercase">Speak clearly into microphone</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={stopRecording}
                                  className="mt-1 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Square className="w-3 h-3 text-red-500 fill-red-500" /> Stop recording
                                </button>
                              </div>
                            ) : (
                              /* Recorded File detail and trimmer */
                              <div className="space-y-4">
                                <div className="flex items-center justify-between bg-slate-950/70 p-3 rounded-xl border border-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <Mic className="w-5 h-5 text-red-400" />
                                    <div>
                                      <p className="text-xs font-bold text-slate-200">Custom Recording</p>
                                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                        Created {wakeVoiceAudioCreatedDate} • {wakeVoiceAudioDuration}s
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={startRecording}
                                      className="p-1.5 hover:bg-slate-900 text-slate-500 hover:text-slate-300 rounded-lg transition-all cursor-pointer"
                                      title="Record New"
                                    >
                                      <Mic className="w-4 h-4 text-slate-400" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        haptics.medium();
                                        stopVoiceFilePreview();
                                        setWakeVoiceAudioDataUrl(undefined);
                                        setWakeVoiceAudioName(undefined);
                                        setWakeVoiceAudioDuration(0);
                                        setWakeVoiceAudioTrimStart(0);
                                        setWakeVoiceAudioTrimEnd(0);
                                      }}
                                      className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Visual Trimmer */}
                                <div className="space-y-3 bg-slate-950/30 p-3.5 rounded-xl border border-slate-900/40">
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                    <span className="flex items-center gap-1"><Scissors className="w-3.5 h-3.5 text-cyan-400" /> VOICE TRIMMER</span>
                                    <span className="font-mono text-slate-300">
                                      {wakeVoiceAudioTrimStart.toFixed(1)}s - {wakeVoiceAudioTrimEnd.toFixed(1)}s (Duration: {(wakeVoiceAudioTrimEnd - wakeVoiceAudioTrimStart).toFixed(1)}s)
                                    </span>
                                  </div>

                                  {/* Waveform Peaks */}
                                  <div className="h-10 flex items-end gap-0.5 justify-center px-1 bg-slate-950/80 rounded-lg relative overflow-hidden">
                                    {[20, 45, 60, 30, 15, 40, 75, 90, 65, 30, 20, 45, 70, 85, 95, 60, 20, 35, 55, 80, 50, 25, 45, 65, 40, 15, 30, 50, 25, 10].map((h, idx) => {
                                      const barPct = idx / 30;
                                      const isTrimmedActive = 
                                        barPct >= (wakeVoiceAudioTrimStart / (wakeVoiceAudioDuration || 1)) &&
                                        barPct <= (wakeVoiceAudioTrimEnd / (wakeVoiceAudioDuration || 1));
                                      return (
                                        <div 
                                          key={idx}
                                          style={{ height: `${h}%` }}
                                          className={`w-full rounded-t transition-colors ${
                                            isTrimmedActive ? `bg-${theme.primary}` : 'bg-slate-800'
                                          }`}
                                        />
                                      );
                                    })}
                                  </div>

                                  {/* Sliders */}
                                  <div className="space-y-2">
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[8px] font-black tracking-wider text-slate-500 uppercase">
                                        <span>Start Trim</span>
                                        <span>{wakeVoiceAudioTrimStart.toFixed(1)}s</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="0"
                                        max={wakeVoiceAudioTrimEnd}
                                        step="0.1"
                                        value={wakeVoiceAudioTrimStart}
                                        onChange={(e) => {
                                          setWakeVoiceAudioTrimStart(parseFloat(e.target.value));
                                          haptics.tick();
                                        }}
                                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex justify-between text-[8px] font-black tracking-wider text-slate-500 uppercase">
                                        <span>End Trim</span>
                                        <span>{wakeVoiceAudioTrimEnd.toFixed(1)}s</span>
                                      </div>
                                      <input
                                        type="range"
                                        min={wakeVoiceAudioTrimStart}
                                        max={wakeVoiceAudioDuration || 10}
                                        step="0.1"
                                        value={wakeVoiceAudioTrimEnd}
                                        onChange={(e) => {
                                          setWakeVoiceAudioTrimEnd(parseFloat(e.target.value));
                                          haptics.tick();
                                        }}
                                        className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. Voice Volume Selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Voice Volume</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {[
                              { id: 'same', label: 'Same as Alarm' },
                              { id: 'lower', label: 'Lower than Alarm' },
                              { id: 'higher', label: 'Higher than Alarm' },
                              { id: 'custom', label: 'Custom' },
                            ].map((volMode) => {
                              const isSel = wakeVoiceVolumeMode === volMode.id;
                              return (
                                <button
                                  key={volMode.id}
                                  type="button"
                                  onClick={() => {
                                    haptics.medium();
                                    synth.playClick();
                                    setWakeVoiceVolumeMode(volMode.id as any);
                                  }}
                                  className={`py-2 px-1 rounded-xl border text-[10px] font-black tracking-tight text-center cursor-pointer transition-all ${
                                    isSel
                                      ? `bg-${theme.primary} text-slate-950 border-${theme.primary} shadow-md`
                                      : `bg-black/15 border border-${theme.primary}/10 text-slate-400 hover:border-${theme.primary}/20`
                                  }`}
                                >
                                  {volMode.label}
                                </button>
                              );
                            })}
                          </div>

                          {wakeVoiceVolumeMode === 'custom' && (
                            <div className="pt-2 flex items-center gap-3">
                              <Volume className="w-4 h-4 text-slate-500" />
                              <input
                                type="range"
                                min="10"
                                max="100"
                                value={wakeVoiceCustomVolume}
                                onChange={(e) => {
                                  setWakeVoiceCustomVolume(parseInt(e.target.value));
                                  haptics.tick();
                                }}
                                className="flex-1 h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                              />
                              <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono w-8 text-right">
                                {wakeVoiceCustomVolume}%
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 4. Voice Playback Mode Selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Playback Mode</label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {[
                              { id: 'alarm-then-voice', label: 'Alarm → Voice' },
                              { id: 'voice-then-alarm', label: 'Voice → Alarm' },
                              { id: 'voice-only', label: 'Voice Only' },
                              { id: 'alarm-only', label: 'Alarm Only' },
                            ].map((pMode) => {
                              const isSel = wakeVoicePlaybackMode === pMode.id;
                              return (
                                <button
                                  key={pMode.id}
                                  type="button"
                                  onClick={() => {
                                    haptics.medium();
                                    synth.playClick();
                                    setWakeVoicePlaybackMode(pMode.id as any);
                                  }}
                                  className={`py-2 px-1 rounded-xl border text-[10px] font-black tracking-tight text-center cursor-pointer transition-all ${
                                    isSel
                                      ? `bg-${theme.primary} text-slate-950 border-${theme.primary} shadow-md`
                                      : `bg-black/15 border border-${theme.primary}/10 text-slate-400 hover:border-${theme.primary}/20`
                                  }`}
                                >
                                  {pMode.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 5. Live Preview Control Button */}
                        <div className="pt-2">
                          {wakeVoiceSource === 'tts' ? (
                            isPlayingTtsPreview ? (
                              <button
                                type="button"
                                onClick={stopTtsPreview}
                                className="w-full py-3.5 bg-red-600/15 border border-red-500/30 text-red-400 hover:text-red-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-98 transition-all"
                              >
                                <Square className="w-3.5 h-3.5 fill-red-400" /> Stop Speech Voice Preview
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={playTtsPreview}
                                className={`w-full py-3.5 bg-${theme.primary} hover:bg-${theme.primary}/90 text-slate-950 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-98 transition-all shadow-lg`}
                              >
                                <Play className="w-3.5 h-3.5 fill-slate-950" /> Preview Offline Speech Voice
                              </button>
                            )
                          ) : (
                            wakeVoiceAudioDataUrl ? (
                              isPlayingVoicePreview ? (
                                <button
                                  type="button"
                                  onClick={stopVoiceFilePreview}
                                  className="w-full py-3.5 bg-red-600/15 border border-red-500/30 text-red-400 hover:text-red-300 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-98 transition-all"
                                >
                                  <Square className="w-3.5 h-3.5 fill-red-400" /> Stop Audio File Preview
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => playVoiceFilePreview(wakeVoiceAudioDataUrl, wakeVoiceAudioTrimStart, wakeVoiceAudioTrimEnd)}
                                  className={`w-full py-3.5 bg-${theme.primary} hover:bg-${theme.primary}/90 text-slate-950 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-98 transition-all shadow-lg`}
                                >
                                  <Play className="w-3.5 h-3.5 fill-slate-950" /> Preview Trimmed Audio File
                                </button>
                              )
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="w-full py-3.5 bg-black/25 border border-slate-900 text-slate-500 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider cursor-not-allowed opacity-60"
                              >
                                No voice file loaded to preview
                              </button>
                            )
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* SIXTH: SNOOZE OPTION SWITCH */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl`}
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="snooze-toggle-section"
                >
                  <div className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 bg-black/25 rounded-xl border border-${theme.primary}/15 text-${theme.primary}/60`}>
                        <Clock className={`w-4.5 h-4.5 text-${theme.primary}`} />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-200 block uppercase tracking-wider">Interval Snooze</span>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">Repeats every 9 min</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        haptics.medium();
                        synth.playClick();
                        setSnoozeEnabled(!snoozeEnabled);
                      }}
                      className={`w-11 h-6.5 rounded-full p-0.5 transition-all duration-300 relative flex items-center cursor-pointer outline-none ${
                        snoozeEnabled 
                          ? `bg-gradient-to-r ${theme.gradient} border border-${theme.primary}/30` 
                          : `bg-black/30 border border-${theme.primary}/10`
                      }`}
                      id="snooze-toggle-btn"
                    >
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        className="w-5 h-5 rounded-full bg-slate-950 shadow-md"
                        animate={{ x: snoozeEnabled ? 20 : 0 }}
                      />
                    </button>
                  </div>
                </div>

                {/* SMART SLEEP ASSISTANT SECTION */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-5 shadow-xl relative overflow-hidden`}
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="sleep-assistant-section"
                >
                  {/* Glowing background accent */}
                  <div className="absolute top-[-15%] right-[-10%] w-[120px] h-[120px] rounded-full bg-indigo-500/10 blur-[40px] pointer-events-none" />

                  {/* Header row */}
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.04]">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-indigo-950/40 border border-indigo-900/30 text-indigo-400">
                        <Moon className="w-4.5 h-4.5 animate-pulse" />
                      </span>
                      <div>
                        <h3 className="text-xs font-black tracking-wider text-white uppercase flex items-center gap-1.5">
                          Smart Sleep Assistant
                        </h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Circadian Cycle Calculator</p>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        haptics.light();
                        synth.playClick();
                        setShowSleepPrefModal(true);
                      }}
                      className={`text-[10px] font-black uppercase text-indigo-400 hover:text-white bg-indigo-950/40 px-2.5 py-1.5 rounded-xl border border-indigo-900/30 transition-all cursor-pointer flex items-center gap-1`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Preferences</span>
                    </button>
                  </div>

                  {/* Recommended Bedtimes Cards */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase px-1">Recommended Bedtimes</span>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      {/* CARD 1 */}
                      <div 
                        className={`p-3.5 rounded-2xl bg-black/20 border border-emerald-500/20 shadow-xl flex items-center justify-between transition-all hover:border-emerald-500/40`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-center text-emerald-400">
                            <Sparkles className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">Optimal</span>
                              <span className="text-[10px] text-amber-500 font-extrabold tracking-wide">★★★★★</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">Sleep Duration: {preferredSleepDuration} Hours</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">GO TO BED AT</p>
                          <p className="text-sm font-black text-white tabular-nums">{option1.formatted}</p>
                        </div>
                      </div>

                      {/* CARD 2 */}
                      <div 
                        className={`p-3.5 rounded-2xl bg-black/20 border border-indigo-500/10 shadow-xl flex items-center justify-between transition-all hover:border-indigo-500/35`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
                            <Moon className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-900/40">Ideal</span>
                              <span className="text-[10px] text-amber-500 font-extrabold tracking-wide">★★★★</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">Sleep Duration: {preferredSleepDuration - 0.5} Hours</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">GO TO BED AT</p>
                          <p className="text-sm font-black text-white tabular-nums">{option2.formatted}</p>
                        </div>
                      </div>

                      {/* CARD 3 */}
                      <div 
                        className={`p-3.5 rounded-2xl bg-black/20 border border-white/[0.04] shadow-xl flex items-center justify-between transition-all hover:border-white/[0.1]`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-center text-slate-400">
                            <Clock className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-900/50 px-1.5 py-0.5 rounded border border-slate-800">Minimum</span>
                              <span className="text-[10px] text-amber-500 font-extrabold tracking-wide">★★★</span>
                            </div>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wide">Sleep Duration: {preferredSleepDuration - 1.0} Hours</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">GO TO BED AT</p>
                          <p className="text-sm font-black text-white tabular-nums">{option3.formatted}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sleep Summary */}
                  <div className="pt-2 bg-black/15 p-4 rounded-2xl border border-white/[0.03] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 text-xs">💤</span>
                      <span className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Sleep Summary</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Alarm Time</span>
                        <span className="font-extrabold text-white">{formatAlarmTime(time, settings.timeFormat)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Recommended Bedtime</span>
                        <span className="font-extrabold text-indigo-300">{option1.formatted}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Sleep Duration</span>
                        <span className="font-extrabold text-white">{preferredSleepDuration} Hours</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wide">Time Until Bed</span>
                        <span className="font-extrabold text-emerald-400 tabular-nums">{getCountdownString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SEVENTH: BEDTIME REMINDER OVERRIDE */}
                <div 
                  className={`border ${theme.border} p-5 sm:p-6 rounded-3xl space-y-4 shadow-xl`}
                  style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  id="bedtime-reminder-override-section"
                >
                  <div className="flex items-center justify-between p-1">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 bg-black/25 rounded-xl border border-${theme.primary}/15 text-purple-400`}>
                        <Moon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-200 block uppercase tracking-wider">Bedtime Reminder</span>
                        <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wide">
                          {bedtimeReminderMode === 'global' ? 'Global Default Settings' : bedtimeReminderMode === 'disabled' ? 'Disabled for this alarm' : `Custom (${bedtimeSleepGoalHours}h Goal)`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1" id="bedtime-reminder-mode-buttons">
                    {[
                      { id: 'global', label: 'Global' },
                      { id: 'custom', label: 'Custom' },
                      { id: 'disabled', label: 'Disabled' },
                    ].map((mode) => {
                      const isSel = bedtimeReminderMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            haptics.medium();
                            synth.playClick();
                            setBedtimeReminderMode(mode.id as any);
                          }}
                          className={`py-2.5 px-2 rounded-xl border text-[10px] font-black tracking-tight text-center cursor-pointer transition-all ${
                            isSel
                              ? `bg-purple-500/20 text-purple-300 border-purple-400 shadow-md`
                              : `bg-black/15 border border-slate-800 text-slate-400 hover:text-slate-200`
                          }`}
                        >
                          {mode.label}
                        </button>
                      );
                    })}
                  </div>

                  {bedtimeReminderMode === 'custom' && (
                    <div className="space-y-2 pt-2 border-t border-slate-900/40">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Custom Sleep Goal for this alarm
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[6, 7, 8, 9].map((hours) => (
                          <button
                            key={hours}
                            type="button"
                            onClick={() => {
                              haptics.tick();
                              synth.playClick();
                              setBedtimeSleepGoalHours(hours);
                            }}
                            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                              bedtimeSleepGoalHours === hours
                                ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                                : 'bg-black/20 border-slate-900 text-slate-400 hover:text-white'
                            }`}
                          >
                            {hours}h Goal
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* EIGHTH: BOTTOM ACTION BUTTONS ROW FOR ERGONOMICS */}
                <div className="grid grid-cols-2 gap-4 pt-4" id="bottom-form-actions">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-4 rounded-2xl text-xs font-black bg-black/25 hover:bg-black/40 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer text-center"
                  >
                    Cancel & Discard
                  </button>
                  <button
                    type="submit"
                    className={`py-4 rounded-2xl text-xs font-black bg-gradient-to-r ${theme.gradient} text-slate-950 shadow-xl shadow-${theme.primary}/10 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer text-center`}
                  >
                    Save Awakening
                  </button>
                </div>

              </div>

            </form>

            {/* Sleep Preference Modal */}
            <AnimatePresence>
              {showSleepPrefModal && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 28 }}
                    transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
                    className="w-full max-w-sm rounded-3xl border border-indigo-500/20 p-6 space-y-6 shadow-2xl relative overflow-hidden"
                    style={{ backgroundColor: getOpaqueCardBgColor(theme.id) }}
                  >
                    {/* Decorative Glow */}
                    <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] rounded-full bg-indigo-500/20 blur-[30px] pointer-events-none" />

                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-400 animate-pulse" /> Sleep Preferences
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowSleepPrefModal(false)}
                        className="text-[10px] font-black text-slate-500 hover:text-white uppercase transition-colors"
                      >
                        Close
                      </button>
                    </div>

                    {/* Preset buttons */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Preferred Sleep Duration</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[6, 6.5, 7, 7.5, 8, 8.5, 9].map((val) => {
                          const isSelected = preferredSleepDuration === val;
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => {
                                haptics.success();
                                synth.playSuccessSound();
                                setPreferredSleepDuration(val);
                                localStorage.setItem('dy_preferred_sleep_duration', String(val));
                              }}
                              className={`py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${
                                isSelected
                                  ? `bg-indigo-600 border-indigo-500 text-white shadow-lg`
                                  : 'bg-black/25 text-slate-400 border-white/[0.04] hover:border-white/[0.1] hover:text-white'
                              }`}
                            >
                              {val}h
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => {
                            haptics.light();
                            synth.playClick();
                          }}
                          className={`py-2 rounded-xl text-[10px] font-black transition-all border cursor-pointer ${
                            ![6, 6.5, 7, 7.5, 8, 8.5, 9].includes(preferredSleepDuration)
                              ? `bg-indigo-600 border-indigo-500 text-white shadow-lg`
                              : 'bg-black/25 text-slate-400 border-white/[0.04]'
                          }`}
                        >
                          Custom
                        </button>
                      </div>
                    </div>

                    {/* Custom Range Slider */}
                    <div className="space-y-3 bg-black/15 p-4 rounded-2xl border border-white/[0.03]">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                          Custom Sleep Duration
                        </label>
                        <span className="text-xs font-black text-indigo-400">{preferredSleepDuration} Hours</span>
                      </div>
                      <input
                        type="range"
                        min="4"
                        max="12"
                        step="0.1"
                        value={preferredSleepDuration}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setPreferredSleepDuration(val);
                          localStorage.setItem('dy_preferred_sleep_duration', String(val));
                          haptics.tick();
                        }}
                        className="w-full h-1 bg-black rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                      />
                      <div className="flex justify-between text-[8px] text-slate-600 font-bold uppercase">
                        <span>4 Hours</span>
                        <span>Ideal Sleep Range (7h - 9h)</span>
                        <span>12 Hours</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        haptics.success();
                        synth.playSuccessSound();
                        setShowSleepPrefModal(false);
                      }}
                      className={`w-full py-3.5 rounded-2xl text-xs font-black bg-indigo-600 text-white border border-indigo-500 hover:opacity-95 active:scale-98 transition-all cursor-pointer text-center uppercase tracking-wider`}
                    >
                      Apply Preferences
                    </button>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Alarms List */}
      <div className="space-y-3" id="alarms-list-container">
        {alarms.length === 0 ? (
          <div className={`p-10 text-center rounded-2xl ${theme.cardBg} border ${theme.border} space-y-3`} id="empty-alarms-view">
            <div className="w-12 h-12 bg-black/40 border border-slate-900 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Bell className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">No alarms set</p>
              <p className="text-xs text-slate-500 mt-0.5">Click the "Add Alarm" button to set your first smart alarm.</p>
            </div>
          </div>
        ) : (
          alarms.map((alarm) => {
            const hasRepeat = alarm.repeatDays.length > 0;
            return (
              <motion.div
                key={alarm.id}
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
                className={`p-4 sm:p-5 rounded-2xl ${theme.cardBg} border ${
                  alarm.enabled ? `border-${theme.primary}/25` : theme.border
                } hover:border-${theme.primary}/40 flex items-center justify-between group cursor-pointer`}
                id={`alarm-card-${alarm.id}`}
              >
                {/* Alarm Information & Click To Edit */}
                <div 
                  onClick={() => handleStartEdit(alarm)}
                  className="flex items-center gap-4 max-w-[70%] flex-1 cursor-pointer"
                  title="Click to edit alarm settings"
                >
                  {/* Status Circle Indicator */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation(); // Avoid triggering card edit mode!
                      haptics.medium();
                      synth.playSwitch(!alarm.enabled);
                      onToggleAlarm(alarm.id);
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                      alarm.enabled 
                        ? `bg-${theme.primary}/10 border border-${theme.primary}/30 text-${theme.primary}` 
                        : 'bg-black/45 border border-slate-800 text-slate-500'
                    }`}
                    id={`alarm-status-icon-${alarm.id}`}
                  >
                    <Bell className="w-4.5 h-4.5" />
                  </div>

                  {/* Alarm Details */}
                  <div className="truncate">
                    <div className="flex items-baseline gap-2.5 truncate">
                      <span className={`text-2xl font-bold tracking-tight font-mono ${alarm.enabled ? 'text-white' : 'text-slate-500'}`}>
                        {formatAlarmTime(alarm.time, settings.timeFormat)}
                      </span>
                      <span className={`text-xs font-semibold truncate ${alarm.enabled ? 'text-slate-300' : 'text-slate-500'}`}>
                        {alarm.label}
                      </span>
                      <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5 self-center" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {/* Repeat days text */}
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {hasRepeat
                          ? alarm.repeatDays.map((d) => DAYS_SHORT[d]).join(', ')
                          : 'Once'}
                      </span>

                      {/* Selected Sound Tag */}
                      <span className={`text-[10px] font-bold flex items-center gap-1 py-0.5 px-2 rounded-md ${
                        alarm.enabled ? 'bg-black/35 text-slate-300 border border-slate-800' : 'bg-black/20 text-slate-600'
                      }`}>
                        <Music className={`w-2.5 h-2.5 text-${theme.primary}`} /> {getSoundName(alarm.soundId)}
                      </span>

                      {/* Volume & Gradual Up Tag */}
                      <span className={`text-[10px] font-bold flex items-center gap-1 py-0.5 px-2 rounded-md ${
                        alarm.enabled ? 'bg-black/35 text-slate-300 border border-slate-800' : 'bg-black/20 text-slate-600'
                      }`}>
                        <Volume2 className="w-2.5 h-2.5 text-indigo-400" /> {alarm.soundVolume ?? 80}% {alarm.gradualUp ? '📈' : ''}
                      </span>

                      {/* Vibration Profile Tag */}
                      <span className={`text-[10px] font-bold flex items-center gap-1 py-0.5 px-2 rounded-md ${
                        alarm.enabled ? 'bg-black/35 text-slate-300 border border-slate-800' : 'bg-black/20 text-slate-600'
                      }`}>
                        {getVibrationLabel(alarm.vibrationPattern)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alarm Enable Toggle and Action Buttons Column */}
                <div className="flex items-center gap-3">
                  {/* iOS Style Custom Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      haptics.medium();
                      synth.playSwitch(!alarm.enabled);
                      onToggleAlarm(alarm.id);
                    }}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-all duration-300 ${
                      alarm.enabled ? `bg-${theme.primary}` : 'bg-slate-800'
                    }`}
                    id={`alarm-toggle-${alarm.id}`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-full bg-slate-950 shadow-md transform transition-all duration-300 ${
                        alarm.enabled ? 'translate-x-5.5' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Actions Column: Save as Template Icon directly ABOVE Delete Button */}
                  <div className="flex flex-col items-center gap-1.5">
                    {/* Small Save as Template Icon Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUseAsTemplate(alarm);
                      }}
                      className="p-1.5 rounded-lg bg-black/60 border border-slate-900 text-slate-500 hover:text-cyan-400 hover:border-cyan-900/50 hover:bg-cyan-950/30 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Save as Template"
                      id={`alarm-template-btn-${alarm.id}`}
                    >
                      <Save className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        haptics.heavy();
                        synth.playDelete();
                        onDeleteAlarm(alarm.id);
                      }}
                      className="p-2.5 rounded-xl bg-black border border-slate-900 text-slate-500 hover:text-red-400 hover:border-red-950/50 hover:bg-red-950/20 active:scale-90 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Delete Alarm"
                      id={`alarm-delete-btn-${alarm.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
            id="alarm-tab-error-toast"
          >
            <div className="bg-slate-900/95 border border-red-500/50 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md pointer-events-auto">
              <div className="p-1.5 rounded-lg bg-red-950/50 border border-red-500/30 text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-red-400">System Safeguard</p>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium">{errorMessage}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
