import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Sparkles, Clock, AlertTriangle, ArrowRight, Moon } from 'lucide-react';
import { SmartNotificationPayload, SmartNotificationAction } from '../utils/smartNotifications';
import { Theme } from '../types';
import haptics from '../utils/haptics';
import synth from '../utils/synth';

interface SmartNotificationBannerProps {
  notification: SmartNotificationPayload | null;
  onAction: (actionKey: 'create_alarm' | 'open_timer' | 'open_alarm_settings' | 'dismiss') => void;
  theme: Theme;
  soundEnabled?: boolean;
}

export function SmartNotificationBanner({
  notification,
  onAction,
  theme,
  soundEnabled = true,
}: SmartNotificationBannerProps) {
  const playedNotifIdRef = useRef<string | null>(null);
  const onActionRef = useRef(onAction);

  useEffect(() => {
    onActionRef.current = onAction;
  });

  const notificationId = notification?.id;

  useEffect(() => {
    if (notificationId) {
      if (playedNotifIdRef.current !== notificationId) {
        playedNotifIdRef.current = notificationId;
        if (soundEnabled) {
          synth.playSuccessSound();
        }
        if (notification?.type === 'no_alarm' || notification?.type === 'silent_mode') {
          haptics.gentleReminder();
        } else if (notification?.type === 'long_timer') {
          haptics.urgentAlert();
        } else {
          haptics.generalNotification();
        }
      }

      // Auto dismiss after 7 seconds
      const timer = setTimeout(() => {
        onActionRef.current('dismiss');
      }, 7000);

      return () => clearTimeout(timer);
    } else {
      playedNotifIdRef.current = null;
    }
  }, [notificationId, soundEnabled]);

  // Memoize the action callback prop handler
  const handleAction = useCallback(
    (actionKey: 'create_alarm' | 'open_timer' | 'open_alarm_settings' | 'dismiss') => {
      onAction(actionKey);
    },
    [onAction]
  );

  const handleDismiss = useCallback(() => {
    haptics.light();
    synth.playDismiss();
    handleAction('dismiss');
  }, [handleAction]);

  const handleButtonClick = useCallback(
    (act: SmartNotificationAction) => {
      haptics.medium();
      if (act.actionKey === 'dismiss') {
        synth.playDismiss();
      } else {
        synth.playClick();
      }
      handleAction(act.actionKey);
    },
    [handleAction]
  );

  // Memoize the rendered notification message content
  const memoizedMessageContent = useMemo(() => {
    if (!notification) return null;
    if (notification.messages.length === 1) {
      return <p className="text-sm font-semibold text-slate-100">{notification.messages[0]}</p>;
    }
    return (
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">Multiple reminders:</p>
        <ul className="space-y-1">
          {notification.messages.map((msg, idx) => (
            <li key={idx} className="flex items-start gap-2 font-semibold text-slate-100">
              <span className="text-cyan-400 font-bold">•</span>
              <span>{msg}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }, [notification]);

  // Memoize actions array from notification payload
  const memoizedActions = useMemo(() => {
    return notification?.actions ?? [];
  }, [notification]);

  return (
    <AnimatePresence>
      {notification && (
        <div
          className="fixed top-4 left-0 right-0 z-[120] flex justify-center px-4 pointer-events-none"
          id="smart-notification-container"
        >
          <motion.div
            initial={{ opacity: 0, y: -24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            role="alert"
            aria-live="polite"
            className="pointer-events-auto max-w-lg w-full bg-slate-900/95 backdrop-blur-xl border border-white/20 shadow-2xl shadow-cyan-950/40 rounded-2xl p-4 sm:p-5 text-white space-y-3.5 relative overflow-hidden"
            id="elegant-glass-notification"
          >
            {/* Top subtle theme accent bar */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400" />

            {/* Header Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border flex items-center justify-center shadow-sm ${
                  notification.type === 'bedtime' 
                    ? 'bg-purple-500/10 border-purple-400/30 text-purple-300' 
                    : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-400'
                }`}>
                  {notification.type === 'bedtime' ? (
                    <Moon className="w-4 h-4 animate-pulse text-purple-300" />
                  ) : (
                    <Bell className="w-4 h-4 animate-bounce" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    {notification.title || 'DY Clock'}{' '}
                    <span className={`text-[9px] font-bold py-0.5 px-2 rounded-full border ${
                      notification.type === 'bedtime'
                        ? 'bg-purple-950/60 border-purple-800/40 text-purple-300'
                        : 'bg-cyan-950/60 border-cyan-800/40 text-cyan-300'
                    }`}>
                      {notification.type === 'bedtime' ? 'Bedtime Alert' : 'Smart Alert'}
                    </span>
                  </span>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                aria-label="Dismiss smart notification"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Message Content */}
            <div className="space-y-1.5 text-xs text-slate-200 font-medium leading-relaxed pl-1">
              {memoizedMessageContent}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 pt-1 flex-wrap" id="smart-notification-actions">
              {memoizedActions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => handleButtonClick(act)}
                  className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    act.primary
                      ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-md shadow-cyan-400/20 active:scale-95'
                      : act.actionKey === 'dismiss'
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30'
                  }`}
                >
                  <span>{act.label}</span>
                  {act.actionKey !== 'dismiss' && <ArrowRight className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function arePropsEqual(prevProps: SmartNotificationBannerProps, nextProps: SmartNotificationBannerProps) {
  if (prevProps.soundEnabled !== nextProps.soundEnabled) return false;
  if (prevProps.theme?.id !== nextProps.theme?.id) return false;
  if (prevProps.onAction !== nextProps.onAction) return false;

  if (prevProps.notification === nextProps.notification) return true;
  if (!prevProps.notification || !nextProps.notification) {
    return prevProps.notification === nextProps.notification;
  }

  return (
    prevProps.notification.id === nextProps.notification.id &&
    prevProps.notification.type === nextProps.notification.type &&
    prevProps.notification.messages.length === nextProps.notification.messages.length &&
    prevProps.notification.messages.every((m, i) => m === nextProps.notification!.messages[i])
  );
}

export default React.memo(SmartNotificationBanner, arePropsEqual);
