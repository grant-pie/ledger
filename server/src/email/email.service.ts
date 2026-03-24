import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.from = config.get<string>('EMAIL_FROM', 'Ledger <noreply@yourdomain.com>');
    this.appUrl = config.get<string>('APP_URL', 'http://localhost:4200');
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const link = `${this.appUrl}/auth/verify-email?token=${token}`;

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: email,
      subject: 'Verify your Ledger account',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #0d6efd;">Welcome to Ledger!</h2>
          <p>Thanks for signing up. Please verify your email address to activate your account.</p>
          <a
            href="${link}"
            style="
              display: inline-block;
              margin: 16px 0;
              padding: 12px 24px;
              background: #0d6efd;
              color: #fff;
              text-decoration: none;
              border-radius: 6px;
              font-weight: bold;
            "
          >
            Verify Email
          </a>
          <p style="color: #6c757d; font-size: 13px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      this.logger.error('Failed to send verification email', error);
      throw new InternalServerErrorException('Could not send verification email');
    }
  }
}
