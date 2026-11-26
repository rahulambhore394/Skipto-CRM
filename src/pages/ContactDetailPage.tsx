import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building2, User, Calendar, Tag } from 'lucide-react';
import { contactService } from '../services/contactService';
import { activityService } from '../services/activityService';
import { taskService } from '../services/taskService';
import { dealService } from '../services/dealService';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Card from '../components/ui/Card';
import { format } from 'date-fns';

const statusVariants: Record<string, 'success' | 'danger' | 'primary'> = {
  active: 'success', inactive: 'danger', lead: 'primary',
};

export default function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const contact = id ? contactService.getById(id) : undefined;
  const activities = id ? activityService.getForContact(id) : [];
  const tasks = id ? taskService.getAll().filter(t => t.relatedContactId === id) : [];
  const deals = id ? dealService.getAll().filter(d => d.contactId === id) : [];

  if (!contact) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Contact not found.</p>
      <Button variant="ghost" onClick={() => navigate('/contacts')} className="mt-2">Back to Contacts</Button>
    </div>
  );

  const typeIcons: Record<string, string> = { call: '📞', meeting: '📅', email: '📧', note: '📝', follow_up: '🔔' };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={16} />} onClick={() => navigate('/contacts')}>Contacts</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile card */}
        <div className="lg:col-span-1 space-y-5">
          <Card>
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-2xl mb-3">
                {contact.firstName.charAt(0)}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{contact.firstName} {contact.lastName}</h2>
              <p className="text-sm text-gray-500">{contact.jobTitle}</p>
              <Badge variant={statusVariants[contact.status] ?? 'default'} className="mt-2" dot>{contact.status}</Badge>
            </div>
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <a href={`mailto:${contact.email}`} className="text-indigo-600 hover:underline truncate">{contact.email}</a>
              </div>
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700">{contact.phone}</span>
                </div>
              )}
              {contact.companyName && (
                <div className="flex items-center gap-3 text-sm">
                  <Building2 size={16} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700">{contact.companyName}</span>
                </div>
              )}
              {contact.source && (
                <div className="flex items-center gap-3 text-sm">
                  <User size={16} className="text-gray-400 shrink-0" />
                  <span className="text-gray-700">Source: {contact.source}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                <span className="text-gray-500">Joined {format(new Date(contact.createdAt), 'MMM d, yyyy')}</span>
              </div>
            </div>
            {contact.tags && contact.tags.length > 0 && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag size={14} className="text-gray-400" />
                  {contact.tags.map(tag => <Badge key={tag} variant="primary" size="sm">{tag}</Badge>)}
                </div>
              </div>
            )}
            {contact.notes && (
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-gray-600">{contact.notes}</p>
              </div>
            )}
          </Card>

          {/* Related deals */}
          <Card padding={false}>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Related Deals ({deals.length})</h3>
            </div>
            {deals.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">No deals yet</p>
            ) : deals.map(d => (
              <div key={d.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0">
                <p className="text-sm font-medium text-gray-900">{d.dealName}</p>
                <p className="text-xs text-gray-400">${d.value.toLocaleString()} · {d.stage}</p>
              </div>
            ))}
          </Card>
        </div>

        {/* Right side */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tasks */}
          <Card padding={false}>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Tasks ({tasks.length})</h3>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">No tasks</p>
            ) : tasks.map(t => (
              <div key={t.id} className="px-4 py-3 border-b border-gray-50 last:border-b-0 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.title}</p>
                  {t.dueDate && <p className="text-xs text-gray-400">{format(new Date(t.dueDate), 'MMM d, yyyy')}</p>}
                </div>
                <Badge variant={t.status === 'completed' ? 'success' : t.status === 'in_progress' ? 'info' : 'warning'} size="sm">{t.status}</Badge>
              </div>
            ))}
          </Card>

          {/* Activity timeline */}
          <Card padding={false}>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Activity Timeline</h3>
            </div>
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 p-4 text-center">No activities yet</p>
            ) : (
              <div className="relative p-4">
                <div className="absolute left-8 top-0 bottom-0 w-px bg-gray-100" />
                <div className="space-y-5">
                  {activities.map(a => (
                    <div key={a.id} className="flex items-start gap-4 relative">
                      <div className="w-8 h-8 bg-white border-2 border-indigo-200 rounded-full flex items-center justify-center text-sm shrink-0 z-10">
                        {typeIcons[a.type] ?? '•'}
                      </div>
                      <div className="flex-1 bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                          <p className="text-xs text-gray-400">{format(new Date(a.date), 'MMM d, h:mm a')}</p>
                        </div>
                        {a.description && <p className="text-xs text-gray-500">{a.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

