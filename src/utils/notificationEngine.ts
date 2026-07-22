import { Alarm } from '../types';
import { SmartNotificationsConfig, SmartNotificationPayload, ActiveTimerInfo, sendSystemNotification } from './smartNotifications';
import {
  addNotificationToHistory,
  removeNotificationsByType,
  hasNotificationByType,
  getNotificationHistory,
} from './notificationCenter';
import { formatAlarmTime } from './alarmUtils';

export interface EvaluationParams {
  config: SmartNotificationsConfig;
  alarms: Alarm[];
  timerInfo: ActiveTimerInfo;
  soundEnabled: boolean;
  currentDate: Date;
  activeTimezone: string;
  bedtimeReminderEnabled?: boolean;
  bedtimeSleepGoalHours?: number;
  timeFormat?: '12h' | '24h';
  onTriggerBanner?: (payload: SmartNotificationPayload) => void;
}

let lastEvaluatedDateKey: string | null = null;

/**
 * Format a Date into YYYY-MM-DD
 */
function formatDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Central Offline Event-Driven Notification Engine for DY Clock
 */
export function evaluateNotificationEngine(params: EvaluationParams): void {
  const { config, alarms, timerInfo, soundEnabled, currentDate, bedtimeReminderEnabled, bedtimeSleepGoalHours, onTriggerBanner } = params;

  // 1. Midnight Rollover Maintenance Check
  const currentDateKey = formatDateKey(currentDate);
  if (lastEvaluatedDateKey !== null && lastEvaluatedDateKey !== currentDateKey) {
    // Date rolled over midnight (12:00 AM)
    // Silently prune expired notifications > 72h
    getNotificationHistory();
  }
  lastEvaluatedDateKey = currentDateKey;

  // Master switch check
  if (!config || !config.enabled) {
    return;
  }

  const isMuted = Boolean(config.muteAllNotifications);

  // ----------------------------------------------------
  // 2. EVALUATE: NO ALARM FOR TOMORROW
  // ----------------------------------------------------
  if (config.noAlarmTomorrow) {
    const tomorrowDate = new Date(currentDate.getTime() + 86400000); // +24h
    const tomorrowDayOfWeek = tomorrowDate.getDay(); // 0..6

    // Check if any enabled alarm applies to tomorrow
    const hasAlarmTomorrow = alarms.some((alarm) => {
      if (!alarm.enabled) return false;
      if (alarm.repeatDays.length > 0) {
        return alarm.repeatDays.includes(tomorrowDayOfWeek);
      }
      return true; // One-time enabled alarm applies to upcoming schedule
    });

    const noAlarmMsg = 'No alarm is set for tomorrow.';
    const hasNoAlarmNotif = hasNotificationByType('alarm', noAlarmMsg);

    if (hasAlarmTomorrow) {
      // Condition no longer true -> Automatically remove
      if (hasNoAlarmNotif) {
        removeNotificationsByType('alarm', noAlarmMsg);
      }
    } else {
      // Condition is true -> Generate if missing
      if (!hasNoAlarmNotif) {
        const actions = [
          { label: 'Create Alarm', actionKey: 'create_alarm' as const, primary: true },
          { label: 'Dismiss', actionKey: 'dismiss' as const },
        ];

        addNotificationToHistory({
          title: 'DY Clock',
          message: noAlarmMsg,
          type: 'alarm',
          actions,
        });

        if (!isMuted && onTriggerBanner) {
          onTriggerBanner({
            id: `no-alarm-banner-${Date.now()}`,
            title: 'DY Clock',
            messages: [noAlarmMsg],
            actions,
            type: 'no_alarm',
            timestamp: Date.now(),
          });
        }

        if (!isMuted && config.systemNotificationsEnabled) {
          sendSystemNotification('DY Clock', noAlarmMsg);
        }
      }
    }
  }

  // ----------------------------------------------------
  // 3. EVALUATE: SILENT MODE REMINDER
  // ----------------------------------------------------
  if (config.silentModeReminder) {
    const isSilent = !soundEnabled;
    const hasUpcomingAlarm = alarms.some((a) => a.enabled);
    const silentMsg = 'Your phone is currently in Silent Mode. Check your alarm settings.';
    const hasSilentNotif = hasNotificationByType('silent', 'Silent Mode');

    if (isSilent && hasUpcomingAlarm) {
      if (!hasSilentNotif) {
        const actions = [
          { label: 'Open Alarm Settings', actionKey: 'open_alarm_settings' as const },
          { label: 'Dismiss', actionKey: 'dismiss' as const },
        ];

        addNotificationToHistory({
          title: 'DY Clock',
          message: silentMsg,
          type: 'silent',
          actions,
        });

        if (!isMuted && onTriggerBanner) {
          onTriggerBanner({
            id: `silent-mode-banner-${Date.now()}`,
            title: 'DY Clock',
            messages: [silentMsg],
            actions,
            type: 'silent_mode',
            timestamp: Date.now(),
          });
        }

        if (!isMuted && config.systemNotificationsEnabled) {
          sendSystemNotification('DY Clock', silentMsg);
        }
      }
    } else {
      // Sound is back ON or no alarms -> Automatically remove outdated alert
      if (hasSilentNotif) {
        removeNotificationsByType('silent', 'Silent Mode');
      }
    }
  }

  // ----------------------------------------------------
  // 4. EVALUATE: LONG RUNNING TIMER (>= 2 hours = 7200s)
  // ----------------------------------------------------
  if (config.longRunningTimer) {
    const timerMsg = 'Your timer has been running for 2 hours.';
    const hasTimerNotif = hasNotificationByType('timer', '2 hours');

    if (timerInfo.isRunning && timerInfo.startTime && timerInfo.sessionId) {
      const elapsedSeconds = Math.floor((currentDate.getTime() - timerInfo.startTime) / 1000);
      if (elapsedSeconds >= 7200) {
        if (!hasTimerNotif) {
          const actions = [
            { label: 'Open Timer', actionKey: 'open_timer' as const, primary: true },
            { label: 'Dismiss', actionKey: 'dismiss' as const },
          ];

          addNotificationToHistory({
            title: 'DY Clock',
            message: timerMsg,
            type: 'timer',
            actions,
          });

          if (!isMuted && onTriggerBanner) {
            onTriggerBanner({
              id: `long-timer-banner-${Date.now()}`,
              title: 'DY Clock',
              messages: [timerMsg],
              actions,
              type: 'long_timer',
              timestamp: Date.now(),
            });
          }

          if (!isMuted && config.systemNotificationsEnabled) {
            sendSystemNotification('DY Clock', timerMsg);
          }
        }
      }
    } else {
      // Timer is no longer running -> Clean up active timer reminder
      if (hasTimerNotif) {
        removeNotificationsByType('timer', '2 hours');
      }
    }
  }

  // ----------------------------------------------------
  // 5. EVALUATE: BEDTIME REMINDER
  // ----------------------------------------------------
  const globalBedtimeEnabled = bedtimeReminderEnabled ?? true;
  const globalSleepGoal = bedtimeSleepGoalHours ?? 8;

  // Find all active alarms that have bedtime reminder enabled
  const enabledAlarms = alarms.filter((alarm) => alarm.enabled);
  let earliestUpcoming: {
    alarm: Alarm;
    alarmTargetMs: number;
    bedtimeMs: number;
    sleepGoal: number;
  } | null = null;

  for (const alarm of enabledAlarms) {
    const mode = alarm.bedtimeReminderMode || 'global';
    if (mode === 'disabled') continue;

    let sleepGoal = globalSleepGoal;
    if (mode === 'custom' && alarm.bedtimeSleepGoalHours) {
      sleepGoal = alarm.bedtimeSleepGoalHours;
    } else {
      if (!globalBedtimeEnabled) continue;
    }

    const [hrsStr, minsStr] = (alarm.time || '00:00').split(':');
    const alarmHrs = parseInt(hrsStr, 10) || 0;
    const alarmMins = parseInt(minsStr, 10) || 0;

    let foundTargetMs: number | null = null;
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const candidateDate = new Date(currentDate);
      candidateDate.setDate(candidateDate.getDate() + dayOffset);
      candidateDate.setHours(alarmHrs, alarmMins, 0, 0);

      const candidateMs = candidateDate.getTime();
      const dayOfWeek = candidateDate.getDay();

      if (alarm.repeatDays && alarm.repeatDays.length > 0) {
        if (!alarm.repeatDays.includes(dayOfWeek)) continue;
      }

      if (candidateMs > currentDate.getTime()) {
        foundTargetMs = candidateMs;
        break;
      }
    }

    if (foundTargetMs !== null) {
      const bedtimeMs = foundTargetMs - sleepGoal * 3600 * 1000;
      if (!earliestUpcoming || foundTargetMs < earliestUpcoming.alarmTargetMs) {
        earliestUpcoming = {
          alarm,
          alarmTargetMs: foundTargetMs,
          bedtimeMs,
          sleepGoal,
        };
      }
    }
  }

  if (earliestUpcoming) {
    const { alarm, alarmTargetMs, bedtimeMs, sleepGoal } = earliestUpcoming;
    const nowMs = currentDate.getTime();

    // Trigger if current time is at or past bedtime, and before alarm target
    if (nowMs >= bedtimeMs && nowMs < alarmTargetMs) {
      const triggerKey = `bedtime_notif_${alarm.id}_${alarmTargetMs}`;
      const lastTriggered = localStorage.getItem('dy_last_bedtime_trigger');

      if (lastTriggered !== triggerKey) {
        const formattedAlarm = formatAlarmTime(alarm.time, params.timeFormat || '12h');
        const message = `It's time to prepare for sleep. Your first alarm is in ${sleepGoal} hours (${formattedAlarm}). Getting enough sleep helps you wake up feeling refreshed.`;

        const actions = [
          { label: '🌙 Sleep Now', actionKey: 'sleep_now' as const, primary: true },
          { label: '⏰ View Alarm', actionKey: 'view_alarm' as const },
          { label: '✖ Dismiss', actionKey: 'dismiss' as const },
        ];

        addNotificationToHistory({
          title: '😴 Bedtime Reminder',
          message,
          type: 'bedtime',
          actions,
        });

        if (!isMuted && onTriggerBanner) {
          onTriggerBanner({
            id: `bedtime-banner-${Date.now()}`,
            title: '😴 Bedtime Reminder',
            messages: [message],
            actions,
            type: 'bedtime',
            timestamp: Date.now(),
          });
        }

        if (!isMuted && config.systemNotificationsEnabled) {
          sendSystemNotification('😴 Bedtime Reminder', message);
        }

        localStorage.setItem('dy_last_bedtime_trigger', triggerKey);
      }
    }
  }
}
