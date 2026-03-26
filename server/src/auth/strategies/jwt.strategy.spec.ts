import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';
import { User } from '../../users/entities/user.entity';

const makeUser = (): User =>
  ({
    id: 'user-1',
    email: 'test@example.com',
    password: 'hashed',
    currency: 'USD',
    isEmailVerified: true,
    emailVerificationToken: null,
    lastVerificationEmailSentAt: null,
    passwordResetToken: null,
    passwordResetTokenExpiresAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    transactions: [],
  } as User);

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('test-secret') },
        },
        {
          provide: UsersService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    usersService = module.get(UsersService);
  });

  it('should return id and email when user exists', async () => {
    usersService.findById.mockResolvedValue(makeUser());
    const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com' });
    expect(result).toEqual({ id: 'user-1', email: 'test@example.com' });
  });

  it('should throw UnauthorizedException when user does not exist', async () => {
    usersService.findById.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'gone', email: 'gone@example.com' }))
      .rejects.toThrow(UnauthorizedException);
  });
});
