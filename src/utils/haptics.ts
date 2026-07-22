/**
 * Offline-friendly safe Haptic feedback engine using the Web Vibration API.
 */
export const HAPTIC_PATTERNS = {
  // Light single tap - perfect for standard navigation, minor toggles
  light: 15,
  
  // Medium click - perfect for important actions like saving, start timers, adding alarms
  medium: 30,
  
  // Heavy strike - perfect for resets, triggers, or dismisses
  heavy: 60,
  
  // Subtle micro-tick - perfect for stopwatches and fast counting dials
  tick: 5,
  
  // High-success pulse chord
  success: [40, 60, 40],
  
  // Warning/Error double buzz
  error: [60, 50, 120],
  
  // Custom double pulse for repeating alarm clicks
  pulse: [80, 80],

  // --- Expanded Alert & Notification Patterns ---

  // Short, crisp tap for general notifications & toast banners
  generalNotification: [20, 50, 20],

  // Extended long haptics with repeated heavy pulses for critical alarms
  criticalAlarm: [500, 100, 500, 100, 800, 150, 1000],

  // Rapid high-energy warning triple-burst for system alerts
  urgentAlert: [150, 50, 150, 50, 200],

  // Soft, smooth double pulse for gentle reminders and bedtime prompts
  gentleReminder: [35, 90, 35],

  // Energetic celebratory rhythm for timer completions
  timerFinished: [100, 60, 100, 60, 300],

  // Distinct double drop for snoozing an active alarm
  snoozeAck: [60, 120, 40],
};

class HapticEngine {
  private isEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dy_haptics_enabled');
      const hasVibrator = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
      if (stored !== null) {
        this.isEnabled = (stored === 'true') && hasVibrator;
      } else {
        this.isEnabled = hasVibrator;
      }
    }
  }

  setHapticsEnabled(enabled: boolean) {
    const hasVibrator = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
    this.isEnabled = enabled && hasVibrator;
    localStorage.setItem('dy_haptics_enabled', enabled ? 'true' : 'false');
  }

  isHapticsEnabled() {
    return this.isEnabled;
  }

  // Trigger a custom vibration pattern
  vibrate(pattern: keyof typeof HAPTIC_PATTERNS | number | number[]) {
    if (!this.isEnabled) return;
    try {
      if (typeof pattern === 'string') {
        const preconfigured = HAPTIC_PATTERNS[pattern as keyof typeof HAPTIC_PATTERNS];
        navigator.vibrate(preconfigured);
      } else {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Haptic feedback blocked by browser sandbox or failed to execute:', e);
    }
  }

  // Specific high-level semantic triggers
  light() {
    this.vibrate('light');
  }

  medium() {
    this.vibrate('medium');
  }

  heavy() {
    this.vibrate('heavy');
  }

  tick() {
    this.vibrate('tick');
  }

  success() {
    this.vibrate('success');
  }

  error() {
    this.vibrate('error');
  }

  pulse() {
    this.vibrate('pulse');
  }

  // --- Semantic Alert & Notification Methods ---

  // Short tap for general notifications & toast banners
  generalNotification() {
    this.vibrate('generalNotification');
  }

  notification() {
    this.vibrate('generalNotification');
  }

  // Extended long haptics for critical alarms
  criticalAlarm() {
    this.vibrate('criticalAlarm');
  }

  alarmCritical() {
    this.vibrate('criticalAlarm');
  }

  // Rapid high-energy warning triple-burst for system alerts
  urgentAlert() {
    this.vibrate('urgentAlert');
  }

  // Soft double pulse for gentle reminders
  gentleReminder() {
    this.vibrate('gentleReminder');
  }

  // Energetic celebratory rhythm for timer completion
  timerFinished() {
    this.vibrate('timerFinished');
  }

  // Double drop for snoozing an active alarm
  snoozeAck() {
    this.vibrate('snoozeAck');
  }
}

export const haptics = new HapticEngine();
export default haptics;
