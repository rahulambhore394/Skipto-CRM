import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { Activity, FilterParams, PaginatedResult } from '../types';

const KEY = STORAGE_KEYS.activities;

export const activityService = {
  getAll: () => getAll<Activity>(KEY),
  getById: (id: string) => getById<Activity>(KEY, id),
  create: (data: Omit<Activity, 'id'>) => createItem<Activity>(KEY, data),
  update: (id: string, data: Partial<Activity>) => updateItem<Activity>(KEY, id, data),
  delete: (id: string) => deleteItem<Activity>(KEY, id),

  getPaginated: (params: FilterParams): PaginatedResult<Activity> => {
    let items = getAll<Activity>(KEY);
    if (params.ownerId) items = items.filter(a => a.ownerId === params.ownerId);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(a => a.subject.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
    }
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total, page, pageSize };
  },

  getForContact: (contactId: string) =>
    getAll<Activity>(KEY).filter(a => a.relatedContactId === contactId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

  getForDeal: (dealId: string) =>
    getAll<Activity>(KEY).filter(a => a.relatedDealId === dealId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

  getRecent: (limit = 5) =>
    getAll<Activity>(KEY).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit),
};

