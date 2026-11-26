import { getAll, getById, createItem, updateItem, deleteItem, STORAGE_KEYS } from '../data/storage';
import type { User } from '../types';

const KEY = STORAGE_KEYS.users;

export const userService = {
  getAll: () => getAll<User>(KEY),
  getById: (id: string) => getById<User>(KEY, id),
  create: (data: Omit<User, 'id'>) => createItem<User>(KEY, data),
  update: (id: string, data: Partial<User>) => updateItem<User>(KEY, id, data),
  delete: (id: string) => deleteItem<User>(KEY, id),
  findByEmail: (email: string) => getAll<User>(KEY).find(u => u.email === email),
};

