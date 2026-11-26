import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { Contact, FilterParams, PaginatedResult } from '../types';

const KEY = STORAGE_KEYS.contacts;

export const contactService = {
  getAll: () => getAll<Contact>(KEY),
  getById: (id: string) => getById<Contact>(KEY, id),
  create: (data: Omit<Contact, 'id'>) => createItem<Contact>(KEY, data),
  update: (id: string, data: Partial<Contact>) => updateItem<Contact>(KEY, id, data),
  delete: (id: string) => deleteItem<Contact>(KEY, id),
  emailExists: (email: string, excludeId?: string) =>
    getAll<Contact>(KEY).some(c => c.email === email && c.id !== excludeId),

  getPaginated: (params: FilterParams): PaginatedResult<Contact> => {
    let items = getAll<Contact>(KEY);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.jobTitle?.toLowerCase().includes(q)
      );
    }
    if (params.status) items = items.filter(c => c.status === params.status);
    if (params.ownerId) items = items.filter(c => c.ownerId === params.ownerId);
    if (params.companyId) items = items.filter(c => c.companyId === params.companyId);
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total, page, pageSize };
  },
};

