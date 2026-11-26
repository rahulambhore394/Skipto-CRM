import React, { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
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
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import type { Deal, DealStage } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { scopeByOwner } from '../utils/rbac';

const STAGES: { key: DealStage; label: string; color: string; bg: string }[] = [
  { key: 'new', label: 'New', color: 'text-gray-600', bg: 'bg-gray-100' },
  { key: 'qualification', label: 'Qualification', color: 'text-sky-600', bg: 'bg-sky-50' },
  { key: 'proposal', label: 'Proposal', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: 'negotiation', label: 'Negotiation', color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'won', label: 'Won', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'lost', label: 'Lost', color: 'text-red-600', bg: 'bg-red-50' },
];

const schema = z.object({
  dealName: z.string().min(1, 'Deal name required'),
  contactId: z.string().optional(),
  companyId: z.string().optional(),
  value: z.coerce.number().min(0),
  stage: z.enum(['new', 'qualification', 'proposal', 'negotiation', 'won', 'lost']),
  probability: z.coerce.number().min(0).max(100),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().min(1),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function DealCard({ deal, onEdit, onDelete, onStageChange }: { deal: Deal; onEdit: (d: Deal) => void; onDelete: (id: string) => void; onStageChange: (d: Deal, stage: DealStage) => void }) {
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const nextStages = STAGES.filter(s => s.key !== deal.stage);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow relative group">
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-semibold text-gray-900 leading-tight pr-6">{deal.dealName}</p>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(deal)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-indigo-600"><Pencil size={12} /></button>
          <button onClick={() => onDelete(deal.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"><Trash2 size={12} /></button>
        </div>
      </div>
      {deal.companyName && <p className="text-xs text-gray-400 mb-2">{deal.companyName}</p>}
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">${deal.value.toLocaleString()}</span>
        <div className="relative">
          <button
            onClick={() => setStageMenuOpen(!stageMenuOpen)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 rounded px-2 py-0.5 hover:border-indigo-300"
          >
            Move <ChevronRight size={10} />
          </button>
          {stageMenuOpen && (
            <div className="absolute right-0 bottom-6 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1 w-36">
              {nextStages.map(s => (
                <button key={s.key} onClick={() => { onStageChange(deal, s.key); setStageMenuOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 ${s.color}`}>
                  → {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="flex-1 bg-gray-100 rounded-full h-1">
          <div className="h-1 rounded-full bg-indigo-400" style={{ width: `${deal.probability}%` }} />
        </div>
        <span className="text-[10px] text-gray-400">{deal.probability}%</span>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const { user } = useAuth();
  const [allDeals, setDeals] = useState(() => dealService.getAll());
  const deals = useMemo(() => scopeByOwner(allDeals, user), [allDeals, user]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const contacts = contactService.getAll();
  const companies = companyService.getAll();
  const users = userService.getAll();

  const refresh = () => setDeals(dealService.getAll());

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: { stage: 'new', probability: 20, ownerId: user?.id ?? '' },
  });

  const openCreate = () => { reset({ stage: 'new', probability: 20, ownerId: user?.id ?? '' }); setEditDeal(null); setModalOpen(true); };
  const openEdit = (d: Deal) => {
    setEditDeal(d);
    reset({ dealName: d.dealName, contactId: d.contactId ?? '', companyId: d.companyId ?? '', value: d.value, stage: d.stage, probability: d.probability, ownerId: d.ownerId, description: d.description ?? '' });
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
      setModalOpen(false); refresh();
    } finally { setSaving(false); }
  };

  const handleStageChange = (deal: Deal, newStage: DealStage) => {
    const probMap: Record<DealStage, number> = { new: 10, qualification: 30, proposal: 50, negotiation: 75, won: 100, lost: 0 };
    dealService.update(deal.id, { stage: newStage, probability: probMap[newStage] });
    if (newStage === 'won') toast.success('🎉 Deal marked as Won!');
    refresh();
  };

  const totalPipelineValue = useMemo(() =>
    deals.filter(d => d.stage !== 'lost').reduce((s, d) => s + d.value, 0), [deals]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sales Pipeline</h2>
          <p className="text-sm text-gray-500">{deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length} active deals · ${totalPipelineValue.toLocaleString()} pipeline value</p>
        </div>
        <Button size="sm" icon={<Plus size={16} />} onClick={openCreate}>Add Deal</Button>
      </div>

      {/* Kanban board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          const stageValue = stageDeals.reduce((s, d) => s + d.value, 0);
          return (
            <div key={stage.key} className={`flex-shrink-0 w-64 rounded-xl ${stage.bg} border border-gray-200`}>
              <div className="p-3 border-b border-gray-200/70">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${stage.color}`}>{stage.label}</span>
                  <span className="bg-white text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">{stageDeals.length}</span>
                </div>
                <p className="text-xs text-gray-500">${stageValue.toLocaleString()}</p>
              </div>
              <div className="p-2 space-y-2 min-h-32">
                {stageDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} onEdit={openEdit} onDelete={(id) => setDeleteId(id)} onStageChange={handleStageChange} />
                ))}
                {stageDeals.length === 0 && (
                  <div className="text-center py-6 text-xs text-gray-400">No deals</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editDeal ? 'Edit Deal' : 'Add Deal'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button loading={saving} onClick={handleSubmit(onSubmit)}>{editDeal ? 'Update' : 'Create'} Deal</Button></>}
      >
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Deal Name" {...register('dealName')} error={errors.dealName?.message} required />
          <Input label="Deal Value ($)" type="number" {...register('value')} required />
          <Controller name="stage" control={control} render={({ field }) => (
            <Select label="Stage" {...field} options={STAGES.map(s => ({ value: s.key, label: s.label }))} />
          )} />
          <Input label="Probability (%)" type="number" min={0} max={100} {...register('probability')} />
          <Controller name="contactId" control={control} render={({ field }) => (
            <Select label="Contact" {...field} options={contacts.map(c => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))} placeholder="Select contact" />
          )} />
          <Controller name="companyId" control={control} render={({ field }) => (
            <Select label="Company" {...field} options={companies.map(c => ({ value: c.id, label: c.name }))} placeholder="Select company" />
          )} />
          <Controller name="ownerId" control={control} render={({ field }) => (
            <Select label="Owner" {...field} options={users.map(u => ({ value: u.id, label: u.name }))} required />
          )} />
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { dealService.delete(deleteId!); setDeleteId(null); refresh(); toast.success('Deal deleted'); }} title="Delete Deal" message="This will permanently delete the deal." />
    </div>
  );
}

