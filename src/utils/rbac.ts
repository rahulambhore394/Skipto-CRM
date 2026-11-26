import type { User, UserRole } from '../types';

export type Permission =
  | 'view_all_records'
  | 'manage_users'
  | 'view_companies'
  | 'manage_companies'
  | 'view_reports'
  | 'manage_settings'
  | 'delete_records'
  | 'assign_owners';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_all_records',
    'manage_users',
    'view_companies',
    'manage_companies',
    'view_reports',
    'manage_settings',
    'delete_records',
    'assign_owners',
  ],
  manager: [
    'view_all_records',
    'view_companies',
    'manage_companies',
    'view_reports',
    'assign_owners',
  ],
  sales_rep: [],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function canAccessPath(role: UserRole | undefined, path: string): boolean {
  if (!role) return false;
  if (path.startsWith('/users')) return hasPermission(role, 'manage_users');
  if (path.startsWith('/reports')) return hasPermission(role, 'view_reports');
  if (path.startsWith('/companies')) return hasPermission(role, 'view_companies');
  return true;
}

export function scopeByOwner<T extends { ownerId?: string }>(items: T[], user: User | null): T[] {
  if (!user) return [];
  if (hasPermission(user.role, 'view_all_records')) return items;
  return items.filter((item) => item.ownerId === user.id);
}

export function scopeTasksByUser<T extends { assignedUserId?: string }>(items: T[], user: User | null): T[] {
  if (!user) return [];
  if (hasPermission(user.role, 'view_all_records')) return items;
  return items.filter((item) => item.assignedUserId === user.id);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  sales_rep: 'Sales Representative',
};

