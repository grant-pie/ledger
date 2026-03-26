import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  standalone: false,
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = false;
  error = '';
  submitted = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.submitted = true;
        this.loading = false;
      },
      error: (err) => {
        this.error =
          err.status === 0
            ? 'Unable to reach the server. Please check your connection and try again.'
            : (err?.error?.message ?? 'Something went wrong. Please try again.');
        this.loading = false;
      },
    });
  }
}
