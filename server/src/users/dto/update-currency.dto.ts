import { IsString, IsIn } from 'class-validator';

export const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
  'INR', 'MXN', 'BRL', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK',
  'DKK', 'NZD', 'ZAR', 'AED',
];

export class UpdateCurrencyDto {
  @IsString()
  @IsIn(SUPPORTED_CURRENCIES)
  currency: string;
}
