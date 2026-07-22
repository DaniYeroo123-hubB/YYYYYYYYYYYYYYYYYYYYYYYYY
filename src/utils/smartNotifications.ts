import { Alarm } from '../types';

export interface SmartNotificationsConfig {
  enabled: boolean;
  noAlarmTomorrow: boolean;
  longRunningTimer: boolean;
  silentModeReminder: boolean;
  systemNotificationsEnabled: boolean;
  noAlarmTomorrowSound: boolean;
  longRunningTimerSound: boolean;
  silentModeReminderSound: boolean;
  muteAllNotifications?: boolean;
  bedtimeReminderSound?: boolean;
}

export interface SmartNotificationAction {
  label: string;
  actionKey: 'create_alarm' | 'open_timer' | 'open_alarm_settings' | 'dismiss' | 'sleep_now' | 'view_alarm';
  primary?: boolean;
}

export interface SmartNotificationPayload {
  id: string;
  title: string;
  messages: string[];
  actions: SmartNotificationAction[];
  type: 'no_alarm' | 'long_timer' | 'silent_mode' | 'bedtime' | 'combined';
  timestamp: number;
}

export interface ActiveTimerInfo {
  isRunning: boolean;
  startTime: number | null;
  sessionId: string | null;
}

/**
 * Request OS/Browser system notification permissions
 */
export async function requestSystemNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      } catch (e) {
        console.warn('System Notification request permission error:', e);
      }
    }
  }
  return false;
}

/**
 * Dispatch a native browser/OS system notification
 */
export function sendSystemNotification(title: string, bodyText: string) {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: bodyText,
          icon: '/favicon.ico',
          tag: 'dy-clock-smart-notification',
        });
      } catch (e) {
        console.warn('System Notification dispatch error:', e);
      }
    }
  }
}

/**
 * Format a YYYY-MM-DD date string
 */
function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Main evaluation function for Smart Notifications
 */
export function checkSmartNotifications(params: {
  config: SmartNotificationsConfig;
  alarms: Alarm[];
  timerInfo: ActiveTimerInfo;
  soundEnabled: boolean;
  currentDate: Date;
  activeTimezone: string;
}): SmartNotificationPayload | null {
  const { config, alarms, timerInfo, soundEnabled, currentDate } = params;

  // Master switch check
  if (!config || !config.enabled) {
    return null;
  }

  const triggeredMessages: { type: 'no_alarm' | 'long_timer' | 'silent_mode'; text: string }[] = [];

  // 1. CHECK: NO ALARM TOMORROW
  if (config.noAlarmTomorrow) {
    const tomorrowDate = new Date(currentDate.getTime() + 86400000); // +24h
    const tomorrowDayOfWeek = tomorrowDate.getDay(); // 0..6
    const tomorrowKey = formatDateKey(tomorrowDate);

    // Check if any enabled alarm applies to tomorrow
    const hasAlarmTomorrow = alarms.some((alarm) => {
      if (!alarm.enabled) return false;
      if (alarm.repeatDays.length > 0) {
        return alarm.repeatDays.includes(tomorrowDayOfWeek);
      }
      // One-time enabled alarm is active for upcoming period
      return true;
    });

    if (!hasAlarmTomorrow) {
      const lastNoAlarmDate = localStorage.getItem('dy_sn_last_no_alarm_date');
      if (lastNoAlarmDate !== tomorrowKey) {
        triggeredMessages.push({
          type: 'no_alarm',
          text: 'No alarm is set for tomorrow.',
        });
      }
    }
  }

  // 2. CHECK: LONG RUNNING TIMER (2 hours = 7200 seconds)
  if (config.longRunningTimer && timerInfo.isRunning && timerInfo.startTime && timerInfo.sessionId) {
    const elapsedSeconds = Math.floor((currentDate.getTime() - timerInfo.startTime) / 1000);
    if (elapsedSeconds >= 7200) {
      const lastNotifiedSession = localStorage.getItem('dy_sn_last_long_timer_session');
      if (lastNotifiedSession !== timerInfo.sessionId) {
        triggeredMessages.push({
          type: 'long_timer',
          text: 'Your timer has been running for 2 hours.',
        });
      }
    }
  }

  // 3. CHECK: SILENT MODE REMINDER
  if (config.silentModeReminder) {
    const isSilent = !soundEnabled;
    const hasUpcomingAlarm = alarms.some((a) => a.enabled);

    if (isSilent && hasUpcomingAlarm) {
      const lastSilentTimeStr = localStorage.getItem('dy_sn_last_silent_mode_time');
      const lastSilentTime = lastSilentTimeStr ? parseInt(lastSilentTimeStr, 10) : 0;
      const twelveHoursMs = 12 * 60 * 60 * 1000;

      if (currentDate.getTime() - lastSilentTime > twelveHoursMs) {
        triggeredMessages.push({
          type: 'silent_mode',
          text: 'Your phone is currently in Silent Mode. Check your alarm settings.',
        });
      }
    }
  }

  // If no triggers occurred, return null
  if (triggeredMessages.length === 0) {
    return null;
  }

  // Record that these notifications were issued to avoid spamming
  const tomorrowDate = new Date(currentDate.getTime() + 86400000);
  const tomorrowKey = formatDateKey(tomorrowDate);

  triggeredMessages.forEach((msg) => {
    if (msg.type === 'no_alarm') {
      localStorage.setItem('dy_sn_last_no_alarm_date', tomorrowKey);
    } else if (msg.type === 'long_timer' && timerInfo.sessionId) {
      localStorage.setItem('dy_sn_last_long_timer_session', timerInfo.sessionId);
    } else if (msg.type === 'silent_mode') {
      localStorage.setItem('dy_sn_last_silent_mode_time', currentDate.getTime().toString());
    }
  });

  // Build combined or individual payload
  const messagesList = triggeredMessages.map((m) => m.text);
  const typesList = triggeredMessages.map((m) => m.type);

  const actions: SmartNotificationAction[] = [];

  if (typesList.includes('no_alarm')) {
    actions.push({ label: 'Create Alarm', actionKey: 'create_alarm', primary: true });
  }
  if (typesList.includes('long_timer')) {
    actions.push({ label: 'Open Timer', actionKey: 'open_timer', primary: !actions.some((a) => a.primary) });
  }
  if (typesList.includes('silent_mode')) {
    actions.push({ label: 'Open Alarm Settings', actionKey: 'open_alarm_settings' });
  }
  actions.push({ label: 'Dismiss', actionKey: 'dismiss' });

  const payload: SmartNotificationPayload = {
    id: `smart-notif-${Date.now()}`,
    title: 'DY Clock',
    messages: messagesList,
    actions,
    type: typesList.length === 1 ? typesList[0] : 'combined',
    timestamp: Date.now(),
  };

  // Trigger System OS Notification if systemNotificationsEnabled
  if (config.systemNotificationsEnabled) {
    const systemText = messagesList.length === 1 ? messagesList[0] : messagesList.map((m) => `• ${m}`).join('\n');
    sendSystemNotification('DY Clock', systemText);
  }

  return payload;
}
