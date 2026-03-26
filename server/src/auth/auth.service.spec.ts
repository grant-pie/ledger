import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    currency: 'USD',
    isEmailVerified: true,
    emailVerificationToken: null,
    lastVerificationEmailSentAt: null,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    transactions: [],
    ...overrides,
  } as User);

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findByVerificationToken: jest.fn(),
            findByPasswordResetToken: jest.fn(),
            create: jest.fn(),
            deleteById: jest.fn(),
            verifyEmail: jest.fn(),
            refreshVerificationToken: jest.fn(),
            setPasswordResetToken: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('test-jwt') },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
  });

  // ── register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should throw ConflictException when email is already verified', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ isEmailVerified: true }));
      await expect(service.register({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException with unverified message when email exists but unverified', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ isEmailVerified: false }));
      await expect(service.register({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow('not yet verified');
    });

    it('should create user and send verification email on success', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(makeUser());
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register({ email: 'test@example.com', password: 'password123' });

      expect(usersService.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Registration successful');
    });

    it('should roll back user creation when email send fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue(makeUser());
      emailService.sendVerificationEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.register({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow(InternalServerErrorException);

      expect(usersService.deleteById).toHaveBeenCalledWith('user-1');
    });
  });

  // ── login ─────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ password: await bcrypt.hash('correct', 10) }));
      await expect(service.login({ email: 'test@example.com', password: 'wrongpassword' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException when email is not verified', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue(makeUser({ password: hashed, isEmailVerified: false }));
      await expect(service.login({ email: 'test@example.com', password: 'password123' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('should return accessToken and user on successful login', async () => {
      const hashed = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue(makeUser({ password: hashed }));

      const result = await service.login({ email: 'test@example.com', password: 'password123' });

      expect(result.accessToken).toBe('test-jwt');
      expect(result.user.email).toBe('test@example.com');
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'test@example.com' });
    });
  });

  // ── verifyEmail ───────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should throw BadRequestException for an invalid token', async () => {
      usersService.findByVerificationToken.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(BadRequestException);
    });

    it('should return accessToken and mark user as verified', async () => {
      const user = makeUser({ isEmailVerified: false });
      const verifiedUser = makeUser({ isEmailVerified: true });
      usersService.findByVerificationToken.mockResolvedValue(user);
      usersService.verifyEmail.mockResolvedValue(verifiedUser);

      const result = await service.verifyEmail('valid-token');

      expect(usersService.verifyEmail).toHaveBeenCalledWith(user);
      expect(result.accessToken).toBe('test-jwt');
    });
  });

  // ── forgotPassword ────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should return generic response for unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.forgotPassword('unknown@example.com');
      expect(result.message).toContain('If an account exists');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should return generic response for unverified account', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ isEmailVerified: false }));
      const result = await service.forgotPassword('test@example.com');
      expect(result.message).toContain('If an account exists');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should set reset token and send email for verified account', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());
      usersService.setPasswordResetToken.mockResolvedValue(makeUser());
      emailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      const result = await service.forgotPassword('test@example.com');

      expect(usersService.setPasswordResetToken).toHaveBeenCalled();
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalled();
      expect(result.message).toContain('If an account exists');
    });

    it('should throw InternalServerErrorException when email send fails', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser());
      usersService.setPasswordResetToken.mockResolvedValue(makeUser());
      emailService.sendPasswordResetEmail.mockRejectedValue(new Error('SMTP error'));

      await expect(service.forgotPassword('test@example.com'))
        .rejects.toThrow(InternalServerErrorException);
    });
  });

  // ── resetPassword ─────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('should throw BadRequestException for invalid token', async () => {
      usersService.findByPasswordResetToken.mockResolvedValue(null);
      await expect(service.resetPassword('bad-token', 'newpassword'))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired token', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      usersService.findByPasswordResetToken.mockResolvedValue(
        makeUser({ passwordResetToken: 'tok', passwordResetTokenExpiresAt: expiredDate }),
      );
      await expect(service.resetPassword('tok', 'newpassword'))
        .rejects.toThrow(BadRequestException);
    });

    it('should update password and return success message for valid token', async () => {
      const futureDate = new Date(Date.now() + 60_000);
      usersService.findByPasswordResetToken.mockResolvedValue(
        makeUser({ passwordResetToken: 'tok', passwordResetTokenExpiresAt: futureDate }),
      );
      usersService.updatePassword.mockResolvedValue(makeUser());

      const result = await service.resetPassword('tok', 'newpassword123');

      expect(usersService.updatePassword).toHaveBeenCalled();
      expect(result.message).toContain('password has been reset');
    });
  });

  // ── resendVerificationEmail ───────────────────────────────────────────────

  describe('resendVerificationEmail', () => {
    it('should return generic response for unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const result = await service.resendVerificationEmail('unknown@example.com');
      expect(result.message).toContain('If an unverified account exists');
    });

    it('should return generic response when account is already verified', async () => {
      usersService.findByEmail.mockResolvedValue(makeUser({ isEmailVerified: true }));
      const result = await service.resendVerificationEmail('test@example.com');
      expect(result.message).toContain('If an unverified account exists');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should throw 429 when within the cooldown period', async () => {
      const recentlySent = new Date(Date.now() - 30_000); // 30 seconds ago
      usersService.findByEmail.mockResolvedValue(
        makeUser({ isEmailVerified: false, lastVerificationEmailSentAt: recentlySent }),
      );

      await expect(service.resendVerificationEmail('test@example.com'))
        .rejects.toThrow(HttpException);

      try {
        await service.resendVerificationEmail('test@example.com');
      } catch (e) {
        expect((e as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });

    it('should refresh token and send email when cooldown has passed', async () => {
      const longAgo = new Date(Date.now() - 3 * 60 * 1000); // 3 minutes ago
      const user = makeUser({ isEmailVerified: false, lastVerificationEmailSentAt: longAgo });
      usersService.findByEmail.mockResolvedValue(user);
      usersService.refreshVerificationToken.mockResolvedValue(user);
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.resendVerificationEmail('test@example.com');

      expect(usersService.refreshVerificationToken).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('If an unverified account exists');
    });
  });
});
