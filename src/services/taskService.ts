import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { Task, FilterParams, PaginatedResult } from '../types';

const KEY = STORAGE_KEYS.tasks;

export const taskService = {
  getAll: () => getAll<Task>(KEY),
  getById: (id: string) => getById<Task>(KEY, id),
  create: (data: Omit<Task, 'id'>) => createItem<Task>(KEY, data),
  update: (id: string, data: Partial<Task>) => updateItem<Task>(KEY, id, data),
  delete: (id: string) => deleteItem<Task>(KEY, id),

  getPaginated: (params: FilterParams & { assignedUserId?: string }): PaginatedResult<Task> => {
    let items = getAll<Task>(KEY);
    if (params.assignedUserId) items = items.filter(t => t.assignedUserId === params.assignedUserId);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (params.status) items = items.filter(t => t.status === params.status);
    if (params.priority) items = items.filter(t => t.priority === params.priority);
    items.sort((a, b) => {
      if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    const total = items.length;
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    return { data: items.slice(start, start + pageSize), total, page, pageSize };
  },

  getOverdue: () => {
    const now = new Date();
    return getAll<Task>(KEY).filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed' && t.status !== 'cancelled');
  },
};

