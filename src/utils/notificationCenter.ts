import { SmartNotificationAction } from './smartNotifications';

export type NotificationIconType = 'alarm' | 'timer' | 'silent' | 'info' | 'bedtime' | 'combined';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationIconType;
  timestamp: number;
  read: boolean;
  actions?: SmartNotificationAction[];
}

const STORAGE_KEY = 'dy_notification_history';
const MAX_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours

/**
 * Filter out notifications older than 72 hours (background silent cleanup)
 */
export function cleanExpiredNotifications(items: NotificationItem[]): NotificationItem[] {
  const now = Date.now();
  return items.filter((item) => now - item.timestamp <= MAX_AGE_MS);
}

/**
 * Retrieve notification history from localStorage
 */
export function getNotificationHistory(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: NotificationItem[] = JSON.parse(raw);
    const cleaned = cleanExpiredNotifications(items);
    if (cleaned.length !== items.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (e) {
    console.warn('Failed to parse notification history:', e);
    return [];
  }
}

/**
 * Save notification history to localStorage
 */
export function saveNotificationHistory(items: NotificationItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    const cleaned = cleanExpiredNotifications(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new Event('dy_notification_history_updated'));
  } catch (e) {
    console.warn('Failed to save notification history:', e);
  }
}

/**
 * Add a new notification item to history
 */
export function addNotificationToHistory(param: {
  title: string;
  message: string;
  type: NotificationIconType;
  actions?: SmartNotificationAction[];
}): NotificationItem {
  const history = getNotificationHistory();

  // Deduplicate if identical unread message was added in the last 5 minutes
  const duplicate = history.find(
    (item) =>
      !item.read &&
      item.message === param.message &&
      Date.now() - item.timestamp < 5 * 60 * 1000
  );

  if (duplicate) {
    return duplicate;
  }

  const newItem: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: param.title,
    message: param.message,
    type: param.type,
    timestamp: Date.now(),
    read: false,
    actions: param.actions,
  };

  const updatedHistory = [newItem, ...history];
  saveNotificationHistory(updatedHistory);
  return newItem;
}

/**
 * Get count of unread notifications
 */
export function getUnreadCount(): number {
  const history = getNotificationHistory();
  return history.filter((item) => !item.read).length;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  const history = getNotificationHistory();
  if (history.some((item) => !item.read)) {
    const updated = history.map((item) => ({ ...item, read: true }));
    saveNotificationHistory(updated);
  }
}

/**
 * Delete a single notification item by id
 */
export function deleteNotificationItem(id: string): void {
  const history = getNotificationHistory();
  const updated = history.filter((item) => item.id !== id);
  saveNotificationHistory(updated);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications(): void {
  saveNotificationHistory([]);
}

/**
 * Remove notifications matching a type and optional message substring
 */
export function removeNotificationsByType(type: NotificationIconType, messageMatch?: string): void {
  const history = getNotificationHistory();
  const initialLength = history.length;
  const filtered = history.filter((item) => {
    if (item.type !== type) return true;
    if (messageMatch && !item.message.toLowerCase().includes(messageMatch.toLowerCase())) return true;
    return false;
  });

  if (filtered.length !== initialLength) {
    saveNotificationHistory(filtered);
  }
}

/**
 * Check if a notification of specified type and optional message exists
 */
export function hasNotificationByType(type: NotificationIconType, messageMatch?: string): boolean {
  const history = getNotificationHistory();
  return history.some((item) => {
    if (item.type !== type) return false;
    if (messageMatch && !item.message.toLowerCase().includes(messageMatch.toLowerCase())) return false;
    return true;
  });
}

/**
 * Group notifications by Today, Yesterday, 2 Days Ago, 3 Days Ago, and Older
 */
export interface NotificationGroup {
  groupTitle: string;
  items: NotificationItem[];
}

export function groupNotificationsByDate(items: NotificationItem[]): NotificationGroup[] {
  const sorted = [...items].sort((a, b) => b.timestamp - a.timestamp);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 86400000;
  const startOfTwoDaysAgo = startOfToday - 86400000 * 2;
  const startOfThreeDaysAgo = startOfToday - 86400000 * 3;

  const todayItems: NotificationItem[] = [];
  const yesterdayItems: NotificationItem[] = [];
  const twoDaysAgoItems: NotificationItem[] = [];
  const threeDaysAgoItems: NotificationItem[] = [];
  const olderItems: NotificationItem[] = [];

  sorted.forEach((item) => {
    if (item.timestamp >= startOfToday) {
      todayItems.push(item);
    } else if (item.timestamp >= startOfYesterday) {
      yesterdayItems.push(item);
    } else if (item.timestamp >= startOfTwoDaysAgo) {
      twoDaysAgoItems.push(item);
    } else if (item.timestamp >= startOfThreeDaysAgo) {
      threeDaysAgoItems.push(item);
    } else {
      olderItems.push(item);
    }
  });

  const groups: NotificationGroup[] = [];
  if (todayItems.length > 0) groups.push({ groupTitle: 'Today', items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ groupTitle: 'Yesterday', items: yesterdayItems });
  if (twoDaysAgoItems.length > 0) groups.push({ groupTitle: '2 Days Ago', items: twoDaysAgoItems });
  if (threeDaysAgoItems.length > 0) groups.push({ groupTitle: '3 Days Ago', items: threeDaysAgoItems });
  if (olderItems.length > 0) groups.push({ groupTitle: 'Older', items: olderItems });

  return groups;
}
