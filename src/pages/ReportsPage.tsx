import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { contactService } from '../services/contactService';
import { leadService } from '../services/leadService';
import { dealService } from '../services/dealService';
import { taskService } from '../services/taskService';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { format, subMonths } from 'date-fns';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#60a5fa','#a78bfa','#f97316'];

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n.toLocaleString()}`;
}

function MetricCard({ label, value, sub, color = 'text-indigo-600' }: any) {
  return (
    <Card>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
}

export default function ReportsPage() {
  const contacts = useMemo(() => contactService.getAll(), []);
  const leads = useMemo(() => leadService.getAll(), []);
  const deals = useMemo(() => dealService.getAll(), []);
  const tasks = useMemo(() => taskService.getAll(), []);

  const wonDeals = deals.filter(d => d.stage === 'won');
  const lostDeals = deals.filter(d => d.stage === 'lost');
  const totalRevenue = wonDeals.reduce((s, d) => s + d.value, 0);
  const conversionRate = leads.length > 0 ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100) : 0;
  const taskCompletionRate = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0;
  const pipelineValue = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost').reduce((s, d) => s + d.value, 0);

  // Revenue by month
  const revenueData = useMemo(() => {
    const months: Record<string, { revenue: number; deals: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      months[format(d, 'MMM yyyy')] = { revenue: 0, deals: 0 };
    }
    wonDeals.forEach(d => {
      const key = format(new Date(d.updatedAt), 'MMM yyyy');
      if (months[key]) { months[key].revenue += d.value; months[key].deals += 1; }
    });
    // Demo data
    const keys = Object.keys(months);
    const base = [22000, 35000, 28000, 42000, 38000, 55000];
    keys.forEach((k, i) => { if (months[k].revenue === 0) months[k].revenue = base[i] ?? 0; });
    return keys.map(k => ({ month: k.split(' ')[0], ...months[k] }));
  }, [wonDeals]);

  // Leads by status
  const leadsByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => { counts[l.status] = (counts[l.status] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [leads]);

  // Deals by stage
  const dealsByStage = useMemo(() => {
    const stages = ['new', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
    return stages.map(stage => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
    }));
  }, [deals]);

  function exportCSV() {
    const rows = [
      ['Metric', 'Value'],
      ['Total Contacts', contacts.length],
      ['Total Leads', leads.length],
      ['Total Deals', deals.length],
      ['Won Deals', wonDeals.length],
      ['Lost Deals', lostDeals.length],
      ['Total Revenue', totalRevenue],
      ['Pipeline Value', pipelineValue],
      ['Conversion Rate', `${conversionRate}%`],
      ['Task Completion Rate', `${taskCompletionRate}%`],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'crm-report.csv'; a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">CRM performance overview</p>
        </div>
        <Button variant="secondary" size="sm" icon={<Download size={16} />} onClick={exportCSV}>Export Report</Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue" value={fmt(totalRevenue)} sub={`${wonDeals.length} deals won`} color="text-emerald-600" />
        <MetricCard label="Pipeline Value" value={fmt(pipelineValue)} sub={`${deals.filter(d=>d.stage!=='won'&&d.stage!=='lost').length} active deals`} color="text-indigo-600" />
        <MetricCard label="Lead Conversion" value={`${conversionRate}%`} sub={`${leads.filter(l=>l.status==='converted').length} of ${leads.length} converted`} color="text-sky-600" />
        <MetricCard label="Task Completion" value={`${taskCompletionRate}%`} sub={`${tasks.filter(t=>t.status==='completed').length} of ${tasks.length} done`} color="text-amber-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Monthly Revenue Trend</h3>
            <p className="text-xs text-gray-400">Last 6 months</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leads by status */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Leads by Status</h3>
          </div>
          <div className="p-5 flex gap-4 items-center">
            <ResponsiveContainer width="40%" height={180}>
              <PieChart>
                <Pie data={leadsByStatus} cx="50%" cy="50%" outerRadius={70} paddingAngle={3} dataKey="value">
                  {leadsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {leadsByStatus.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-sm text-gray-600">{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Deals by stage */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Deals by Stage</h3>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dealsByStage} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" name="Deals" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Won vs Lost */}
        <Card padding={false}>
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Won vs Lost Deals</h3>
          </div>
          <div className="p-5 flex flex-col items-center justify-center gap-4">
            <ResponsiveContainer width="60%" height={160}>
              <PieChart>
                <Pie data={[{ name: 'Won', value: wonDeals.length }, { name: 'Lost', value: lostDeals.length }]} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={4}>
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-emerald-600">{wonDeals.length}</p>
                <p className="text-xs text-gray-500">Won · {fmt(wonDeals.reduce((s,d)=>s+d.value,0))}</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-500">{lostDeals.length}</p>
                <p className="text-xs text-gray-500">Lost · {fmt(lostDeals.reduce((s,d)=>s+d.value,0))}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary Table */}
      <Card padding={false}>
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Deal Pipeline Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Stage</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Count</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Total Value</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Avg Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dealsByStage.map(row => (
                <tr key={row.stage} className="hover:bg-gray-50">
                  <td className="px-5 py-3"><Badge variant={row.stage === 'Won' ? 'success' : row.stage === 'Lost' ? 'danger' : 'default'}>{row.stage}</Badge></td>
                  <td className="px-5 py-3 text-right font-medium">{row.count}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmt(row.value)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{row.count > 0 ? fmt(Math.round(row.value / row.count)) : '—'}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-5 py-3">Total</td>
                <td className="px-5 py-3 text-right">{deals.length}</td>
                <td className="px-5 py-3 text-right text-emerald-700">{fmt(deals.reduce((s,d)=>s+d.value,0))}</td>
                <td className="px-5 py-3 text-right">{fmt(Math.round(deals.reduce((s,d)=>s+d.value,0) / (deals.length || 1)))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

