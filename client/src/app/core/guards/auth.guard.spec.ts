import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: false,
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authService },
      ],
    });

    guard = TestBed.inject(AuthGuard);
    router = TestBed.inject(Router);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should return true when the user is authenticated', () => {
    (Object.getOwnPropertyDescriptor(authService, 'isAuthenticated')!.get as jasmine.Spy)
      .and.returnValue(true);
    expect(guard.canActivate()).toBeTrue();
  });

  it('should return a UrlTree to /auth/login when not authenticated', () => {
    const result = guard.canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect((result as UrlTree).toString()).toBe('/auth/login');
  });
});
