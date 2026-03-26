import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from './entities/transaction.entity';
import { TransactionType, TransactionCategory } from '../shared/types/transaction.types';

const makeTx = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: 'tx-1',
    title: 'Groceries',
    amount: 50,
    type: TransactionType.EXPENSE,
    category: TransactionCategory.FOOD,
    date: new Date('2024-01-15'),
    notes: null,
    userId: 'user-1',
    user: null as any,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  } as Transaction);

describe('TransactionsService', () => {
  let service: TransactionsService;
  let repo: jest.Mocked<Repository<Transaction>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    repo = module.get(getRepositoryToken(Transaction));
  });

  // ── findAll ───────────────────────────────────────────────────────────────

  it('should return all transactions for a user ordered by date desc', async () => {
    const txs = [makeTx(), makeTx({ id: 'tx-2' })];
    repo.find.mockResolvedValue(txs);

    const result = await service.findAll('user-1');

    expect(repo.find).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      order: { date: 'DESC' },
    });
    expect(result).toEqual(txs);
  });

  // ── findOne ───────────────────────────────────────────────────────────────

  it('should return a transaction when found', async () => {
    const tx = makeTx();
    repo.findOne.mockResolvedValue(tx);

    const result = await service.findOne('tx-1', 'user-1');

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'tx-1', userId: 'user-1' } });
    expect(result).toEqual(tx);
  });

  it('should throw NotFoundException when transaction is not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('should not return a transaction belonging to a different user', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('tx-1', 'other-user')).rejects.toThrow(NotFoundException);
  });

  // ── create ────────────────────────────────────────────────────────────────

  it('should create and save a transaction', async () => {
    const dto = {
      title: 'Groceries',
      amount: 50,
      type: TransactionType.EXPENSE,
      category: TransactionCategory.FOOD,
      date: '2024-01-15',
    };
    const tx = makeTx();
    repo.create.mockReturnValue(tx);
    repo.save.mockResolvedValue(tx);

    const result = await service.create('user-1', dto as any);

    expect(repo.create).toHaveBeenCalledWith({ ...dto, userId: 'user-1' });
    expect(repo.save).toHaveBeenCalledWith(tx);
    expect(result).toEqual(tx);
  });

  // ── update ────────────────────────────────────────────────────────────────

  it('should update and save an existing transaction', async () => {
    const tx = makeTx();
    repo.findOne.mockResolvedValue(tx);
    repo.save.mockResolvedValue({ ...tx, title: 'Updated' });

    const result = await service.update('tx-1', 'user-1', { title: 'Updated' } as any);

    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ title: 'Updated' }));
    expect(result.title).toBe('Updated');
  });

  it('should throw NotFoundException when updating a non-existent transaction', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update('missing', 'user-1', {} as any)).rejects.toThrow(NotFoundException);
  });

  // ── remove ────────────────────────────────────────────────────────────────

  it('should remove a transaction', async () => {
    const tx = makeTx();
    repo.findOne.mockResolvedValue(tx);
    repo.remove.mockResolvedValue(tx);

    await service.remove('tx-1', 'user-1');

    expect(repo.remove).toHaveBeenCalledWith(tx);
  });

  it('should throw NotFoundException when removing a non-existent transaction', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.remove('missing', 'user-1')).rejects.toThrow(NotFoundException);
  });
});
