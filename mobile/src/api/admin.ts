import client from './client';
import type {
  User,
  Unit,
  Expense,
  Project,
  Payment,
  Building,
  BillingPeriod,
  ResidentCharge,
  MonthlyReport,
  CollectionStatus,
  PaginatedResponse,
  AuditLogEntry,
} from '../types';

// ── Building ──────────────────────────────────

export async function getBuilding(): Promise<Building> {
  const { data } = await client.get<Building>('/admin/buildings/current');
  return data;
}

export async function updateBuilding(id: string, updates: Partial<Building>): Promise<Building> {
  const { data } = await client.patch<Building>(`/admin/buildings/${id}`, updates);
  return data;
}

// ── Residents ─────────────────────────────────

export async function getResidents(): Promise<User[]> {
  const { data } = await client.get<any[]>('/admin/residents');
  // Normalize _id → id for consistency with login response
  return data.map((r) => ({ ...r, id: r.id || r._id }));
}

export async function getResident(id: string): Promise<User> {
  const { data } = await client.get<any>(`/admin/residents/${id}`);
  return { ...data, id: data.id || data._id };
}

export async function createResident(resident: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  unitIds?: string[];
}): Promise<User> {
  const { data } = await client.post<User>('/admin/residents', resident);
  return data;
}

export async function updateResident(id: string, updates: Partial<User>): Promise<User> {
  const { data } = await client.patch<User>(`/admin/residents/${id}`, updates);
  return data;
}

export async function deactivateResident(id: string): Promise<void> {
  await client.delete(`/admin/residents/${id}`);
}

// ── Units ─────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  const { data } = await client.get<Unit[]>('/admin/units');
  return data;
}

export async function createUnit(unit: {
  unitNumber: string;
  floor: number;
  area?: number;
  shareCoefficient?: number;
  type?: string;
}): Promise<Unit> {
  const { data } = await client.post<Unit>('/admin/units', unit);
  return data;
}

export async function updateUnit(id: string, updates: Partial<Unit>): Promise<Unit> {
  const { data } = await client.patch<Unit>(`/admin/units/${id}`, updates);
  return data;
}

export async function assignResident(unitId: string, residentId: string): Promise<Unit> {
  const { data } = await client.patch<Unit>(`/admin/units/${unitId}/assign`, { residentId });
  return data;
}

export async function unassignResident(unitId: string): Promise<Unit> {
  const { data } = await client.patch<Unit>(`/admin/units/${unitId}/unassign`);
  return data;
}

// ── Expenses ──────────────────────────────────

export async function getExpenses(category?: string): Promise<Expense[]> {
  const params = category ? { category } : {};
  const { data } = await client.get<Expense[]>('/admin/expenses', { params });
  return data;
}

export async function createExpense(expense: {
  title: string;
  description?: string;
  category: string;
  amount: number;
  isRecurring?: boolean;
  date: string;
  projectId?: string;
}): Promise<Expense> {
  const { data } = await client.post<Expense>('/admin/expenses', expense);
  return data;
}

export async function cancelExpense(id: string): Promise<void> {
  await client.delete(`/admin/expenses/${id}`);
}

// ── Projects ──────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const { data } = await client.get<Project[]>('/admin/projects');
  return data;
}

export async function createProject(project: {
  title: string;
  description?: string;
  estimatedCost: number;
  startDate?: string;
}): Promise<Project> {
  const { data } = await client.post<Project>('/admin/projects', project);
  return data;
}

export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const { data } = await client.patch<Project>(`/admin/projects/${id}`, updates);
  return data;
}

// ── Billing ───────────────────────────────────

export async function getBillingPeriods(): Promise<BillingPeriod[]> {
  const { data } = await client.get<BillingPeriod[]>('/admin/billing/periods');
  return data;
}

export async function generateCharges(period: string, notes?: string) {
  const { data } = await client.post('/admin/billing/generate', { period, notes });
  return data;
}

export async function getPeriodCharges(period: string): Promise<{
  charges: ResidentCharge[];
  summary: { total: number; totalAmount: number; totalPaid: number; paid: number; partial: number; unpaid: number };
}> {
  const { data } = await client.get('/admin/billing/charges', { params: { period } });
  return data;
}

export async function createAssessment(assessment: {
  title: string;
  amount: number;
  period: string;
  distributionMethod?: string;
  description?: string;
}) {
  const { data } = await client.post('/admin/billing/assessment', assessment);
  return data;
}

export async function getOverdueCharges(): Promise<ResidentCharge[]> {
  const { data } = await client.get<ResidentCharge[]>('/admin/billing/overdue');
  return data;
}

export async function getResidentUnpaidCharges(residentId: string): Promise<ResidentCharge[]> {
  const { data } = await client.get<ResidentCharge[]>(`/admin/billing/resident-unpaid/${residentId}`);
  return data;
}

// ── Payments ──────────────────────────────────

export async function getAllPayments(
  status?: string,
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<Payment>> {
  const params: Record<string, string | number> = { page, limit };
  if (status) params.status = status;
  const { data } = await client.get<PaginatedResponse<Payment>>('/admin/payments', { params });
  return data;
}

export async function recordCashPayment(payment: {
  residentId: string;
  unitId: string;
  amount: number;
  paymentDate: string;
  expenseShareIds: string[];
  notes?: string;
}) {
  const { data } = await client.post('/admin/payments/cash', payment);
  return data;
}

// ── Reports ───────────────────────────────────

export async function getMonthlyReport(month: string): Promise<MonthlyReport> {
  const { data } = await client.get<MonthlyReport>('/admin/reports/monthly', { params: { month } });
  return data;
}

export async function getCollectionStatus(month: string): Promise<CollectionStatus> {
  const { data } = await client.get<CollectionStatus>('/admin/reports/collection', { params: { month } });
  return data;
}

// ── Announcements ─────────────────────────────

export async function createAnnouncement(announcement: {
  title: string;
  body: string;
  priority?: string;
}) {
  const { data } = await client.post('/admin/announcements', announcement);
  return data;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await client.delete(`/admin/announcements/${id}`);
}

// ── Audit Logs ────────────────────────────────

export async function getAuditLogs(
  page = 1,
  limit = 50,
  action?: string,
): Promise<PaginatedResponse<AuditLogEntry>> {
  const params: Record<string, string | number> = { page, limit };
  if (action) params.action = action;
  const { data } = await client.get<PaginatedResponse<AuditLogEntry>>('/admin/audit-logs', { params });
  return data;
}
