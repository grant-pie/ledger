export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionCategory {
  FOOD = 'food',
  TRANSPORT = 'transport',
  HOUSING = 'housing',
  ENTERTAINMENT = 'entertainment',
  HEALTH = 'health',
  EDUCATION = 'education',
  SALARY = 'salary',
  FREELANCE = 'freelance',
  INVESTMENT = 'investment',
  OTHER = 'other',
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  currency: string;
  createdAt: string;
}

export interface Currency {
  code: string;
  name: string;
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'KRW', name: 'South Korean Won' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'HKD', name: 'Hong Kong Dollar' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'NZD', name: 'New Zealand Dollar' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'AED', name: 'UAE Dirham' },
];

export interface AuthResponse {
  accessToken: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
}

export interface CreateTransactionPayload {
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  notes?: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;
