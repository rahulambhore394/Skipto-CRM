import React, { useState } from 'react';
import { Plus, Pencil, Trash2, CheckCircle, Circle } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { taskService } from '../services/taskService';
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
import type { Task, FilterParams, TaskStatus, TaskPriority } from '../types';
import { format, isPast, parseISO } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/rbac';

const schema = z.object({
  title: z.string().min(1, 'Title required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  assignedUserId: z.string().optional(),
  relatedContactId: z.string().optional(),
  relatedDealId: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const priorityVariants: Record<TaskPriority, any> = { low: 'default', medium: 'info', high: 'warning', urgent: 'danger' };
const statusVariants: Record<TaskStatus, any> = { pending: 'warning', in_progress: 'info', completed: 'success', cancelled: 'default' };

export default function TasksPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterParams>({ page: 1, pageSize: 15 });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  const canViewAll = hasPermission(user?.role, 'view_all_records');
  const contacts = contactService.getAll();
  const deals = dealService.getAll();
  const users = userService.getAll();
  const result = taskService.getPaginated({ ...filters, assignedUserId: canViewAll ? undefined : user?.id });
  const overdueCount = taskService.getOverdue().length;

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', status: 'pending', assignedUserId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ priority: 'medium', status: 'pending', assignedUserId: user?.id ?? '' }); setEditTask(null); setModalOpen(true); };
  const openEdit = (t: Task) => {
    setEditTask(t);
    reset({ title: t.title, description: t.description ?? '', dueDate: t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '', priority: t.priority, status: t.status, assignedUserId: t.assignedUserId ?? '', relatedContactId: t.relatedContactId ?? '', relatedDealId: t.relatedDealId ?? '' });
    setModalOpen(true);
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const contact = contacts.find(c => c.id === data.relatedContactId);
      const deal = deals.find(d => d.id === data.relatedDealId);
      const payload = { ...data, relatedContactName: contact ? `${contact.firstName} ${contact.lastName}` : undefined, relatedDealName: deal?.dealName, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      if (editTask) { taskService.update(editTask.id, payload); toast.success('Task updated'); }
      else { taskService.create(payload); toast.success('Task created'); }
      setModalOpen(false); setFilters(f => ({ ...f }));
    } finally { setSaving(false); }
  };

  const toggleComplete = (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    taskService.update(task.id, { status: newStatus });
    toast.success(newStatus === 'completed' ? 'Task completed!' : 'Task reopened');
    setFilters(f => ({ ...f }));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-500">
            {result.total} total {overdueCount > 0 && <span className="text-red-500 font-medium">· {overdueCount} overdue</span>}
          </p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Task</Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-3">
          <SearchBar value={filters.search ?? ''} onChange={v => setFilters(f => ({ ...f, search: v, page: 1 }))} placeholder="Search tasks..." className="flex-1 min-w-48" />
          <select value={filters.status ?? ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined, page: 1 }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select value={filters.priority ?? ''} onChange={e => setFilters(f => ({ ...f, priority: e.target.value || undefined, page: 1 }))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      <Card padding={false}>
        {result.data.length === 0 ? (
          <EmptyState title="No tasks found" action={<Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Task</Button>} />
        ) : (
          <div>
            <div className="divide-y divide-gray-50">
              {result.data.map(t => {
                const isOverdue = t.dueDate && isPast(parseISO(t.dueDate)) && t.status !== 'completed' && t.status !== 'cancelled';
                return (
                  <div key={t.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/60 transition-colors ${t.status === 'completed' ? 'opacity-60' : ''}`}>
                    <button onClick={() => toggleComplete(t)} className="mt-0.5 shrink-0 text-gray-300 hover:text-emerald-500 transition-colors">
                      {t.status === 'completed' ? <CheckCircle size={20} className="text-emerald-500" /> : <Circle size={20} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${t.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant={priorityVariants[t.priority]} size="sm">{t.priority}</Badge>
                          <Badge variant={statusVariants[t.status]} size="sm">{t.status.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                      {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        {t.dueDate && (
                          <span className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {isOverdue ? '⚠️ Overdue · ' : '📅 '}{format(new Date(t.dueDate), 'MMM d, yyyy')}
                          </span>
                        )}
                        {t.relatedContactName && <span className="text-xs text-gray-400">👤 {t.relatedContactName}</span>}
                        {t.relatedDealName && <span className="text-xs text-gray-400">💼 {t.relatedDealName}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteId(t.id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-5 pb-3">
              <Pagination page={filters.page ?? 1} pageSize={filters.pageSize ?? 15} total={result.total} onChange={p => setFilters(f => ({ ...f, page: p }))} />
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTask ? 'Edit Task' : 'Add Task'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editTask ? 'Update' : 'Create'} Task</Button></>}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Input label="Task Title" {...register('title')} error={errors.title?.message} required /></div>
          <Controller name="priority" control={control} render={({ field }) => (
            <Select label="Priority" {...field} options={['low','medium','high','urgent'].map(p => ({ value: p, label: p.charAt(0).toUpperCase()+p.slice(1) }))} />
          )} />
          <Controller name="status" control={control} render={({ field }) => (
            <Select label="Status" {...field} options={['pending','in_progress','completed','cancelled'].map(s => ({ value: s, label: s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) }))} />
          )} />
          <Input label="Due Date" type="date" {...register('dueDate')} />
          <Controller name="assignedUserId" control={control} render={({ field }) => (
            <Select label="Assigned To" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} placeholder="Select user" />
          )} />
          <Controller name="relatedContactId" control={control} render={({ field }) => (
            <Select label="Related Contact" {...field} options={contacts.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))} placeholder="Select contact" />
          )} />
          <Controller name="relatedDealId" control={control} render={({ field }) => (
            <Select label="Related Deal" {...field} options={deals.map(d => ({ value: d.id, label: d.dealName }))} placeholder="Select deal" />
          )} />
          <div className="md:col-span-2"><Textarea label="Description" {...register('description')} /></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { taskService.delete(deleteId!); setDeleteId(null); setFilters(f => ({ ...f })); toast.success('Task deleted'); }} title="Delete Task" message="This will permanently delete the task." />
    </div>
  );
}

