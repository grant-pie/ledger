import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  standalone: false,
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  loading = false;
  error = '';
  success = false;
  token = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      },
      { validators: passwordsMatch },
    );
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (!this.token) {
      this.error = 'Invalid or missing reset token. Please request a new password reset.';
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.token) return;
    this.loading = true;
    this.error = '';

    this.authService.resetPassword(this.token, this.form.value.password).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
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
