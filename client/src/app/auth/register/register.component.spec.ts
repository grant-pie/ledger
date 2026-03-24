import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../core/services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj('AuthService', ['register']);

    await TestBed.configureTestingModule({
      declarations: [RegisterComponent],
      imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
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
    component.form.setValue({ email: 'bad', password: 'password123', confirmPassword: 'password123' });
    expect(component.form.get('email')?.invalid).toBeTrue();
  });

  it('should be invalid when password is shorter than 8 characters', () => {
    component.form.setValue({ email: 'a@b.com', password: 'short', confirmPassword: 'short' });
    expect(component.form.get('password')?.invalid).toBeTrue();
  });

  it('should be invalid when passwords do not match', () => {
    component.form.setValue({
      email: 'a@b.com',
      password: 'password123',
      confirmPassword: 'different1',
    });
    expect(component.form.hasError('passwordMismatch')).toBeTrue();
  });

  it('should be invalid when confirmPassword is shorter than 8 characters', () => {
    component.form.setValue({
      email: 'a@b.com',
      password: 'password123',
      confirmPassword: 'short',
    });
    expect(component.form.get('confirmPassword')?.invalid).toBeTrue();
  });

  it('should be valid with matching email, password and confirmPassword', () => {
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(component.form.valid).toBeTrue();
  });

  // ── onSubmit ────────────────────────────────────────────────────────────

  it('should not call register when the form is invalid', () => {
    component.onSubmit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should call authService.register with only email and password (not confirmPassword)', () => {
    authService.register.and.returnValue(of({ message: 'Success' }));
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(authService.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should set registeredEmail on success', () => {
    authService.register.and.returnValue(of({ message: 'Success' }));
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.registeredEmail).toBe('test@example.com');
  });

  it('should set loading to false after success', () => {
    authService.register.and.returnValue(of({ message: 'Success' }));
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.loading).toBeFalse();
  });

  // ── Error messages ──────────────────────────────────────────────────────

  it('should show network error on status 0', () => {
    authService.register.and.returnValue(throwError(() => ({ status: 0 })));
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.error).toContain('Unable to reach the server');
  });

  it('should show server message on 409 conflict', () => {
    authService.register.and.returnValue(
      throwError(() => ({ status: 409, error: { message: 'Email already in use' } })),
    );
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.error).toBe('Email already in use');
  });

  it('should show server error message on 500', () => {
    authService.register.and.returnValue(
      throwError(() => ({
        status: 500,
        error: { message: 'We could not send a verification email.' },
      })),
    );
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.error).toContain('verification email');
  });

  it('should set loading to false after error', () => {
    authService.register.and.returnValue(throwError(() => ({ status: 500 })));
    component.form.setValue({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    component.onSubmit();
    expect(component.loading).toBeFalse();
  });
});
