import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { userService } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import type { User, UserRole } from '../types';
import { format } from 'date-fns';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'sales_rep']),
});
type FormData = z.infer<typeof schema>;

const roleVariants: Record<UserRole, 'danger' | 'warning' | 'info'> = {
  admin: 'danger',
  manager: 'warning',
  sales_rep: 'info',
};

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState(() => userService.getAll());
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = () => setUsers(userService.getAll());

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q);
  });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'sales_rep' },
  });

  const openCreate = () => {
    setEditUser(null);
    reset({ name: '', email: '', phone: '', role: 'sales_rep' });
    setModalOpen(true);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    reset({ name: u.name, email: u.email, phone: u.phone ?? '', role: u.role });
    setModalOpen(true);
  };

  const onSubmit = (data: FormData) => {
    if (editUser) {
      userService.update(editUser.id, data);
      toast.success('User updated');
    } else {
      if (userService.findByEmail(data.email)) {
        toast.error('A user with this email already exists');
        return;
      }
      userService.create({ ...data, createdAt: new Date().toISOString() });
      toast.success('User created');
    }
    setModalOpen(false);
    refresh();
  };

  const handleDelete = () => {
    if (!deleteId) return;
    if (deleteId === currentUser?.id) {
      toast.error('You cannot delete your own account');
      setDeleteId(null);
      return;
    }
    userService.delete(deleteId);
    toast.success('User deleted');
    setDeleteId(null);
    refresh();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          <p className="text-sm text-gray-500">{users.length} team members · Admin only</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add User</Button>
      </div>

      <Card>
        <SearchBar value={search} onChange={setSearch} placeholder="Search users by name, email, or role..." className="max-w-sm" />
      </Card>

      <Card padding={false}>
        {filtered.length === 0 ? (
          <EmptyState title="No users found" icon={<Shield size={28} />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Phone</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.name} {u.id === currentUser?.id && <span className="text-xs text-indigo-600">(You)</span>}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{u.phone || '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={roleVariants[u.role]} dot>{u.role.replace('_', ' ')}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">
                      {format(new Date(u.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600" title="Edit">
                          <Pencil size={15} />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button onClick={() => setDeleteId(u.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editUser ? 'Edit User' : 'Add User'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSubmit)}>{editUser ? 'Update' : 'Create'} User</Button>
          </>
        }
      >
        <form className="space-y-4">
          <Input label="Full Name" {...register('name')} error={errors.name?.message} required />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} required />
          <Input label="Phone" {...register('phone')} />
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Role"
                {...field}
                options={[
                  { value: 'admin', label: 'Admin (Full Access)' },
                  { value: 'manager', label: 'Manager (Team & Reports)' },
                  { value: 'sales_rep', label: 'Sales Representative (Assigned Records)' },
                ]}
              />
            )}
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="This will remove the user from the CRM team."
      />
    </div>
  );
}

