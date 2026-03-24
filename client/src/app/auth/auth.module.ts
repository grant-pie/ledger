import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { ResendVerificationComponent } from './resend-verification/resend-verification.component';

@NgModule({
  declarations: [LoginComponent, RegisterComponent, VerifyEmailComponent, ResendVerificationComponent],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, AuthRoutingModule],
})
export class AuthModule {}
