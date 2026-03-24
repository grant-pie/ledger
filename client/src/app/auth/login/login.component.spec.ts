import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/services/auth.service';
import { AuthResponse } from '../../shared/types/transaction.types';

const mockAuthResponse: AuthResponse = {
  accessToken: 'token',
  user: { id: '1', email: 'test@example.com', currency: 'USD', createdAt: '2024-01-01' },
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      declarations: [LoginComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  // ── Form validation ─────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('should be invalid with a bad email', () => {
    component.form.setValue({ email: 'not-an-email', password: 'password123' });
    expect(component.form.get('email')?.invalid).toBeTrue();
  });

  it('should be invalid with a password shorter than 8 characters', () => {
    component.form.setValue({ email: 'test@example.com', password: 'short' });
    expect(component.form.get('password')?.invalid).toBeTrue();
  });

  it('should be valid with correct email and password', () => {
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    expect(component.form.valid).toBeTrue();
  });

  // ── onSubmit ────────────────────────────────────────────────────────────

  it('should not call login when the form is invalid', () => {
    component.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should call authService.login with form values on submit', () => {
    authService.login.and.returnValue(of(mockAuthResponse));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should navigate to /dashboard on successful login', () => {
    authService.login.and.returnValue(of(mockAuthResponse));
    const navigateSpy = spyOn(router, 'navigate');
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(navigateSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should set loading to false after login error', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(component.loading).toBeFalse();
  });

  // ── Error messages ──────────────────────────────────────────────────────

  it('should show network error message on status 0', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 0 })));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(component.error).toContain('Unable to reach the server');
  });

  it('should show credentials error on 401', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(component.error).toBe('Incorrect email or password.');
  });

  it('should show unverified error and set showResendLink on 403', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 403 })));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(component.error).toContain('not been verified');
    expect(component.showResendLink).toBeTrue();
  });

  it('should show server error on 500', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 500 })));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(component.error).toContain('server error');
  });

  it('should reset showResendLink on a new error after 403', () => {
    authService.login.and.returnValue(throwError(() => ({ status: 403 })));
    component.form.setValue({ email: 'test@example.com', password: 'password123' });
    component.onSubmit();
    expect(component.showResendLink).toBeTrue();

    authService.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.onSubmit();
    expect(component.showResendLink).toBeFalse();
  });
});
