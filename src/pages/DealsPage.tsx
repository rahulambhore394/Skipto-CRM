import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { dealService } from '../services/dealService';
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
import type { Deal, FilterParams, DealStage } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/rbac';

const schema = z.object({
  dealName: z.string().min(1, 'Deal name required'),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  value: z.coerce.number().min(0, 'Value must be >= 0'),
  stage: z.enum(['new', 'qualification', 'proposal', 'negotiation', 'won', 'lost']),
  probability: z.coerce.number().min(0).max(100),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().min(1, 'Owner required'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const stageVariants: Record<DealStage, 'default' | 'info' | 'primary' | 'warning' | 'success' | 'danger'> = {
  new: 'default', qualification: 'info', proposal: 'primary', negotiation: 'warning', won: 'success', lost: 'danger',
};

export default function DealsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [saving, setSaving] = useState(false);

  const canViewAll = hasPermission(user?.role, 'view_all_records');
  const contacts = contactService.getAll();
  const companies = companyService.getAll();
  const users = userService.getAll();
  const result = dealService.getPaginated({ ...filters, ownerId: canViewAll ? filters.ownerId : user?.id });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { stage: 'new', probability: 20, ownerId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ stage: 'new', probability: 20, ownerId: user?.id ?? '' }); setEditDeal(null); setModalOpen(true); };
  const openEdit = (d: Deal) => {
    setEditDeal(d);
    reset({ dealName: d.dealName, contactId: d.contactId ?? '', companyId: d.companyId ?? '', value: d.value, stage: d.stage, probability: d.probability, expectedCloseDate: d.expectedCloseDate ? format(new Date(d.expectedCloseDate), 'yyyy-MM-dd') : '', ownerId: d.ownerId, description: d.description ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const contact = contacts.find(c => c.id === data.contactId);
      const company = companies.find(c => c.id === data.companyId);
      const payload = { ...data, contactName: contact ? `${contact.firstName} ${contact.lastName}` : undefined, companyName: company?.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (editDeal) { dealService.update(editDeal.id, payload); toast.success('Deal updated'); }
      else { dealService.create(payload); toast.success('Deal created'); }
      setModalOpen(false); setFilters(f => ({ ...f }));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Deals</h2>
          <p className="text-sm text-gray-500">{result.total} total deals · ${dealService.getTotalRevenue().toLocaleString()} total revenue</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Deal</Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          <SearchBar value={filters.search ?? ''} onChange={v => setFilters(f => ({ ...f, search: v, page: 1 }))} placeholder="Search deals..." className="flex-1 min-w-48" />
          <select value={filters.stage ?? ''} onChange={e => setFilters(f => ({ ...f, stage: e.target.value || undefined, page: 1 }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Stages</option>
            {(['new','qualification','proposal','negotiation','won','lost'] as DealStage[]).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
        </div>
      </Card>

      <Card padding={false}>
        {result.data.length === 0 ? (
          <EmptyState title="No deals found" action={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Deal</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Deal</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Value</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Probability</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Close Date</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.data.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{d.dealName}</p>
                      <p className="text-xs text-gray-400">{d.contactName ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{d.companyName ?? '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-gray-900">${d.value.toLocaleString()}</td>
                    <td className="px-5 py-3.5"><Badge variant={stageVariants[d.stage]} dot>{d.stage}</Badge></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-20">
                          <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${d.probability}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{d.probability}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs hidden lg:table-cell">{d.expectedCloseDate ? format(new Date(d.expectedCloseDate), 'MMM d, yyyy') : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editDeal ? 'Edit Deal' : 'Add Deal'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editDeal ? 'Update' : 'Create'} Deal</Button></>}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Deal Name" {...register('dealName')} error={errors.dealName?.message} required />
          <Input label="Deal Value ($)" type="number" {...register('value')} error={errors.value?.message} required />
          <Controller name="stage" control={control} render={({ field }) => (
            <Select label="Stage" {...field} options={['new','qualification','proposal','negotiation','won','lost'].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))} />
          )} />
          <Input label="Probability (%)" type="number" min={0} max={100} {...register('probability')} />
          <Controller name="contactId" control={control} render={({ field }) => (
            <Select label="Contact" {...field} options={contacts.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))} placeholder="Select contact" />
          )} />
          <Controller name="companyId" control={control} render={({ field }) => (
            <Select label="Company" {...field} options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Select company" />
          )} />
          <Input label="Expected Close Date" type="date" {...register('expectedCloseDate')} />
          <Controller name="ownerId" control={control} render={({ field }) => (
            <Select label="Owner" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} required error={errors.ownerId?.message} />
          )} />
          <div className="md:col-span-2"><Textarea label="Description" {...register('description')} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { dealService.delete(deleteId!); setDeleteId(null); setFilters(f => ({ ...f })); toast.success('Deal deleted'); }} title="Delete Deal" message="This will permanently delete the deal." />
    </div>
  );
}

