// ============================================================
// TYPES / MODELS
// ============================================================

export type UserRole = 'admin' | 'manager' | 'sales_rep';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  employeeCount?: number;
  annualRevenue?: number;
  ownerId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle?: string;
  companyId?: string;
  companyName?: string;
  source?: string;
  ownerId: string;
  status: 'active' | 'inactive' | 'lead';
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
  id: string;
  leadName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  source?: string;
  status: LeadStatus;
  priority: LeadPriority;
  ownerId: string;
  estimatedValue?: number;
  notes?: string;
  createdAt: string;
  lastContactDate?: string;
}

export type DealStage = 'new' | 'qualification' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  dealName: string;
  contactId?: string;
  contactName?: string;
  companyId?: string;
  companyName?: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string;
  ownerId: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedUserId?: string;
  relatedContactId?: string;
  relatedContactName?: string;
  relatedCompanyId?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'follow_up';

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  date: string;
  ownerId: string;
  relatedContactId?: string;
  relatedContactName?: string;
  relatedCompanyId?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface DashboardSummary {
  totalContacts: number;
  totalCompanies: number;
  totalLeads: number;
  activeDeals: number;
  totalRevenue: number;
  conversionRate: number;
  contactsGrowth: number;
  leadsGrowth: number;
  revenueGrowth: number;
  dealsGrowth: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  deals: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FilterParams {
  search?: string;
  status?: string;
  priority?: string;
  ownerId?: string;
  companyId?: string;
  stage?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

