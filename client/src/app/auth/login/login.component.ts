import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  standalone: false,
})
export class LoginComponent {
  form: FormGroup;
  error = '';
  loading = false;
  showResendLink = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  private resolveError(err: any): string {
    this.showResendLink = false;
    if (err.status === 0) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    if (err.status === 401) {
      return 'Incorrect email or password.';
    }
    if (err.status === 403) {
      this.showResendLink = true;
      return 'Your email address has not been verified. Please check your inbox.';
    }
    if (err.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    return err?.error?.message ?? 'Login failed. Please try again.';
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = this.resolveError(err);
        this.loading = false;
      },
    });
  }
}
