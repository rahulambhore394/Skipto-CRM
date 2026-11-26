import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { Deal, FilterParams, PaginatedResult } from '../types';

const KEY = STORAGE_KEYS.deals;

export const dealService = {
  getAll: () => getAll<Deal>(KEY),
  getById: (id: string) => getById<Deal>(KEY, id),
  create: (data: Omit<Deal, 'id'>) => createItem<Deal>(KEY, data),
  update: (id: string, data: Partial<Deal>) => updateItem<Deal>(KEY, id, data),
  delete: (id: string) => deleteItem<Deal>(KEY, id),

  getPaginated: (params: FilterParams): PaginatedResult<Deal> => {
    let items = getAll<Deal>(KEY);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(d =>
        d.dealName.toLowerCase().includes(q) ||
        d.companyName?.toLowerCase().includes(q) ||
        d.contactName?.toLowerCase().includes(q)
      );
    }
    if (params.stage) items = items.filter(d => d.stage === params.stage);
    if (params.ownerId) items = items.filter(d => d.ownerId === params.ownerId);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total, page, pageSize };
  },

  getByStage: (stage: string) => getAll<Deal>(KEY).filter(d => d.stage === stage),

  getTotalRevenue: () =>
    getAll<Deal>(KEY).filter(d => d.stage === 'won').reduce((sum, d) => sum + d.value, 0),
};

