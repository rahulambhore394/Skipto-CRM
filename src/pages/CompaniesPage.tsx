import React, { useState } from 'react';
import { Plus, Download, Pencil, Trash2, Eye, Globe, Mail, Phone } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
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
import type { Company, FilterParams } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const schema = z.object({
  name: z.string().min(1, 'Company name required'),
  industry: z.string().min(1, 'Industry required'),
  website: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  employeeCount: z.coerce.number().optional(),
  annualRevenue: z.coerce.number().optional(),
  ownerId: z.string().min(1, 'Owner required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Other'];

export default function CompaniesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  const users = userService.getAll();
  const result = companyService.getPaginated(filters);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { ownerId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ ownerId: user?.id ?? '' }); setEditCompany(null); setModalOpen(true); };
  const openEdit = (c: Company) => {
    setEditCompany(c);
    reset({ name: c.name, industry: c.industry, website: c.website ?? '', email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '', city: c.city ?? '', state: c.state ?? '', country: c.country ?? '', employeeCount: c.employeeCount, annualRevenue: c.annualRevenue, ownerId: c.ownerId, description: c.description ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = { ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (editCompany) {
        companyService.update(editCompany.id, payload);
        toast.success('Company updated');
      } else {
        companyService.create(payload);
        toast.success('Company created');
      }
      setModalOpen(false);
      setFilters(f => ({ ...f }));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Companies</h2>
          <p className="text-sm text-gray-500">{result.total} total companies</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Company</Button>
      </div>

      <Card>
        <SearchBar value={filters.search ?? ''} onChange={v => setFilters(f => ({ ...f, search: v, page: 1 }))} placeholder="Search companies..." className="max-w-sm" />
      </Card>

      {/* Grid view */}
      {result.data.length === 0 ? (
        <Card><EmptyState title="No companies found" action={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Company</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {result.data.map(c => (
            <Card key={c.id} hover>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center text-sky-700 font-bold text-base">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{c.name}</h3>
                    <Badge variant="primary" size="sm">{c.industry}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteId(c.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                {c.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail size={12} />{c.email}</div>}
                {c.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone size={12} />{c.phone}</div>}
                {c.website && <div className="flex items-center gap-2 text-xs text-indigo-600"><Globe size={12} /><a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">{c.website}</a></div>}
                {c.city && <div className="text-xs text-gray-400">{[c.city, c.state, c.country].filter(Boolean).join(', ')}</div>}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                {c.employeeCount && <span className="text-xs text-gray-500">{c.employeeCount.toLocaleString()} employees</span>}
                {c.annualRevenue && <span className="text-xs font-semibold text-emerald-600">${(c.annualRevenue / 1000000).toFixed(1)}M revenue</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
      {result.total > result.pageSize && (
        <div className="flex justify-center">
          <Pagination page={filters.page ?? 1} pageSize={filters.pageSize ?? 10} total={result.total} onChange={p => setFilters(f => ({ ...f, page: p }))} />
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCompany ? 'Edit Company' : 'Add Company'} size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={saving} onClick={handleSubmit(onSubmit)}>{editCompany ? 'Update' : 'Create'}</Button>
          </>
        }
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company Name" {...register('name')} error={errors.name?.message} required />
          <Controller name="industry" control={control} render={({ field }) => (
            <Select label="Industry" {...field} options={industries.map(i => ({ value: i, label: i }))} placeholder="Select industry" required error={errors.industry?.message} />
          )} />
          <Input label="Website" {...register('website')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Phone" {...register('phone')} />
          <Input label="Address" {...register('address')} />
          <Input label="City" {...register('city')} />
          <Input label="State" {...register('state')} />
          <Input label="Country" {...register('country')} />
          <Input label="Employee Count" type="number" {...register('employeeCount')} />
          <Input label="Annual Revenue ($)" type="number" {...register('annualRevenue')} />
          <Controller name="ownerId" control={control} render={({ field }) => (
            <Select label="Owner" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} required error={errors.ownerId?.message} />
          )} />
          <div className="md:col-span-2">
            <Textarea label="Description" {...register('description')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { companyService.delete(deleteId!); setDeleteId(null); setFilters(f => ({ ...f })); toast.success('Company deleted'); }} title="Delete Company" message="This will permanently delete the company record." loading={deleting} />
    </div>
  );
}

