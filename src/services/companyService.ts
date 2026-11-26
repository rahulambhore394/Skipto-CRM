import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { Company, FilterParams, PaginatedResult } from '../types';

const KEY = STORAGE_KEYS.companies;

export const companyService = {
  getAll: () => getAll<Company>(KEY),
  getById: (id: string) => getById<Company>(KEY, id),
  create: (data: Omit<Company, 'id'>) => createItem<Company>(KEY, data),
  update: (id: string, data: Partial<Company>) => updateItem<Company>(KEY, id, data),
  delete: (id: string) => deleteItem<Company>(KEY, id),

  getPaginated: (params: FilterParams): PaginatedResult<Company> => {
    let items = getAll<Company>(KEY);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q)
      );
    }
    if (params.ownerId) items = items.filter(c => c.ownerId === params.ownerId);
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total, page, pageSize };
  },
};

