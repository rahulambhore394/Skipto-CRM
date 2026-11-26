import React, { useState } from 'react';
import { Plus, Download, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { leadService } from '../services/leadService';
import { userService } from '../services/userService';
import { contactService } from '../services/contactService';
import { dealService } from '../services/dealService';
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
import type { Lead, FilterParams, LeadStatus, LeadPriority } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/rbac';

const schema = z.object({
  leadName: z.string().min(1, 'Lead name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  ownerId: z.string().min(1, 'Owner required'),
  estimatedValue: z.coerce.number().optional(),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const statusVariants: Record<LeadStatus, 'default' | 'info' | 'primary' | 'warning' | 'success' | 'danger'> = {
  new: 'default', contacted: 'info', qualified: 'primary', proposal: 'warning', negotiation: 'warning', converted: 'success', lost: 'danger',
};
const priorityVariants: Record<LeadPriority, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default', medium: 'info', high: 'warning', urgent: 'danger',
};

export default function LeadsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 10 });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [saving, setSaving] = useState(false);

  const canViewAll = hasPermission(user?.role, 'view_all_records');
  const users = userService.getAll();
  const result = leadService.getPaginated({ ...filters, ownerId: canViewAll ? filters.ownerId : user?.id });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { status: 'new', priority: 'medium', ownerId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ status: 'new', priority: 'medium', ownerId: user?.id ?? '' }); setEditLead(null); setModalOpen(true); };
  const openEdit = (l: Lead) => {
    setEditLead(l);
    reset({ leadName: l.leadName, email: l.email, phone: l.phone ?? '', company: l.company ?? '', jobTitle: l.jobTitle ?? '', source: l.source ?? '', status: l.status, priority: l.priority, ownerId: l.ownerId, estimatedValue: l.estimatedValue, notes: l.notes ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = { ...data, createdAt: new Date().toISOString(), lastContactDate: new Date().toISOString() };
      if (editLead) { leadService.update(editLead.id, payload); toast.success('Lead updated'); }
      else { leadService.create(payload); toast.success('Lead created'); }
      setModalOpen(false); setFilters(f => ({ ...f }));
    } finally { setSaving(false); }
  };

  const handleConvert = (lead: Lead) => {
    // Create contact + deal from lead
    const existingContact = contactService.getAll().find(c => c.email === lead.email);
    if (!existingContact) {
      const [firstName = lead.leadName, lastName = ''] = lead.leadName.split(' ');
      contactService.create({
        firstName, lastName, email: lead.email, phone: lead.phone, jobTitle: lead.jobTitle,
        companyName: lead.company, source: lead.source, ownerId: lead.ownerId,
        status: 'active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      });
    }
    dealService.create({
      dealName: lead.leadName, value: lead.estimatedValue ?? 0, stage: 'qualification',
      probability: 30, ownerId: lead.ownerId, description: lead.notes ?? '',
      companyName: lead.company, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    leadService.update(lead.id, { status: 'converted' });
    toast.success('Lead converted to contact & deal!');
    setConvertLead(null);
    setFilters(f => ({ ...f }));
  };

  function exportCSV() {
    const all = leadService.getAll();
    const headers = ['ID', 'Name', 'Email', 'Company', 'Status', 'Priority', 'Value', 'Created'];
    const rows = all.map(l => [l.id, l.leadName, l.email, l.company ?? '', l.status, l.priority, l.estimatedValue ?? '', format(new Date(l.createdAt), 'yyyy-MM-dd')]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leads.csv'; a.click();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Leads</h2>
          <p className="text-sm text-gray-500">{result.total} total leads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={exportCSV}>Export</Button>
          <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Lead</Button>
        </div>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          <SearchBar value={filters.search ?? ''} onChange={v => setFilters(f => ({ ...f, search: v, page: 1 }))} placeholder="Search leads..." className="flex-1 min-w-48" />
          <select value={filters.status ?? ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined, page: 1 }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            {(['new','contacted','qualified','proposal','negotiation','converted','lost'] as LeadStatus[]).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
          </select>
          <select value={filters.priority ?? ''} onChange={e => setFilters(f => ({ ...f, priority: e.target.value || undefined, page: 1 }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priority</option>
            {(['low','medium','high','urgent'] as LeadPriority[]).map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
          </select>
        </div>
      </Card>

      <Card padding={false}>
        {result.data.length === 0 ? (
          <EmptyState title="No leads found" action={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Lead</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Company</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Value</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {result.data.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{l.leadName}</p>
                      <p className="text-xs text-gray-400">{l.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{l.company ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={statusVariants[l.status]} dot>{l.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <Badge variant={priorityVariants[l.priority]}>{l.priority}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 font-medium hidden lg:table-cell">
                      {l.estimatedValue ? `$${l.estimatedValue.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {l.status !== 'converted' && l.status !== 'lost' && (
                          <button onClick={() => setConvertLead(l)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600" title="Convert to Deal">
                            <ArrowRight size={15} />
                          </button>
                        )}
                        <button onClick={() => openEdit(l)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"><Pencil size={15} /></button>
                        <button onClick={() => setDeleteId(l.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={15} /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editLead ? 'Edit Lead' : 'Add Lead'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editLead ? 'Update' : 'Create'} Lead</Button></>}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Lead Name" {...register('leadName')} error={errors.leadName?.message} required />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} required />
          <Input label="Phone" {...register('phone')} />
          <Input label="Company" {...register('company')} />
          <Input label="Job Title" {...register('jobTitle')} />
          <Input label="Source" {...register('source')} />
          <Controller name="status" control={control} render={({ field }) => (
            <Select label="Status" {...field} options={['new','contacted','qualified','proposal','negotiation','converted','lost'].map(s => ({ value: s, label: s.charAt(0).toUpperCase()+s.slice(1) }))} />
          )} />
          <Controller name="priority" control={control} render={({ field }) => (
            <Select label="Priority" {...field} options={['low','medium','high','urgent'].map(p => ({ value: p, label: p.charAt(0).toUpperCase()+p.slice(1) }))} />
          )} />
          <Controller name="ownerId" control={control} render={({ field }) => (
            <Select label="Owner" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} required error={errors.ownerId?.message} />
          )} />
          <Input label="Estimated Value ($)" type="number" {...register('estimatedValue')} />
          <div className="md:col-span-2"><Textarea label="Notes" {...register('notes')} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!convertLead} onClose={() => setConvertLead(null)} onConfirm={() => convertLead && handleConvert(convertLead)} title="Convert Lead" message={`Convert "${convertLead?.leadName}" to a Contact and Deal? This will create a new contact (if not duplicate) and a deal in the pipeline.`} confirmLabel="Convert Lead" confirmVariant="primary" />
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { leadService.delete(deleteId!); setDeleteId(null); setFilters(f => ({ ...f })); toast.success('Lead deleted'); }} title="Delete Lead" message="This will permanently delete the lead." />
    </div>
  );
}

