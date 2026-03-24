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

export interface ITransaction {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: Date;
  notes?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser {
  id: string;
  email: string;
  currency: string;
  createdAt: Date;
}

export interface AuthResponse {
  accessToken: string;
  user: IUser;
}

export interface RegisterResponse {
  message: string;
}
