import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-resend-verification',
  templateUrl: './resend-verification.component.html',
  standalone: false,
})
export class ResendVerificationComponent {
  form: FormGroup;
  successMessage = '';
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.successMessage = '';

    this.authService.resendVerificationEmail(this.form.value.email).subscribe({
      next: (res) => {
        this.successMessage = res.message;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.resolveError(err);
        this.loading = false;
      },
    });
  }

  private resolveError(err: any): string {
    if (err.status === 0) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    if (err.status === 429) {
      return err?.error?.message ?? 'Too many requests. Please wait before trying again.';
    }
    if (err.status >= 500) {
      return err?.error?.message ?? 'Failed to send verification email. Please try again later.';
    }
    return err?.error?.message ?? 'Something went wrong. Please try again.';
  }
}
