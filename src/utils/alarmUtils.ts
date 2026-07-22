/**
 * Formats an internal 24-hour time string ("HH:MM") into either 12-hour or 24-hour representation.
 * @param timeString The "HH:MM" 24-hour time string
 * @param format "12h" or "24h"
 */
export function formatAlarmTime(timeString: string, format: '12h' | '24h' = '12h'): string {
  if (!timeString || !timeString.includes(':')) return timeString;
  const [hrsStr, minsStr] = timeString.split(':');
  const hrs = parseInt(hrsStr, 10);
  const mins = parseInt(minsStr, 10);
  if (isNaN(hrs) || isNaN(mins)) return timeString;

  if (format === '24h') {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  } else {
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    let hrs12 = hrs % 12;
    if (hrs12 === 0) hrs12 = 12;
    return `${hrs12}:${String(mins).padStart(2, '0')} ${ampm}`;
  }
}

export interface NextRingInfo {
  nextRingDate: Date;
  hasPassedToday: boolean;
  remainingText: string;
  fullDateFormatted: string;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Calculates the exact next ring occurrence, remaining time, and warning state for an alarm.
 */
export function calculateNextRing(timeStr: string, repeatDays: number[], now: Date): NextRingInfo | null {
  if (!timeStr || !timeStr.includes(':')) {
    return null;
  }

  const [hrsStr, minsStr] = timeStr.split(':');
  const targetHrs = parseInt(hrsStr, 10);
  const targetMins = parseInt(minsStr, 10);

  if (isNaN(targetHrs) || isNaN(targetMins)) {
    return null;
  }

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDate = now.getDate();

  // Target time today
  const targetToday = new Date(currentYear, currentMonth, currentDate, targetHrs, targetMins, 0, 0);
  const isTargetTodayInFuture = targetToday.getTime() > now.getTime();

  let nextRingDate: Date;
  let hasPassedToday = false;

  if (repeatDays.length === 0) {
    // One-time alarm ("Once")
    if (isTargetTodayInFuture) {
      nextRingDate = targetToday;
      hasPassedToday = false;
    } else {
      nextRingDate = new Date(currentYear, currentMonth, currentDate + 1, targetHrs, targetMins, 0, 0);
      hasPassedToday = true;
    }
  } else {
    // Repeating alarm
    let found = false;
    nextRingDate = new Date();

    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(currentYear, currentMonth, currentDate + offset, targetHrs, targetMins, 0, 0);
      const candidateDayOfWeek = candidate.getDay();

      if (repeatDays.includes(candidateDayOfWeek)) {
        if (offset === 0) {
          if (isTargetTodayInFuture) {
            nextRingDate = candidate;
            found = true;
            break;
          }
        } else {
          nextRingDate = candidate;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      nextRingDate = new Date(currentYear, currentMonth, currentDate + 1, targetHrs, targetMins, 0, 0);
    }

    if (!isTargetTodayInFuture) {
      hasPassedToday = true;
    }
  }

  const diffMs = Math.max(0, nextRingDate.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  let remainingText = '';
  if (days > 0) {
    remainingText = `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) {
      remainingText += ` ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } else if (hours > 0) {
    remainingText = `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) {
      remainingText += ` ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
  } else if (minutes > 0) {
    remainingText = `${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    remainingText = 'less than a minute';
  }

  const tomorrow = new Date(currentYear, currentMonth, currentDate + 1);
  const isToday = nextRingDate.getFullYear() === currentYear &&
                  nextRingDate.getMonth() === currentMonth &&
                  nextRingDate.getDate() === currentDate;

  const isTomorrow = nextRingDate.getFullYear() === tomorrow.getFullYear() &&
                     nextRingDate.getMonth() === tomorrow.getMonth() &&
                     nextRingDate.getDate() === tomorrow.getDate();

  let dayLabel = '';
  if (isToday) {
    dayLabel = 'Today';
  } else if (isTomorrow) {
    dayLabel = 'Tomorrow';
  } else {
    dayLabel = nextRingDate.toLocaleDateString([], { weekday: 'long' });
  }

  const fullDateFormatted = `${dayLabel}, ${nextRingDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return {
    nextRingDate,
    hasPassedToday,
    remainingText,
    fullDateFormatted,
    days,
    hours,
    minutes,
    seconds,
  };
}
