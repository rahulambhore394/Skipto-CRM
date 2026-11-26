import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { Lead, FilterParams, PaginatedResult } from '../types';

const KEY = STORAGE_KEYS.leads;

export const leadService = {
  getAll: () => getAll<Lead>(KEY),
  getById: (id: string) => getById<Lead>(KEY, id),
  create: (data: Omit<Lead, 'id'>) => createItem<Lead>(KEY, data),
  update: (id: string, data: Partial<Lead>) => updateItem<Lead>(KEY, id, data),
  delete: (id: string) => deleteItem<Lead>(KEY, id),

  getPaginated: (params: FilterParams): PaginatedResult<Lead> => {
    let items = getAll<Lead>(KEY);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(l =>
        l.leadName.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q)
      );
    }
    if (params.status) items = items.filter(l => l.status === params.status);
    if (params.priority) items = items.filter(l => l.priority === params.priority);
    if (params.ownerId) items = items.filter(l => l.ownerId === params.ownerId);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total, page, pageSize };
  },

  getByStatus: (status: string) => getAll<Lead>(KEY).filter(l => l.status === status),
};

