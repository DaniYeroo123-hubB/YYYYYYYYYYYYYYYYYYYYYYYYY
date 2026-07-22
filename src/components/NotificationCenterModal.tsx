import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  Trash2,
  Clock,
  Hourglass,
  VolumeX,
  Info,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Moon,
} from 'lucide-react';
import {
  NotificationItem,
  getNotificationHistory,
  markAllNotificationsAsRead,
  deleteNotificationItem,
  clearAllNotifications,
  groupNotificationsByDate,
  NotificationIconType,
} from '../utils/notificationCenter';
import { Theme } from '../types';
import haptics from '../utils/haptics';
import synth from '../utils/synth';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: 'home' | 'alarm' | 'timer' | 'settings') => void;
  theme: Theme;
}

export default function NotificationCenterModal({
  isOpen,
  onClose,
  onNavigate,
  theme,
}: NotificationCenterModalProps) {
  const [items, setItems] = useState<NotificationItem[]>([]);

  // Load history & mark read when opened
  useEffect(() => {
    if (isOpen) {
      const history = getNotificationHistory();
      setItems(history);
      markAllNotificationsAsRead();
    }
  }, [isOpen]);

  // Listen for background history updates
  useEffect(() => {
    const handleUpdate = () => {
      setItems(getNotificationHistory());
    };
    window.addEventListener('dy_notification_history_updated', handleUpdate);
    return () => {
      window.removeEventListener('dy_notification_history_updated', handleUpdate);
    };
  }, []);

  if (!isOpen) return null;

  const grouped = groupNotificationsByDate(items);

  const handleClearAll = () => {
    haptics.medium();
    synth.playDismiss();
    clearAllNotifications();
    setItems([]);
  };

  const handleDeleteItem = (id: string) => {
    haptics.light();
    synth.playClick();
    deleteNotificationItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const renderNotificationIcon = (type: NotificationIconType) => {
    switch (type) {
      case 'alarm':
        return (
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'timer':
        return (
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
            <Hourglass className="w-4 h-4" />
          </div>
        );
      case 'silent':
        return (
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
            <VolumeX className="w-4 h-4" />
          </div>
        );
      case 'bedtime':
        return (
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 shrink-0">
            <Moon className="w-4 h-4" />
          </div>
        );
      case 'info':
        return (
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Info className="w-4 h-4" />
          </div>
        );
      case 'combined':
      default:
        return (
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        id="notification-center-backdrop"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 28 }}
          transition={{ duration: 0.22, ease: [0.25, 1, 0.5, 1] }}
          role="dialog"
          aria-label="Notification Center"
          className="relative max-w-md w-full bg-slate-900/95 border border-white/15 shadow-2xl rounded-3xl overflow-hidden text-slate-100 flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
          id="notification-center-card"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/60 backdrop-blur-lg">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-400">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Notification Center
                </h2>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">
                  {items.length === 0 ? 'No notifications' : `${items.length} total notifications`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {items.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-rose-950/50 hover:text-rose-300 text-slate-400 border border-slate-700/60 hover:border-rose-800/50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  title="Clear all notifications"
                  id="btn-clear-all-notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              )}

              <button
                onClick={() => {
                  haptics.light();
                  synth.playDismiss();
                  onClose();
                }}
                aria-label="Close Notification Center"
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                id="btn-close-notification-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div
            className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 scrollbar-thin scrollbar-thumb-slate-800"
            id="notification-center-list"
          >
            {items.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-slate-700/50 mx-auto flex items-center justify-center text-slate-500">
                  <CheckCircle2 className="w-6 h-6 text-slate-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    All Caught Up
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium max-w-xs mx-auto">
                    You have no notifications in your history right now.
                  </p>
                </div>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.groupTitle} className="space-y-2.5">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {group.groupTitle}
                  </h3>

                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x < -60) {
                            handleDeleteItem(item.id);
                          }
                        }}
                        className="relative group bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3.5 space-y-2 transition-colors overflow-hidden touch-pan-y"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            {renderNotificationIcon(item.type)}
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-xs font-bold text-slate-100 truncate">
                                  {item.title}
                                </h4>
                                <span className="text-[9px] font-semibold text-slate-500 whitespace-nowrap">
                                  {formatTimestamp(item.timestamp)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 font-medium leading-normal break-words">
                                {item.message}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            aria-label="Delete notification"
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800/60 transition-colors shrink-0 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Quick Actions inside notification card */}
                        {item.actions && item.actions.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                            {item.actions.map((act, idx) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  haptics.medium();
                                  synth.playClick();
                                  if (act.actionKey === 'create_alarm' || act.actionKey === 'view_alarm') {
                                    onNavigate('alarm');
                                    onClose();
                                  } else if (act.actionKey === 'open_timer') {
                                    onNavigate('timer');
                                    onClose();
                                  } else if (act.actionKey === 'open_alarm_settings') {
                                    onNavigate('settings');
                                    onClose();
                                  } else if (act.actionKey === 'sleep_now') {
                                    onNavigate('home');
                                    onClose();
                                  } else {
                                    handleDeleteItem(item.id);
                                  }
                                }}
                                className={`py-1 px-2.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                  act.primary
                                    ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-extrabold'
                                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/50'
                                }`}
                              >
                                <span>{act.label}</span>
                                {act.actionKey !== 'dismiss' && (
                                  <ArrowRight className="w-2.5 h-2.5" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
