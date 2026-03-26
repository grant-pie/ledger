import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed',
    currency: 'USD',
    isEmailVerified: false,
    emailVerificationToken: 'token-abc',
    lastVerificationEmailSentAt: null,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    transactions: [],
    ...overrides,
  } as User);

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  // ── findByEmail ───────────────────────────────────────────────────────────

  it('should return user when found by email', async () => {
    const user = makeUser();
    repo.findOne.mockResolvedValue(user);
    expect(await service.findByEmail('test@example.com')).toEqual(user);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
  });

  it('should return null when email is not found', async () => {
    repo.findOne.mockResolvedValue(null);
    expect(await service.findByEmail('missing@example.com')).toBeNull();
  });

  // ── findById ──────────────────────────────────────────────────────────────

  it('should return user when found by id', async () => {
    const user = makeUser();
    repo.findOne.mockResolvedValue(user);
    expect(await service.findById('user-1')).toEqual(user);
  });

  // ── findByVerificationToken ───────────────────────────────────────────────

  it('should return user when found by verification token', async () => {
    const user = makeUser();
    repo.findOne.mockResolvedValue(user);
    expect(await service.findByVerificationToken('token-abc')).toEqual(user);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { emailVerificationToken: 'token-abc' } });
  });

  // ── create ────────────────────────────────────────────────────────────────

  it('should create and save a new user', async () => {
    const user = makeUser();
    repo.create.mockReturnValue(user);
    repo.save.mockResolvedValue(user);

    const result = await service.create('test@example.com', 'hashed', 'token-abc');

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'test@example.com', isEmailVerified: false }),
    );
    expect(repo.save).toHaveBeenCalledWith(user);
    expect(result).toEqual(user);
  });

  // ── deleteById ────────────────────────────────────────────────────────────

  it('should delete a user by id', async () => {
    repo.delete.mockResolvedValue({ affected: 1, raw: {} });
    await service.deleteById('user-1');
    expect(repo.delete).toHaveBeenCalledWith('user-1');
  });

  // ── verifyEmail ───────────────────────────────────────────────────────────

  it('should set isEmailVerified to true and clear token', async () => {
    const user = makeUser();
    repo.save.mockResolvedValue({ ...user, isEmailVerified: true, emailVerificationToken: null });

    await service.verifyEmail(user);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ isEmailVerified: true, emailVerificationToken: null }),
    );
  });

  // ── refreshVerificationToken ──────────────────────────────────────────────

  it('should update token and set lastVerificationEmailSentAt', async () => {
    const user = makeUser();
    repo.save.mockResolvedValue(user);

    await service.refreshVerificationToken(user, 'new-token');

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ emailVerificationToken: 'new-token' }),
    );
  });

  // ── updateCurrency ────────────────────────────────────────────────────────

  it('should update the user currency', async () => {
    const user = makeUser();
    repo.findOne.mockResolvedValue(user);
    repo.save.mockResolvedValue({ ...user, currency: 'EUR' });

    const result = await service.updateCurrency('user-1', 'EUR');

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ currency: 'EUR' }));
    expect(result.currency).toBe('EUR');
  });

  // ── setPasswordResetToken ─────────────────────────────────────────────────

  it('should set passwordResetToken and expiry', async () => {
    const user = makeUser();
    const expiresAt = new Date(Date.now() + 60_000);
    repo.save.mockResolvedValue(user);

    await service.setPasswordResetToken(user, 'reset-token', expiresAt);

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ passwordResetToken: 'reset-token', passwordResetTokenExpiresAt: expiresAt }),
    );
  });

  // ── updatePassword ────────────────────────────────────────────────────────

  it('should update password and clear reset token fields', async () => {
    const user = makeUser({ passwordResetToken: 'reset-token', passwordResetTokenExpiresAt: new Date() });
    repo.save.mockResolvedValue(user);

    await service.updatePassword(user, 'newhashed');

    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        password: 'newhashed',
        passwordResetToken: null,
        passwordResetTokenExpiresAt: null,
      }),
    );
  });

  // ── findByPasswordResetToken ──────────────────────────────────────────────

  it('should return user when found by password reset token', async () => {
    const user = makeUser({ passwordResetToken: 'reset-token' });
    repo.findOne.mockResolvedValue(user);
    expect(await service.findByPasswordResetToken('reset-token')).toEqual(user);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { passwordResetToken: 'reset-token' } });
  });
});
