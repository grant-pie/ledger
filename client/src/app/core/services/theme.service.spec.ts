import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ── Initialization ──────────────────────────────────────────────────────

  it('should default to light when no preference is saved and OS is light', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false } as MediaQueryList);
    service = TestBed.inject(ThemeService);
    expect(service.isDark).toBeFalse();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('should default to dark when no preference is saved and OS prefers dark', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    service = TestBed.inject(ThemeService);
    expect(service.isDark).toBeTrue();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should restore dark theme from localStorage', () => {
    localStorage.setItem('ledger_theme', 'dark');
    service = TestBed.inject(ThemeService);
    expect(service.isDark).toBeTrue();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('should restore light theme from localStorage', () => {
    localStorage.setItem('ledger_theme', 'light');
    service = TestBed.inject(ThemeService);
    expect(service.isDark).toBeFalse();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  // ── toggle ──────────────────────────────────────────────────────────────

  describe('toggle()', () => {
    beforeEach(() => {
      localStorage.setItem('ledger_theme', 'light');
      service = TestBed.inject(ThemeService);
    });

    it('should switch from light to dark', () => {
      service.toggle();
      expect(service.isDark).toBeTrue();
    });

    it('should switch from dark to light', () => {
      service.toggle(); // → dark
      service.toggle(); // → light
      expect(service.isDark).toBeFalse();
    });

    it('should apply data-bs-theme attribute on toggle', () => {
      service.toggle();
      expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
      service.toggle();
      expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
    });

    it('should persist preference to localStorage', () => {
      service.toggle();
      expect(localStorage.getItem('ledger_theme')).toBe('dark');
      service.toggle();
      expect(localStorage.getItem('ledger_theme')).toBe('light');
    });

    it('should emit new value on isDark$', (done) => {
      const emitted: boolean[] = [];
      service.isDark$.subscribe((val) => {
        emitted.push(val);
        if (emitted.length === 2) {
          expect(emitted).toEqual([false, true]);
          done();
        }
      });
      service.toggle();
    });
  });
});
