import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { activityService } from '../services/activityService';
import { contactService } from '../services/contactService';
import { dealService } from '../services/dealService';
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
import type { Activity, FilterParams, ActivityType } from '../types';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/rbac';

const schema = z.object({
  type: z.enum(['call', 'meeting', 'email', 'note', 'follow_up']),
  subject: z.string().min(1, 'Subject required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date required'),
  ownerId: z.string().min(1, 'Owner required'),
  relatedContactId: z.string().optional(),
  relatedDealId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const typeIcons: Record<ActivityType, string> = { call: '📞', meeting: '📅', email: '📧', note: '📝', follow_up: '🔔' };
const typeVariants: Record<ActivityType, any> = { call: 'info', meeting: 'primary', email: 'default', note: 'warning', follow_up: 'success' };

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 15 });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editActivity, setEditActivity] = useState<Activity | null>(null);
  const [saving, setSaving] = useState(false);

  const canViewAll = hasPermission(user?.role, 'view_all_records');
  const contacts = contactService.getAll();
  const deals = dealService.getAll();
  const users = userService.getAll();
  const result = activityService.getPaginated({ ...filters, ownerId: canViewAll ? filters.ownerId : user?.id });

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'call', date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), ownerId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ type: 'call', date: format(new Date(), "yyyy-MM-dd'T'HH:mm"), ownerId: user?.id ?? '' }); setEditActivity(null); setModalOpen(true); };
  const openEdit = (a: Activity) => {
    setEditActivity(a);
    reset({ type: a.type, subject: a.subject, description: a.description ?? '', date: format(new Date(a.date), "yyyy-MM-dd'T'HH:mm"), ownerId: a.ownerId, relatedContactId: a.relatedContactId ?? '', relatedDealId: a.relatedDealId ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const contact = contacts.find(c => c.id === data.relatedContactId);
      const deal = deals.find(d => d.id === data.relatedDealId);
      const payload = { ...data, relatedContactName: contact ? `${contact.firstName} ${contact.lastName}` : undefined, relatedDealName: deal?.dealName, createdAt: new Date().toISOString() };
      if (editActivity) { activityService.update(editActivity.id, payload); toast.success('Activity updated'); }
      else { activityService.create(payload); toast.success('Activity logged'); }
      setModalOpen(false); setFilters(f => ({ ...f }));
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Activities</h2>
          <p className="text-sm text-gray-500">{result.total} total activities</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Log Activity</Button>
      </div>

      <Card>
        <SearchBar value={filters.search ?? ''} onChange={v => setFilters(f => ({ ...f, search: v, page: 1 }))} placeholder="Search activities..." className="max-w-sm" />
      </Card>

      <Card padding={false}>
        {result.data.length === 0 ? (
          <EmptyState title="No activities found" action={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Log Activity</Button>} />
        ) : (
          <div>
            <div className="relative p-5">
              <div className="absolute left-10 top-0 bottom-0 w-px bg-gray-100" />
              <div className="space-y-4">
                {result.data.map(a => (
                  <div key={a.id} className="flex items-start gap-4 relative">
                    <div className="w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-lg shrink-0 z-10">
                      {typeIcons[a.type]}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={typeVariants[a.type]} size="sm">{a.type.replace('_', ' ')}</Badge>
                            {a.relatedContactName && <span className="text-xs text-gray-500">· {a.relatedContactName}</span>}
                            {a.relatedDealName && <span className="text-xs text-gray-500">· {a.relatedDealName}</span>}
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{a.subject}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-xs text-gray-400">{format(new Date(a.date), 'MMM d, h:mm a')}</span>
                          <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-indigo-600"><Pencil size={13} /></button>
                          <button onClick={() => setDeleteId(a.id)} className="p-1.5 hover:bg-white rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={13} /></button>
                        </div>
                      </div>
                      {a.description && <p className="text-xs text-gray-500 mt-1">{a.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-5 pb-3 border-t border-gray-100">
              <Pagination page={filters.page ?? 1} pageSize={filters.pageSize ?? 15} total={result.total} onChange={p => setFilters(f => ({ ...f, page: p }))} />
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editActivity ? 'Edit Activity' : 'Log Activity'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editActivity ? 'Update' : 'Log'} Activity</Button></>}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller name="type" control={control} render={({ field }) => (
            <Select label="Activity Type" {...field} options={(['call','meeting','email','note','follow_up'] as ActivityType[]).map(t => ({ value: t, label: `${typeIcons[t]} ${t.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` }))} />
          )} />
          <Input label="Date & Time" type="datetime-local" {...register('date')} error={errors.date?.message} required />
          <div className="md:col-span-2"><Input label="Subject" {...register('subject')} error={errors.subject?.message} required /></div>
          <Controller name="relatedContactId" control={control} render={({ field }) => (
            <Select label="Related Contact" {...field} options={contacts.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))} placeholder="Select contact" />
          )} />
          <Controller name="relatedDealId" control={control} render={({ field }) => (
            <Select label="Related Deal" {...field} options={deals.map(d => ({ value: d.id, label: d.dealName }))} placeholder="Select deal" />
          )} />
          <Controller name="ownerId" control={control} render={({ field }) => (
            <Select label="Owner" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} required error={errors.ownerId?.message} />
          )} />
          <div className="md:col-span-2"><Textarea label="Description" {...register('description')} rows={4} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { activityService.delete(deleteId!); setDeleteId(null); setFilters(f => ({ ...f })); toast.success('Activity deleted'); }} title="Delete Activity" message="This will permanently delete the activity." />
    </div>
  );
}

