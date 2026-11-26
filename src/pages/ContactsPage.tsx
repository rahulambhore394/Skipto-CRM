import React, { useState, useCallback } from 'react';
import { Plus, Download, Pencil, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { contactService } from '../services/contactService';
import { companyService } from '../services/companyService';
import { userService } from '../services/userService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import type { Contact, FilterParams } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/rbac';

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  companyId: z.string().optional(),
  source: z.string().optional(),
  ownerId: z.string().min(1, 'Owner required'),
  status: z.enum(['active', 'inactive', 'lead']),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const statusVariants: Record<string, 'success' | 'danger' | 'primary'> = {
  active: 'success', inactive: 'danger', lead: 'primary',
};

function exportCSV(contacts: Contact[]) {
  const headers = ['ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Company', 'Status', 'Source', 'Created'];
  const rows = contacts.map(c => [c.id, c.firstName, c.lastName, c.email, c.phone ?? '', c.jobTitle ?? '', c.companyName ?? '', c.status, c.source ?? '', format(new Date(c.createdAt), 'yyyy-MM-dd')]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'contacts.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function ContactsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const canViewAll = hasPermission(user?.role, 'view_all_records');
  const canDelete = hasPermission(user?.role, 'delete_records');
  const companies = companyService.getAll();
  const users = userService.getAll();
  const result = contactService.getPaginated({ ...filters, ownerId: canViewAll ? filters.ownerId : user?.id });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { status: 'active', ownerId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ status: 'active', ownerId: user?.id ?? '' }); setEditContact(null); setModalOpen(true); };
  const openEdit = (c: Contact) => {
    setEditContact(c);
    reset({ firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone ?? '', jobTitle: c.jobTitle ?? '', companyId: c.companyId ?? '', source: c.source ?? '', ownerId: c.ownerId, status: c.status, notes: c.notes ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const company = companies.find(c => c.id === data.companyId);
      const payload = { ...data, companyName: company?.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [] };
      if (editContact) {
        contactService.update(editContact.id, payload);
        toast.success('Contact updated');
      } else {
        if (contactService.emailExists(data.email)) { toast.error('Email already exists'); setSaving(false); return; }
        contactService.create(payload);
        toast.success('Contact created');
      }
      setModalOpen(false);
      setFilters(f => ({ ...f }));
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    contactService.delete(deleteId);
    toast.success('Contact deleted');
    setDeleteId(null);
    setDeleting(false);
    setFilters(f => ({ ...f }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Contacts</h2>
          <p className="text-sm text-gray-500">{result.total} total contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={() => exportCSV(contactService.getAll())}>Export</Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Contact</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <SearchBar value={filters.search ?? ''} onChange={v => setFilters(f => ({ ...f, search: v, page: 1 }))} placeholder="Search contacts..." className="flex-1 min-w-48" />
          <select
            value={filters.status ?? ''}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="lead">Lead</option>
          </select>
          <select
            value={filters.companyId ?? ''}
            onChange={e => setFilters(f => ({ ...f, companyId: e.target.value || undefined, page: 1 }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {result.data.length === 0 ? (
          <EmptyState title="No contacts found" description="Add your first contact or adjust filters." action={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Contact</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Email</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Created</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.data.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                          {c.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                          <p className="text-xs text-gray-400">{c.jobTitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{c.companyName ?? '—'}</td>
                    <td className="px-5 py-3.5 text-gray-600 hidden lg:table-cell">{c.email}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariants[c.status] ?? 'default'} dot>{c.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell text-xs">{format(new Date(c.createdAt), 'MMM d, yyyy')}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/contacts/${c.id}`)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700" title="View"><Eye size={15} /></button>
                        <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600" title="Edit"><Pencil size={15} /></button>
                        {canDelete && (
                          <button onClick={() => setDeleteId(c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={15} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 pb-3">
              <Pagination page={filters.page ?? 1} pageSize={filters.pageSize ?? 10} total={result.total} onChange={p => setFilters(f => ({ ...f, page: p }))} />
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editContact ? 'Edit Contact' : 'Add New Contact'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit(onSubmit)}>{editContact ? 'Update' : 'Create'} Contact</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} required />
          <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} required />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} required />
          <Input label="Phone" type="tel" {...register('phone')} error={errors.phone?.message} />
          <Input label="Job Title" {...register('jobTitle')} />
          <Controller name="companyId" control={control} render={({ field }) => (
            <Select label="Company" {...field} options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Select company" />
          )} />
          <Input label="Source" {...register('source')} />
          <Controller name="ownerId" control={control} render={({ field }) => (
            <Select label="Owner" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} required error={errors.ownerId?.message} />
          )} />
          <Controller name="status" control={control} render={({ field }) => (
            <Select label="Status" {...field} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }, { value: 'lead', label: 'Lead' }]} />
          )} />
          <div className="md:col-span-2">
            <Textarea label="Notes" {...register('notes')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Contact"
        message="This will permanently delete the contact and all associated data. This action cannot be undone."
        confirmLabel="Delete Contact"
        loading={deleting}
      />
    </div>
  );
}

