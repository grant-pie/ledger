import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AuthResponse,
  RegisterResponse,
} from '../shared/types/transaction.types';

const RESEND_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes between resend attempts

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<RegisterResponse> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      if (!existing.isEmailVerified) {
        throw new ConflictException(
          'This email is already registered but not yet verified. Please check your inbox for the verification link.',
        );
      }
      throw new ConflictException('Email already in use');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const verificationToken = randomBytes(32).toString('hex');
    const user = await this.usersService.create(dto.email, hashed, verificationToken);

    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken);
    } catch (err) {
      // Roll back — user cannot verify without the email
      await this.usersService.deleteById(user.id);
      console.error('Registration rolled back — failed to send verification email:', err?.message);
      throw new InternalServerErrorException(
        'We could not send a verification email. Please try again later.',
      );
    }

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email address before logging in');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      accessToken: token,
      user: { id: user.id, email: user.email, currency: user.currency, createdAt: user.createdAt },
    };
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const verified = await this.usersService.verifyEmail(user);
    const jwt = this.jwtService.sign({ sub: verified.id, email: verified.email });
    return {
      accessToken: jwt,
      user: { id: verified.id, email: verified.email, currency: verified.currency, createdAt: verified.createdAt },
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const GENERIC_RESPONSE = {
      message: 'If an account exists for that email, a password reset link has been sent.',
    };

    const user = await this.usersService.findByEmail(email);
    if (!user || !user.isEmailVerified) return GENERIC_RESPONSE;

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await this.usersService.setPasswordResetToken(user, token, expiresAt);

    try {
      await this.emailService.sendPasswordResetEmail(user.email, token);
    } catch (err) {
      console.error('Failed to send password reset email:', err?.message);
      throw new InternalServerErrorException(
        'We could not send a password reset email. Please try again later.',
      );
    }

    return GENERIC_RESPONSE;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByPasswordResetToken(token);

    if (
      !user ||
      !user.passwordResetTokenExpiresAt ||
      new Date() > user.passwordResetTokenExpiresAt
    ) {
      throw new BadRequestException('This password reset link is invalid or has expired.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user, hashed);

    return { message: 'Your password has been reset. You can now log in.' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const GENERIC_RESPONSE = {
      message: 'If an unverified account exists for that email, a new verification link has been sent.',
    };

    const user = await this.usersService.findByEmail(email);

    // Return generic response for unknown or already-verified accounts
    // to prevent email enumeration
    if (!user || user.isEmailVerified) {
      return GENERIC_RESPONSE;
    }

    // Per-email cooldown check
    if (user.lastVerificationEmailSentAt) {
      const elapsed = Date.now() - new Date(user.lastVerificationEmailSentAt).getTime();
      if (elapsed < RESEND_COOLDOWN_MS) {
        const waitSecs = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new HttpException(
          `Please wait ${waitSecs} more second${waitSecs === 1 ? '' : 's'} before requesting another verification email.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const newToken = randomBytes(32).toString('hex');
    await this.usersService.refreshVerificationToken(user, newToken);

    try {
      await this.emailService.sendVerificationEmail(user.email, newToken);
    } catch (err) {
      console.error('Failed to resend verification email:', err?.message);
      throw new InternalServerErrorException(
        'We could not send a verification email. Please try again later.',
      );
    }

    return GENERIC_RESPONSE;
  }
}
