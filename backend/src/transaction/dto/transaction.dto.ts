import { IsString, IsNumber, IsArray, IsOptional, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransactionItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: 32000, description: 'Ignored by the API; server pricing is authoritative.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

export class TransactionPaymentDto {
  @ApiProperty({ example: 'Cash' })
  @IsString()
  method: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ example: 'QRIS-REF-001' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class CheckoutDto {
  @ApiProperty({ type: [TransactionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionItemDto)
  items: TransactionItemDto[];

  @ApiProperty({ example: 'QRIS' })
  @IsString()
  paymentMethod: string;

  @ApiPropertyOptional({ type: [TransactionPaymentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransactionPaymentDto)
  payments?: TransactionPaymentDto[];

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ example: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED'] })
  @IsOptional()
  @IsString()
  discountType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
