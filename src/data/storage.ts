import { v4 as uuidv4 } from 'uuid';
import type { User, Company, Contact, Lead, Deal, Task, Activity, Notification } from '../types';

// ─── Seed Helpers ─────────────────────────────────────────────────────────────
const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();
const daysFromNow = (n: number) => new Date(Date.now() + n * 86400000).toISOString();

// ─── Users ────────────────────────────────────────────────────────────────────
export const SEED_USERS: User[] = [
  { id: 'u1', name: 'Alex Johnson', email: 'admin@skipto.com', phone: '+1 555-0100', role: 'admin', createdAt: daysAgo(90) },
  { id: 'u2', name: 'Maria Garcia', email: 'maria@skipto.com', phone: '+1 555-0101', role: 'manager', createdAt: daysAgo(60) },
  { id: 'u3', name: 'James Wilson', email: 'james@skipto.com', phone: '+1 555-0102', role: 'sales_rep', createdAt: daysAgo(45) },
  { id: 'u4', name: 'Sarah Chen', email: 'sarah@skipto.com', phone: '+1 555-0103', role: 'sales_rep', createdAt: daysAgo(30) },
];

// ─── Companies ────────────────────────────────────────────────────────────────
export const SEED_COMPANIES: Company[] = [
  { id: 'co1', name: 'Acme Corporation', industry: 'Technology', website: 'https://acme.com', email: 'info@acme.com', phone: '+1 555-1000', address: '100 Tech Ave', city: 'San Francisco', state: 'CA', country: 'USA', employeeCount: 500, annualRevenue: 50000000, ownerId: 'u1', description: 'Leading tech firm', createdAt: daysAgo(80), updatedAt: daysAgo(5) },
  { id: 'co2', name: 'BlueSky Ventures', industry: 'Finance', website: 'https://bluesky.com', email: 'contact@bluesky.com', phone: '+1 555-2000', address: '200 Finance St', city: 'New York', state: 'NY', country: 'USA', employeeCount: 200, annualRevenue: 25000000, ownerId: 'u2', description: 'Investment and venture capital', createdAt: daysAgo(60), updatedAt: daysAgo(3) },
  { id: 'co3', name: 'GreenLeaf Solutions', industry: 'Healthcare', website: 'https://greenleaf.com', email: 'hello@greenleaf.com', phone: '+1 555-3000', address: '300 Health Blvd', city: 'Boston', state: 'MA', country: 'USA', employeeCount: 350, annualRevenue: 40000000, ownerId: 'u3', description: 'Healthcare technology solutions', createdAt: daysAgo(45), updatedAt: daysAgo(10) },
  { id: 'co4', name: 'Nova Retail Group', industry: 'Retail', website: 'https://novaretail.com', email: 'support@novaretail.com', phone: '+1 555-4000', address: '400 Commerce Dr', city: 'Chicago', state: 'IL', country: 'USA', employeeCount: 800, annualRevenue: 80000000, ownerId: 'u1', description: 'Multi-channel retail operations', createdAt: daysAgo(30), updatedAt: daysAgo(2) },
  { id: 'co5', name: 'Apex Manufacturing', industry: 'Manufacturing', website: 'https://apexmfg.com', email: 'sales@apexmfg.com', phone: '+1 555-5000', address: '500 Industrial Pkwy', city: 'Detroit', state: 'MI', country: 'USA', employeeCount: 1200, annualRevenue: 120000000, ownerId: 'u2', description: 'Industrial manufacturing', createdAt: daysAgo(20), updatedAt: daysAgo(1) },
  { id: 'co6', name: 'CloudSphere Inc', industry: 'Technology', website: 'https://cloudsphere.io', email: 'info@cloudsphere.io', phone: '+1 555-6000', address: '600 Cloud Way', city: 'Austin', state: 'TX', country: 'USA', employeeCount: 150, annualRevenue: 15000000, ownerId: 'u3', description: 'Cloud infrastructure provider', createdAt: daysAgo(15), updatedAt: now },
];

// ─── Contacts ─────────────────────────────────────────────────────────────────
export const SEED_CONTACTS: Contact[] = [
  { id: 'ct1', firstName: 'David', lastName: 'Brown', email: 'david.brown@acme.com', phone: '+1 555-1001', jobTitle: 'CTO', companyId: 'co1', companyName: 'Acme Corporation', source: 'Website', ownerId: 'u1', status: 'active', tags: ['VIP', 'Tech'], notes: 'Key decision maker', createdAt: daysAgo(70), updatedAt: daysAgo(5) },
  { id: 'ct2', firstName: 'Emily', lastName: 'Davis', email: 'emily.davis@bluesky.com', phone: '+1 555-2001', jobTitle: 'VP Finance', companyId: 'co2', companyName: 'BlueSky Ventures', source: 'Referral', ownerId: 'u2', status: 'active', tags: ['Finance'], notes: 'Met at conference', createdAt: daysAgo(55), updatedAt: daysAgo(3) },
  { id: 'ct3', firstName: 'Robert', lastName: 'Miller', email: 'robert.miller@greenleaf.com', phone: '+1 555-3001', jobTitle: 'Director', companyId: 'co3', companyName: 'GreenLeaf Solutions', source: 'Cold Outreach', ownerId: 'u3', status: 'active', tags: ['Healthcare'], notes: 'Interested in enterprise plan', createdAt: daysAgo(40), updatedAt: daysAgo(10) },
  { id: 'ct4', firstName: 'Jessica', lastName: 'Taylor', email: 'jessica.taylor@novaretail.com', phone: '+1 555-4001', jobTitle: 'CMO', companyId: 'co4', companyName: 'Nova Retail Group', source: 'LinkedIn', ownerId: 'u1', status: 'active', tags: ['Marketing', 'VIP'], notes: 'Needs quarterly review', createdAt: daysAgo(25), updatedAt: daysAgo(2) },
  { id: 'ct5', firstName: 'Michael', lastName: 'Anderson', email: 'michael.anderson@apexmfg.com', phone: '+1 555-5001', jobTitle: 'CEO', companyId: 'co5', companyName: 'Apex Manufacturing', source: 'Trade Show', ownerId: 'u2', status: 'active', tags: ['Executive', 'Manufacturing'], notes: 'CEO of large account', createdAt: daysAgo(18), updatedAt: daysAgo(1) },
  { id: 'ct6', firstName: 'Linda', lastName: 'Martinez', email: 'linda.martinez@cloudsphere.io', phone: '+1 555-6001', jobTitle: 'Product Manager', companyId: 'co6', companyName: 'CloudSphere Inc', source: 'Website', ownerId: 'u3', status: 'lead', tags: ['Tech', 'SaaS'], notes: 'Trial user', createdAt: daysAgo(12), updatedAt: now },
  { id: 'ct7', firstName: 'William', lastName: 'Thomas', email: 'william.thomas@acme.com', phone: '+1 555-1002', jobTitle: 'Sales Director', companyId: 'co1', companyName: 'Acme Corporation', source: 'Referral', ownerId: 'u1', status: 'active', tags: ['Sales'], notes: '', createdAt: daysAgo(8), updatedAt: now },
  { id: 'ct8', firstName: 'Sophia', lastName: 'Jackson', email: 'sophia.jackson@gmail.com', phone: '+1 555-7001', jobTitle: 'Consultant', source: 'Cold Outreach', ownerId: 'u4', status: 'inactive', tags: [], notes: 'Potential referral source', createdAt: daysAgo(5), updatedAt: now },
];

// ─── Leads ────────────────────────────────────────────────────────────────────
export const SEED_LEADS: Lead[] = [
  { id: 'l1', leadName: 'TechCorp Integration Deal', email: 'ceo@techcorp.com', phone: '+1 555-8001', company: 'TechCorp', jobTitle: 'CEO', source: 'Website', status: 'qualified', priority: 'high', ownerId: 'u1', estimatedValue: 75000, notes: 'Interested in full platform', createdAt: daysAgo(60), lastContactDate: daysAgo(3) },
  { id: 'l2', leadName: 'Retail Automation Project', email: 'ops@fastmart.com', phone: '+1 555-8002', company: 'FastMart', jobTitle: 'Operations Director', source: 'Trade Show', status: 'proposal', priority: 'urgent', ownerId: 'u2', estimatedValue: 120000, notes: 'Large-scale deployment needed', createdAt: daysAgo(45), lastContactDate: daysAgo(1) },
  { id: 'l3', leadName: 'Healthcare Data Platform', email: 'it@medgroup.com', phone: '+1 555-8003', company: 'MedGroup', jobTitle: 'IT Manager', source: 'Referral', status: 'new', priority: 'medium', ownerId: 'u3', estimatedValue: 45000, notes: 'Early stage discussion', createdAt: daysAgo(30), lastContactDate: daysAgo(7) },
  { id: 'l4', leadName: 'Financial Analytics Suite', email: 'cfo@capitalfund.com', phone: '+1 555-8004', company: 'Capital Fund', jobTitle: 'CFO', source: 'LinkedIn', status: 'contacted', priority: 'high', ownerId: 'u1', estimatedValue: 90000, notes: 'Follow-up scheduled', createdAt: daysAgo(20), lastContactDate: daysAgo(2) },
  { id: 'l5', leadName: 'Manufacturing ERP Integration', email: 'plant@steelworks.com', phone: '+1 555-8005', company: 'SteelWorks', jobTitle: 'Plant Manager', source: 'Cold Outreach', status: 'negotiation', priority: 'urgent', ownerId: 'u2', estimatedValue: 200000, notes: 'Final pricing discussion', createdAt: daysAgo(15), lastContactDate: daysAgo(0) },
  { id: 'l6', leadName: 'E-commerce Platform Upgrade', email: 'tech@shopquick.com', phone: '+1 555-8006', company: 'ShopQuick', jobTitle: 'CTO', source: 'Website', status: 'lost', priority: 'low', ownerId: 'u4', estimatedValue: 30000, notes: 'Went with competitor', createdAt: daysAgo(50), lastContactDate: daysAgo(20) },
  { id: 'l7', leadName: 'Logistics Software Deal', email: 'coo@fasttrack.com', phone: '+1 555-8007', company: 'FastTrack Logistics', jobTitle: 'COO', source: 'Referral', status: 'converted', priority: 'high', ownerId: 'u3', estimatedValue: 55000, notes: 'Converted to deal', createdAt: daysAgo(40), lastContactDate: daysAgo(5) },
  { id: 'l8', leadName: 'SaaS Startup Bundle', email: 'founder@startupx.io', phone: '+1 555-8008', company: 'StartupX', jobTitle: 'Founder', source: 'Website', status: 'new', priority: 'low', ownerId: 'u4', estimatedValue: 15000, notes: 'Early-stage startup', createdAt: daysAgo(5), lastContactDate: daysAgo(5) },
];

// ─── Deals ────────────────────────────────────────────────────────────────────
export const SEED_DEALS: Deal[] = [
  { id: 'd1', dealName: 'Acme Enterprise License', contactId: 'ct1', contactName: 'David Brown', companyId: 'co1', companyName: 'Acme Corporation', value: 85000, stage: 'proposal', probability: 60, expectedCloseDate: daysFromNow(30), ownerId: 'u1', description: 'Full enterprise platform license', createdAt: daysAgo(50), updatedAt: daysAgo(3) },
  { id: 'd2', dealName: 'BlueSky Analytics Package', contactId: 'ct2', contactName: 'Emily Davis', companyId: 'co2', companyName: 'BlueSky Ventures', value: 45000, stage: 'negotiation', probability: 80, expectedCloseDate: daysFromNow(14), ownerId: 'u2', description: 'Analytics and reporting suite', createdAt: daysAgo(35), updatedAt: daysAgo(1) },
  { id: 'd3', dealName: 'GreenLeaf Health Suite', contactId: 'ct3', contactName: 'Robert Miller', companyId: 'co3', companyName: 'GreenLeaf Solutions', value: 120000, stage: 'won', probability: 100, expectedCloseDate: daysAgo(5), ownerId: 'u3', description: 'Complete healthcare platform', createdAt: daysAgo(60), updatedAt: daysAgo(5) },
  { id: 'd4', dealName: 'Nova Retail Automation', contactId: 'ct4', contactName: 'Jessica Taylor', companyId: 'co4', companyName: 'Nova Retail Group', value: 200000, stage: 'qualification', probability: 30, expectedCloseDate: daysFromNow(60), ownerId: 'u1', description: 'Full retail automation system', createdAt: daysAgo(20), updatedAt: daysAgo(2) },
  { id: 'd5', dealName: 'Apex Manufacturing ERP', contactId: 'ct5', contactName: 'Michael Anderson', companyId: 'co5', companyName: 'Apex Manufacturing', value: 300000, stage: 'negotiation', probability: 75, expectedCloseDate: daysFromNow(21), ownerId: 'u2', description: 'ERP integration project', createdAt: daysAgo(15), updatedAt: daysAgo(0) },
  { id: 'd6', dealName: 'CloudSphere Starter Plan', contactId: 'ct6', contactName: 'Linda Martinez', companyId: 'co6', companyName: 'CloudSphere Inc', value: 12000, stage: 'new', probability: 20, expectedCloseDate: daysFromNow(45), ownerId: 'u3', description: 'Entry-level SaaS subscription', createdAt: daysAgo(10), updatedAt: now },
  { id: 'd7', dealName: 'Legacy Migration Project', contactId: 'ct7', contactName: 'William Thomas', companyId: 'co1', companyName: 'Acme Corporation', value: 55000, stage: 'lost', probability: 0, expectedCloseDate: daysAgo(10), ownerId: 'u1', description: 'Migration project - lost', createdAt: daysAgo(45), updatedAt: daysAgo(10) },
  { id: 'd8', dealName: 'FastTrack Logistics Platform', contactId: undefined, companyName: 'FastTrack Logistics', value: 55000, stage: 'won', probability: 100, expectedCloseDate: daysAgo(2), ownerId: 'u3', description: 'Logistics management platform', createdAt: daysAgo(40), updatedAt: daysAgo(2) },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const SEED_TASKS: Task[] = [
  { id: 't1', title: 'Follow up with David Brown', description: 'Discuss contract terms for enterprise license', dueDate: daysFromNow(2), priority: 'high', status: 'pending', assignedUserId: 'u1', relatedContactId: 'ct1', relatedContactName: 'David Brown', relatedDealId: 'd1', relatedDealName: 'Acme Enterprise License', createdAt: daysAgo(5), updatedAt: daysAgo(1) },
  { id: 't2', title: 'Prepare proposal for Nova Retail', description: 'Create detailed pricing proposal', dueDate: daysFromNow(5), priority: 'urgent', status: 'in_progress', assignedUserId: 'u1', relatedContactId: 'ct4', relatedContactName: 'Jessica Taylor', relatedDealId: 'd4', relatedDealName: 'Nova Retail Automation', createdAt: daysAgo(3), updatedAt: now },
  { id: 't3', title: 'Schedule demo with BlueSky', description: 'Product demo for analytics package', dueDate: daysFromNow(1), priority: 'high', status: 'pending', assignedUserId: 'u2', relatedContactId: 'ct2', relatedContactName: 'Emily Davis', relatedDealId: 'd2', relatedDealName: 'BlueSky Analytics Package', createdAt: daysAgo(2), updatedAt: now },
  { id: 't4', title: 'Send contract to Apex', description: 'Final contract documents for signature', dueDate: daysFromNow(0), priority: 'urgent', status: 'in_progress', assignedUserId: 'u2', relatedContactId: 'ct5', relatedContactName: 'Michael Anderson', relatedDealId: 'd5', relatedDealName: 'Apex Manufacturing ERP', createdAt: daysAgo(1), updatedAt: now },
  { id: 't5', title: 'Onboarding call with GreenLeaf', description: 'Post-sale onboarding session', dueDate: daysFromNow(7), priority: 'medium', status: 'pending', assignedUserId: 'u3', relatedContactId: 'ct3', relatedContactName: 'Robert Miller', relatedDealId: 'd3', relatedDealName: 'GreenLeaf Health Suite', createdAt: daysAgo(1), updatedAt: now },
  { id: 't6', title: 'Review Q4 pipeline', description: 'Quarterly pipeline review with team', dueDate: daysFromNow(10), priority: 'medium', status: 'pending', assignedUserId: 'u1', createdAt: daysAgo(1), updatedAt: now },
  { id: 't7', title: 'Update CRM contacts list', description: 'Clean up stale contacts', dueDate: daysAgo(2), priority: 'low', status: 'completed', assignedUserId: 'u4', createdAt: daysAgo(10), updatedAt: daysAgo(1) },
  { id: 't8', title: 'Cold email campaign setup', description: 'Setup automated email sequence', dueDate: daysAgo(1), priority: 'medium', status: 'pending', assignedUserId: 'u3', createdAt: daysAgo(5), updatedAt: daysAgo(1) },
];

// ─── Activities ───────────────────────────────────────────────────────────────
export const SEED_ACTIVITIES: Activity[] = [
  { id: 'ac1', type: 'call', subject: 'Initial discovery call', description: 'Discussed needs and requirements', date: daysAgo(5), ownerId: 'u1', relatedContactId: 'ct1', relatedContactName: 'David Brown', relatedDealId: 'd1', relatedDealName: 'Acme Enterprise License', createdAt: daysAgo(5) },
  { id: 'ac2', type: 'meeting', subject: 'Product demo meeting', description: 'Demonstrated full platform capabilities', date: daysAgo(3), ownerId: 'u2', relatedContactId: 'ct2', relatedContactName: 'Emily Davis', relatedDealId: 'd2', relatedDealName: 'BlueSky Analytics Package', createdAt: daysAgo(3) },
  { id: 'ac3', type: 'email', subject: 'Proposal sent', description: 'Sent detailed pricing proposal via email', date: daysAgo(2), ownerId: 'u1', relatedContactId: 'ct4', relatedContactName: 'Jessica Taylor', relatedDealId: 'd4', relatedDealName: 'Nova Retail Automation', createdAt: daysAgo(2) },
  { id: 'ac4', type: 'call', subject: 'Negotiation call', description: 'Discussed final pricing and terms', date: daysAgo(1), ownerId: 'u2', relatedContactId: 'ct5', relatedContactName: 'Michael Anderson', relatedDealId: 'd5', relatedDealName: 'Apex Manufacturing ERP', createdAt: daysAgo(1) },
  { id: 'ac5', type: 'note', subject: 'Contract signed', description: 'GreenLeaf signed the contract. Deal won!', date: daysAgo(5), ownerId: 'u3', relatedContactId: 'ct3', relatedContactName: 'Robert Miller', relatedDealId: 'd3', relatedDealName: 'GreenLeaf Health Suite', createdAt: daysAgo(5) },
  { id: 'ac6', type: 'follow_up', subject: 'Follow-up after demo', description: 'Sent follow-up email with additional resources', date: daysAgo(0), ownerId: 'u3', relatedContactId: 'ct6', relatedContactName: 'Linda Martinez', relatedDealId: 'd6', relatedDealName: 'CloudSphere Starter Plan', createdAt: daysAgo(0) },
  { id: 'ac7', type: 'meeting', subject: 'Kick-off meeting scheduled', description: 'Planned onboarding and implementation', date: daysFromNow(7), ownerId: 'u3', relatedContactId: 'ct3', relatedContactName: 'Robert Miller', relatedDealId: 'd3', relatedDealName: 'GreenLeaf Health Suite', createdAt: daysAgo(1) },
];

// ─── Notifications ─────────────────────────────────────────────────────────────
export const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Deal Won! 🎉', message: 'GreenLeaf Health Suite deal was marked as won ($120,000)', read: false, createdAt: daysAgo(5), type: 'success' },
  { id: 'n2', title: 'Task Overdue', message: 'Cold email campaign setup is past due date', read: false, createdAt: daysAgo(1), type: 'warning' },
  { id: 'n3', title: 'New Lead Assigned', message: 'SaaS Startup Bundle lead has been assigned to you', read: false, createdAt: daysAgo(5), type: 'info' },
  { id: 'n4', title: 'Contract Review Required', message: 'Apex Manufacturing ERP contract needs your review', read: true, createdAt: daysAgo(2), type: 'info' },
  { id: 'n5', title: 'Follow-up Reminder', message: 'Remember to follow up with David Brown today', read: true, createdAt: daysAgo(0), type: 'warning' },
];

// ─── Storage Keys ─────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  users: 'crm_users',
  companies: 'crm_companies',
  contacts: 'crm_contacts',
  leads: 'crm_leads',
  deals: 'crm_deals',
  tasks: 'crm_tasks',
  activities: 'crm_activities',
  notifications: 'crm_notifications',
  currentUser: 'crm_current_user',
};

// ─── Init Storage ─────────────────────────────────────────────────────────────
export function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.users)) {
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(SEED_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.companies)) {
    localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(SEED_COMPANIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.contacts)) {
    localStorage.setItem(STORAGE_KEYS.contacts, JSON.stringify(SEED_CONTACTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.leads)) {
    localStorage.setItem(STORAGE_KEYS.leads, JSON.stringify(SEED_LEADS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.deals)) {
    localStorage.setItem(STORAGE_KEYS.deals, JSON.stringify(SEED_DEALS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.tasks)) {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(SEED_TASKS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.activities)) {
    localStorage.setItem(STORAGE_KEYS.activities, JSON.stringify(SEED_ACTIVITIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.notifications)) {
    localStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(SEED_NOTIFICATIONS));
  }
}

// ─── Generic CRUD helpers ─────────────────────────────────────────────────────
export function getAll<T>(key: string): T[] {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

export function getById<T extends { id: string }>(key: string, id: string): T | undefined {
  return getAll<T>(key).find((item) => item.id === id);
}

export function saveAll<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export function createItem<T extends { id: string }>(key: string, item: Omit<T, 'id'>): T {
  const newItem = { ...item, id: uuidv4() } as T;
  const items = getAll<T>(key);
  saveAll(key, [...items, newItem]);
  return newItem;
}

export function updateItem<T extends { id: string }>(key: string, id: string, updates: Partial<T>): T | null {
  const items = getAll<T>(key);
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;
  const updated = { ...items[index], ...updates, updatedAt: new Date().toISOString() } as T;
  items[index] = updated;
  saveAll(key, items);
  return updated;
}

export function deleteItem<T extends { id: string }>(key: string, id: string): boolean {
  const items = getAll<T>(key);
  const filtered = items.filter((i) => i.id !== id);
  if (filtered.length === items.length) return false;
  saveAll(key, filtered);
  return true;
}

