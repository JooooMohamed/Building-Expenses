export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'resident';
  buildingId: string;
}

export interface DashboardSummary {
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  currency: string;
}

export interface ExpenseShare {
  _id: string;
  expenseId: {
    _id: string;
    title: string;
    category: string;
  };
  amount: number;
  period: string;
  dueDate: string;
  status: 'unpaid' | 'partial' | 'paid';
  paidAmount: number;
}

export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  method: 'cash' | 'online' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentDate: string;
  notes?: string;
}

export interface AggregatedExpense {
  _id: string;
  total: number;
  count: number;
}

export interface Announcement {
  _id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'urgent';
  createdAt: string;
}

export interface AppNotification {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}
