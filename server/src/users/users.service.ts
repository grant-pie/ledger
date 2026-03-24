import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { emailVerificationToken: token } });
  }

  async updateCurrency(id: string, currency: string): Promise<User> {
    const user = await this.findById(id);
    user.currency = currency;
    return this.usersRepository.save(user);
  }

  async create(
    email: string,
    hashedPassword: string,
    emailVerificationToken: string,
  ): Promise<User> {
    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      emailVerificationToken,
      isEmailVerified: false,
      lastVerificationEmailSentAt: new Date(),
    });
    return this.usersRepository.save(user);
  }

  async deleteById(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  async refreshVerificationToken(user: User, token: string): Promise<User> {
    user.emailVerificationToken = token;
    user.lastVerificationEmailSentAt = new Date();
    return this.usersRepository.save(user);
  }

  async verifyEmail(user: User): Promise<User> {
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    return this.usersRepository.save(user);
  }
}
