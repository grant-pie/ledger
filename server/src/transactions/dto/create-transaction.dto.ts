import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import {
  TransactionType,
  TransactionCategory,
} from '../../shared/types/transaction.types';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999_999_999)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @IsDateString()
  date: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
