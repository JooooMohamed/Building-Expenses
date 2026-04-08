// ── Common ──────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'resident';
  buildingId: string;
  unitIds?: string[];
  paymentFrequency?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Resident Types ─────────────────────────────

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
  residentId?: { _id: string; firstName: string; lastName: string; email: string };
  unitId?: { _id: string; unitNumber: string };
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
  createdBy?: { firstName: string; lastName: string };
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

// ── Admin Types ────────────────────────────────

export interface Building {
  _id: string;
  name: string;
  address: {
    street: string;
    city: string;
    district?: string;
    postalCode?: string;
  };
  totalUnits: number;
  currency: string;
  settings: {
    paymentGateway: string;
    lateFeePercentage: number;
    dueDayOfMonth: number;
  };
}

export interface Unit {
  _id: string;
  unitNumber: string;
  floor: number;
  shareCoefficient: number;
  residentId: { _id: string; firstName: string; lastName: string; email: string } | null;
  type: 'apartment' | 'commercial' | 'parking';
  area: number;
  isOccupied: boolean;
}

export interface Expense {
  _id: string;
  title: string;
  description?: string;
  category: 'fixed' | 'maintenance' | 'elevator' | 'project' | 'emergency';
  amount: number;
  currency: string;
  isRecurring: boolean;
  status: 'active' | 'cancelled';
  date: string;
  createdAt: string;
}

export interface Project {
  _id: string;
  title: string;
  description?: string;
  estimatedCost: number;
  actualCost: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate?: string;
  endDate?: string;
}

export interface BillingPeriod {
  _id: string;
  period: string;
  startDate: string;
  endDate: string;
  dueDate: string;
  totalCharged: number;
  totalCollected: number;
  status: 'open' | 'closed' | 'finalized';
}

export interface ResidentCharge {
  _id: string;
  unitId: { _id: string; unitNumber: string; floor: number };
  residentId: { _id: string; firstName: string; lastName: string; email: string };
  period: string;
  amount: number;
  paidAmount: number;
  status: 'unpaid' | 'partial' | 'paid' | 'waived' | 'cancelled';
  dueDate: string;
  chargeType: string;
  description?: string;
}

export interface ResidentBalance {
  totalCharged: number;
  totalPaid: number;
  remainingBalance: number;
  unpaidCount: number;
  nextDueDate: string | null;
  currency: string;
}

export interface MonthlyReport {
  period: string;
  expenses: Record<string, number> & { total: number };
  collections: {
    expected: number;
    collected: number;
    collectionRate: number;
    byMethod: Record<string, number>;
  };
  outstanding: {
    total: number;
    residentCount: number;
  };
}

export interface CollectionStatus {
  residents: Array<{
    residentId: string;
    name: string;
    unit: string;
    totalDue: number;
    totalPaid: number;
    status: 'paid' | 'partial' | 'unpaid';
  }>;
  summary: {
    paid: number;
    partial: number;
    unpaid: number;
    total: number;
  };
}

export interface AuditLogEntry {
  _id: string;
  userId: { firstName: string; lastName: string; email: string };
  action: string;
  resource: string;
  details?: Record<string, unknown>;
  createdAt: string;
}
