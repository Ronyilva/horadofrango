
export enum TransactionType {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA'
}

export interface Bank {
  id: string;
  name: string;
  color: string;
  initialBalance: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  bankId: string;
  categoryId: string;
  isPaid: boolean;
}

export interface DashboardData {
  totalRevenue: number;
  totalExpenses: number;
  totalPaid: number;
  totalToPay: number;
  totalToReceive: number;
  received: number;
}

export interface MonthHistory {
  monthYear: string;
  totalSold: number;
  totalCost: number;
  profit: number;
  margin: number;
}
