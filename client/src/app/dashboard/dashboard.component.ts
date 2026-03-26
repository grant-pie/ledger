import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransactionService } from '../core/services/transaction.service';
import { AuthService } from '../core/services/auth.service';
import { ThemeService } from '../core/services/theme.service';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  CURRENCIES,
  Currency,
} from '../shared/types/transaction.types';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  standalone: false,
})
export class DashboardComponent implements OnInit {
  transactions: Transaction[] = [];
  loading = true;
  error = '';

  // Filter
  readonly filterCategories = Object.values(TransactionCategory);
  selectedCategory: TransactionCategory | null = null;

  get filteredTransactions(): Transaction[] {
    if (!this.selectedCategory) return this.transactions;
    return this.transactions.filter((t) => t.category === this.selectedCategory);
  }

  // Currency
  readonly currencies: Currency[] = CURRENCIES;
  showCurrencyDropdown = false;
  get activeCurrency(): string {
    return this.authService.currentUser?.currency ?? 'USD';
  }

  get activeCurrencySymbol(): string {
    return (
      new Intl.NumberFormat('en', {
        style: 'currency',
        currency: this.activeCurrency,
      })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value ?? this.activeCurrency
    );
  }

  // Transaction modal
  showModal = false;
  editingTransaction: Transaction | null = null;
  saving = false;
  deleting: string | null = null;
  formError = '';

  form!: FormGroup;

  readonly types = Object.values(TransactionType);
  readonly categories = Object.values(TransactionCategory);
  readonly TransactionType = TransactionType;

  get totalIncome(): number {
    return this.transactions
      .filter((t) => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  get totalExpenses(): number {
    return this.transactions
      .filter((t) => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  get balance(): number {
    return this.totalIncome - this.totalExpenses;
  }

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    public themeService: ThemeService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  openAddModal(): void {
    this.editingTransaction = null;
    this.formError = '';
    this.form = this.buildForm();
    this.showModal = true;
  }

  openEditModal(t: Transaction): void {
    this.editingTransaction = t;
    this.formError = '';
    this.form = this.buildForm(t);
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTransaction = null;
  }

  saveTransaction(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.formError = '';

    const payload = { ...this.form.value, amount: Number(this.form.value.amount) };
    const request$ = this.editingTransaction
      ? this.transactionService.update(this.editingTransaction.id, payload)
      : this.transactionService.create(payload);

    request$.subscribe({
      next: () => {
        this.closeModal();
        this.loadTransactions();
        this.saving = false;
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.formError = Array.isArray(msg)
          ? msg.join(' ')
          : (msg ?? 'Failed to save transaction. Please try again.');
        this.saving = false;
      },
    });
  }

  deleteTransaction(id: string): void {
    if (!confirm('Delete this transaction?')) return;
    this.deleting = id;
    this.transactionService.delete(id).subscribe({
      next: () => {
        this.transactions = this.transactions.filter((t) => t.id !== id);
        this.deleting = null;
      },
      error: () => (this.deleting = null),
    });
  }

  setCurrency(code: string): void {
    this.showCurrencyDropdown = false;
    if (code === this.activeCurrency) return;
    this.authService.updateCurrency(code).subscribe();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  isIncome(t: Transaction): boolean {
    return t.type === TransactionType.INCOME;
  }

  private loadTransactions(): void {
    this.loading = true;
    this.transactionService.getAll().subscribe({
      next: (data) => {
        this.transactions = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load transactions.';
        this.loading = false;
      },
    });
  }

  private buildForm(t?: Transaction): FormGroup {
    const today = new Date().toISOString().split('T')[0];
    return this.fb.group({
      title: [t?.title ?? '', [Validators.required, Validators.maxLength(100)]],
      amount: [t?.amount ?? null, [Validators.required, Validators.min(0.01), Validators.max(999_999_999)]],
      type: [t?.type ?? TransactionType.EXPENSE, Validators.required],
      category: [t?.category ?? TransactionCategory.OTHER, Validators.required],
      date: [t?.date ? t.date.toString().split('T')[0] : today, Validators.required],
      notes: [t?.notes ?? '', Validators.maxLength(500)],
    });
  }
}
