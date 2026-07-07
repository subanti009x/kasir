import { IsString, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const EXPENSE_CATEGORIES = [
  'RENT',
  'UTILITIES',
  'SALARIES',
  'MARKETING',
  'SUPPLIES',
  'OTHER',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export class CreateExpenseDto {
  @ApiProperty({ enum: EXPENSE_CATEGORIES, example: 'RENT' })
  @IsString()
  @IsIn(EXPENSE_CATEGORIES)
  category: ExpenseCategory;

  @ApiProperty({ example: 'Monthly office rent' })
  @IsString()
  description: string;

  @ApiProperty({ example: 1500000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2026-07-01' })
  @IsDateString()
  date: string;
}

export class DateRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class AsOfDateQueryDto {
  @ApiPropertyOptional({ example: '2026-07-06' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
