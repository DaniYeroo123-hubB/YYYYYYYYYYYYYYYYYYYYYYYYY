import { useEffect, useState } from 'react';
import { useDateTimeSettings } from './settingsContext';

type ClockListener = (time: Date) => void;

class SharedClockEngine {
  private listeners: Set<ClockListener> = new Set();
  private animId: number | null = null;
  private getAppTimeFn: (() => Date) | null = null;

  register(listener: ClockListener, getAppTime: () => Date) {
    this.getAppTimeFn = getAppTime;
    this.listeners.add(listener);
    if (this.listeners.size === 1) {
      this.start();
    }
  }

  unregister(listener: ClockListener) {
    this.listeners.delete(listener);
    if (this.listeners.size === 0) {
      this.stop();
    }
  }

  private start() {
    const tick = () => {
      if (this.getAppTimeFn) {
        const now = this.getAppTimeFn();
        this.listeners.forEach((listener) => listener(now));
      }
      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  private stop() {
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }
}

export const sharedClockEngine = new SharedClockEngine();

export function useSharedClock() {
  const { getAppTime } = useDateTimeSettings();
  const [time, setTime] = useState(() => getAppTime());

  useEffect(() => {
    const handleTick = (newTime: Date) => {
      setTime(newTime);
    };
    sharedClockEngine.register(handleTick, getAppTime);
    return () => {
      sharedClockEngine.unregister(handleTick);
    };
  }, [getAppTime]);

  return time;
}
