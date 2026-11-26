import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Building2, Target, Briefcase, DollarSign, TrendingUp,
  TrendingDown, ArrowRight, CheckSquare, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { contactService } from '../services/contactService';
import { companyService } from '../services/companyService';
import { leadService } from '../services/leadService';
import { dealService } from '../services/dealService';
import { taskService } from '../services/taskService';
import { activityService } from '../services/activityService';
import { userService } from '../services/userService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission, scopeByOwner, scopeTasksByUser, ROLE_LABELS } from '../utils/rbac';

const STAGE_COLORS: Record<string, string> = {
  new: '#94a3b8',
  qualification: '#60a5fa',
  proposal: '#a78bfa',
  negotiation: '#f59e0b',
  won: '#10b981',
  lost: '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#94a3b8', contacted: '#60a5fa', qualified: '#a78bfa',
  proposal: '#f59e0b', negotiation: '#f97316', converted: '#10b981', lost: '#ef4444',
};

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function StatCard({ label, value, icon: Icon, trend, color, onClick }: any) {
  const isPos = trend > 0;
  return (
    <Card hover onClick={onClick} className="cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${isPos ? 'text-emerald-600' : 'text-red-500'}`}>
          {isPos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend)}%
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canViewAll = hasPermission(user?.role, 'view_all_records');
  const canViewCompanies = hasPermission(user?.role, 'view_companies');
  const canViewReports = hasPermission(user?.role, 'view_reports');

  const contacts = useMemo(() => scopeByOwner(contactService.getAll(), user), [user]);
  const companies = useMemo(() => companyService.getAll(), []);
  const leads = useMemo(() => scopeByOwner(leadService.getAll(), user), [user]);
  const deals = useMemo(() => scopeByOwner(dealService.getAll(), user), [user]);
  const tasks = useMemo(() => scopeTasksByUser(taskService.getAll(), user), [user]);
  const activities = useMemo(() => scopeByOwner(activityService.getAll(), user).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6), [user]);
  const users = useMemo(() => userService.getAll(), []);

  const totalRevenue = deals.filter(d => d.stage === 'won').reduce((s, d) => s + d.value, 0);
  const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').length;
  const convertedLeads = leads.filter(l => l.status === 'converted').length;
  const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

  // Revenue by month (last 6 months)
  const revenueData = useMemo(() => {
    const months: Record<string, { revenue: number; deals: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, 'MMM');
      months[key] = { revenue: 0, deals: 0 };
    }
    deals.filter(d => d.stage === 'won').forEach(d => {
      const key = format(new Date(d.updatedAt), 'MMM');
      if (months[key]) { months[key].revenue += d.value; months[key].deals += 1; }
    });
    // Add some variation for demo
    const keys = Object.keys(months);
    const base = [22000, 35000, 28000, 42000, 38000, 55000];
    keys.forEach((k, i) => { if (months[k].revenue === 0) months[k].revenue = base[i] ?? 0; });
    return keys.map(k => ({ month: k, ...months[k] }));
  }, [deals]);

  // Leads by status
  const leadStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.status] = (counts[l.status] ?? 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1), value: count,
      color: STATUS_COLORS[status] ?? '#94a3b8',
    }));
  }, [leads]);

  // Pipeline data
  const pipelineData = useMemo(() => {
    const stages = ['new', 'qualification', 'proposal', 'negotiation', 'won'];
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
      color: STAGE_COLORS[stage],
    }));
  }, [deals]);

  const recentContacts = contacts.slice(0, 5);
  const upcomingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled').slice(0, 5);
  const recentDeals = deals.slice(0, 4);

  const getUserName = (id: string) => users.find(u => u.id === id)?.name ?? 'Unknown';

  return (
    <div className="space-y-6">
      {/* Role Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-gray-100 rounded-xl px-5 py-3.5 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Welcome back, {user?.name}
          </h2>
          <p className="text-xs text-gray-500">
            {canViewAll
              ? 'Showing organization-wide team data & performance.'
              : 'Showing only your assigned contacts, leads, deals, and tasks.'}
          </p>
        </div>
        <Badge variant={user?.role === 'admin' ? 'danger' : user?.role === 'manager' ? 'warning' : 'info'}>
          {user?.role ? ROLE_LABELS[user.role] : 'User'}
        </Badge>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${canViewCompanies ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
        <StatCard label={canViewAll ? 'Total Contacts' : 'My Contacts'} value={contacts.length} icon={Users} trend={12} color="bg-indigo-500" onClick={() => navigate('/contacts')} />
        {canViewCompanies && (
          <StatCard label="Companies" value={companies.length} icon={Building2} trend={8} color="bg-sky-500" onClick={() => navigate('/companies')} />
        )}
        <StatCard label={canViewAll ? 'Total Leads' : 'My Leads'} value={leads.length} icon={Target} trend={-5} color="bg-amber-500" onClick={() => navigate('/leads')} />
        <StatCard label={canViewAll ? 'Active Deals' : 'My Active Deals'} value={activeDeals} icon={Briefcase} trend={15} color="bg-purple-500" onClick={() => navigate('/deals')} />
        <StatCard label={canViewAll ? 'Total Revenue' : 'My Revenue'} value={fmt(totalRevenue)} icon={DollarSign} trend={23} color="bg-emerald-500" onClick={() => navigate(canViewReports ? '/reports' : '/deals')} />
        <StatCard label="Conversion" value={`${conversionRate}%`} icon={TrendingUp} trend={3} color="bg-rose-500" onClick={() => navigate(canViewReports ? '/reports' : '/leads')} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Monthly Revenue</h3>
            <p className="text-xs text-gray-400 mt-0.5">Last 6 months performance</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leads by status */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Leads by Status</h3>
          </div>
          <div className="p-5 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {leadStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-2 w-full">
              {leadStatusData.slice(0, 6).map(d => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-600 truncate">{d.name}</span>
                  <span className="ml-auto text-xs font-semibold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Pipeline + recent deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pipeline overview */}
        <Card padding={false} className="lg:col-span-2">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Deal Pipeline</h3>
            <button onClick={() => navigate('/pipeline')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              View pipeline <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {pipelineData.map(stage => {
                const maxValue = Math.max(...pipelineData.map(s => s.value));
                const pct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                return (
                  <div key={stage.stage} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-24 shrink-0">{stage.stage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: stage.color }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-10 text-right">{stage.count}</span>
                    <span className="text-xs font-semibold text-gray-900 w-16 text-right">{fmt(stage.value)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Recent deals */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Deals</h3>
            <button onClick={() => navigate('/deals')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentDeals.map(d => (
              <div key={d.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{d.dealName}</p>
                    <p className="text-xs text-gray-400">{d.companyName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{fmt(d.value)}</p>
                    <span className="text-xs" style={{ color: STAGE_COLORS[d.stage] }}>{d.stage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent contacts */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Contacts</h3>
            <button onClick={() => navigate('/contacts')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {recentContacts.map(c => (
              <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                  {c.firstName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.firstName} {c.lastName}</p>
                  <p className="text-xs text-gray-400 truncate">{c.jobTitle} · {c.companyName}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming tasks */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Upcoming Tasks</h3>
            <button onClick={() => navigate('/tasks')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingTasks.map(t => {
              const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
              const priorityColors: Record<string, string> = { urgent: 'danger', high: 'warning', medium: 'info', low: 'default' };
              return (
                <div key={t.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <CheckSquare size={14} className={`mt-0.5 shrink-0 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
                      {t.dueDate && (
                        <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                          {isOverdue ? 'Overdue · ' : ''}{format(new Date(t.dueDate), 'MMM d')}
                        </p>
                      )}
                    </div>
                    <Badge variant={(priorityColors[t.priority] ?? 'default') as any} size="sm">{t.priority}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent activities */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Recent Activities</h3>
            <button onClick={() => navigate('/activities')} className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              All <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {activities.map(a => {
              const typeIcons: Record<string, string> = { call: '📞', meeting: '📅', email: '📧', note: '📝', follow_up: '🔔' };
              return (
                <div key={a.id} className="px-5 py-3">
                  <div className="flex items-start gap-2">
                    <span className="text-base">{typeIcons[a.type] ?? '•'}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.subject}</p>
                      <p className="text-xs text-gray-400 truncate">{a.relatedContactName} · {format(new Date(a.date), 'MMM d')}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

