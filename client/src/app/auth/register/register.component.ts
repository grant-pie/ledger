import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: false,
})
export class RegisterComponent {
  form: FormGroup;
  error = '';
  loading = false;
  registeredEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.form = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      },
      { validators: passwordsMatch },
    );
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.authService.register({ email, password }).subscribe({
      next: () => {
        this.registeredEmail = email;
        this.loading = false;
      },
      error: (err) => {
        this.error = this.resolveError(err, email);
        this.loading = false;
      },
    });
  }

  private resolveError(err: any, email?: string): string {
    if (err.status === 0) {
      return 'Unable to reach the server. Please check your connection and try again.';
    }
    if (err.status === 500) {
      return `We could not send a verification email to ${email}. Please double-check the address and try again.`;
    }
    if (err.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    return err?.error?.message ?? 'Registration failed. Please try again.';
  }
}
