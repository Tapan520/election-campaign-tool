import apiClient from './client';

export interface ExpenseItem {
  id: number;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  payeeName?: string;
  voucherNumber?: string;
  isECCompliant: boolean;
  approvedByName?: string;
}

export const EXPENSE_CATEGORIES = [
  'Publicity', 'Transport', 'Food', 'Communication', 'Printing', 'Miscellaneous',
];

export const getExpenses = async (category?: string): Promise<ExpenseItem[]> => {
  const { data } = await apiClient.get<ExpenseItem[]>('/expenses',
    { params: category ? { category } : {} });
  return data;
};

export const createExpense = async (req: {
  description: string; category: string; amount: number;
  expenseDate: string; payeeName?: string; voucherNumber?: string; notes?: string;
}) => {
  const { data } = await apiClient.post('/expenses', req);
  return data;
};
