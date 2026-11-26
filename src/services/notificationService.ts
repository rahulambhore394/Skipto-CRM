import { getAll, STORAGE_KEYS, saveAll } from '../data/storage';
import type { Notification } from '../types';

const KEY = STORAGE_KEYS.notifications;

export const notificationService = {
  getAll: () => getAll<Notification>(KEY).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  getUnreadCount: () => getAll<Notification>(KEY).filter(n => !n.read).length,
  markRead: (id: string) => {
    const items = getAll<Notification>(KEY);
    const idx = items.findIndex(n => n.id === id);
    if (idx !== -1) { items[idx].read = true; saveAll(KEY, items); }
  },
  markAllRead: () => {
    const items = getAll<Notification>(KEY).map(n => ({ ...n, read: true }));
    saveAll(KEY, items);
  },
};

