import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  standalone: false,
})
export class VerifyEmailComponent implements OnInit {
  state: 'verifying' | 'success' | 'error' = 'verifying';
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state = 'error';
      this.errorMessage = 'No verification token found.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.state = 'success';
        setTimeout(() => this.router.navigate(['/dashboard']), 2500);
      },
      error: (err) => {
        this.state = 'error';
        this.errorMessage =
          err?.error?.message ?? 'Verification failed. The link may have already been used.';
      },
    });
  }
}
