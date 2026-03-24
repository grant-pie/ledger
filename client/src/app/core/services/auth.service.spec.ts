import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { AuthResponse, User } from '../../shared/types/transaction.types';
import { environment } from '../../../environments/environment';

const mockUser: User = {
  id: 'user-1',
  email: 'test@example.com',
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00.000Z',
};

const mockAuthResponse: AuthResponse = {
  accessToken: 'test-jwt-token',
  user: mockUser,
};

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // ── Initialization ──────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have null currentUser when localStorage is empty', () => {
    expect(service.currentUser).toBeNull();
  });

  // ── isAuthenticated ─────────────────────────────────────────────────────

  it('should return false for isAuthenticated when no token', () => {
    expect(service.isAuthenticated).toBeFalse();
  });

  it('should return true for isAuthenticated when token exists', () => {
    localStorage.setItem('ledger_token', 'some-token');
    expect(service.isAuthenticated).toBeTrue();
  });

  // ── login ───────────────────────────────────────────────────────────────

  it('should POST to /auth/login and save token and user', () => {
    service.login({ email: 'test@example.com', password: 'password123' }).subscribe((res) => {
      expect(res).toEqual(mockAuthResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password123' });
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('ledger_token')).toBe('test-jwt-token');
    expect(JSON.parse(localStorage.getItem('ledger_user')!)).toEqual(mockUser);
    expect(service.currentUser).toEqual(mockUser);
  });

  it('should update currentUser$ on login', (done) => {
    service.currentUser$.subscribe((user) => {
      if (user) {
        expect(user.email).toBe('test@example.com');
        done();
      }
    });

    service.login({ email: 'test@example.com', password: 'password123' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(mockAuthResponse);
  });

  // ── register ────────────────────────────────────────────────────────────

  it('should POST to /auth/register without saving a token', () => {
    service.register({ email: 'new@example.com', password: 'password123' }).subscribe((res) => {
      expect(res.message).toBeTruthy();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Registration successful.' });

    expect(localStorage.getItem('ledger_token')).toBeNull();
  });

  // ── logout ──────────────────────────────────────────────────────────────

  it('should clear localStorage and reset currentUser on logout', () => {
    localStorage.setItem('ledger_token', 'test-jwt-token');
    localStorage.setItem('ledger_user', JSON.stringify(mockUser));

    service.logout();

    expect(localStorage.getItem('ledger_token')).toBeNull();
    expect(localStorage.getItem('ledger_user')).toBeNull();
    expect(service.currentUser).toBeNull();
    expect(service.isAuthenticated).toBeFalse();
  });

  // ── verifyEmail ─────────────────────────────────────────────────────────

  it('should GET /auth/verify-email and save token on success', () => {
    service.verifyEmail('abc123').subscribe();

    const req = httpMock.expectOne(
      `${environment.apiUrl}/auth/verify-email?token=abc123`,
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAuthResponse);

    expect(localStorage.getItem('ledger_token')).toBe('test-jwt-token');
  });

  // ── resendVerificationEmail ─────────────────────────────────────────────

  it('should POST to /auth/resend-verification', () => {
    service.resendVerificationEmail('test@example.com').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-verification`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'test@example.com' });
    req.flush({ message: 'Sent.' });
  });

  // ── updateCurrency ──────────────────────────────────────────────────────

  it('should PATCH /users/me/currency and update stored user', () => {
    localStorage.setItem('ledger_user', JSON.stringify(mockUser));
    const updatedUser = { ...mockUser, currency: 'EUR' };

    service.updateCurrency('EUR').subscribe((user) => {
      expect(user.currency).toBe('EUR');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/users/me/currency`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ currency: 'EUR' });
    req.flush(updatedUser);

    expect(service.currentUser?.currency).toBe('EUR');
    expect(JSON.parse(localStorage.getItem('ledger_user')!).currency).toBe('EUR');
  });
});
