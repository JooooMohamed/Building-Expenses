import client from './client';
import type {
  DashboardSummary,
  ExpenseShare,
  Payment,
  AggregatedExpense,
  Announcement,
  AppNotification,
  ResidentBalance,
  PaginatedResponse,
} from '../types';

interface DashboardResponse {
  summary: DashboardSummary;
  recentDues: ExpenseShare[];
}

export async function getDashboard(): Promise<DashboardResponse> {
  const { data } = await client.get<DashboardResponse>('/me/dashboard');
  return data;
}

export async function getMyBalance(): Promise<ResidentBalance> {
  const { data } = await client.get<ResidentBalance>('/me/balance');
  return data;
}

export async function getMyExpenseShares(status?: string): Promise<ExpenseShare[]> {
  const params = status ? { status } : {};
  const { data } = await client.get<ExpenseShare[]>('/me/expense-shares', { params });
  return data;
}

export async function getMyPayments(): Promise<Payment[]> {
  const { data } = await client.get<Payment[]>('/me/payments');
  return data;
}

export async function getBuildingExpenses(period?: string): Promise<AggregatedExpense[]> {
  const params = period ? { period } : {};
  const { data } = await client.get<AggregatedExpense[]>('/building/expenses', { params });
  return data;
}

export async function getAnnouncements(): Promise<Announcement[]> {
  const { data } = await client.get<Announcement[]>('/building/announcements');
  return data;
}

export async function getNotifications(): Promise<PaginatedResponse<AppNotification>> {
  const { data } = await client.get<PaginatedResponse<AppNotification>>('/me/notifications');
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await client.patch('/me/notifications/read-all');
}

export async function markNotificationRead(id: string): Promise<void> {
  await client.patch(`/me/notifications/${id}/read`);
}

export async function initiatePayment(unitId: string, amount: number, expenseShareIds: string[]) {
  const { data } = await client.post('/payments/initiate', { unitId, amount, expenseShareIds });
  return data as { paymentId: string; paymentUrl: string; amount: number };
}
