import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'ledger_theme';
  private darkSubject = new BehaviorSubject<boolean>(this.loadPreference());

  readonly isDark$ = this.darkSubject.asObservable();

  constructor() {
    this.apply(this.darkSubject.value);
  }

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  toggle(): void {
    const next = !this.darkSubject.value;
    this.darkSubject.next(next);
    localStorage.setItem(this.STORAGE_KEY, next ? 'dark' : 'light');
    this.apply(next);
  }

  private apply(dark: boolean): void {
    document.documentElement.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
  }

  private loadPreference(): boolean {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) return saved === 'dark';
    // Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}
