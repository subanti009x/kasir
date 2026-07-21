import { IsString, IsNumber, IsArray, IsOptional, IsInt, Min, ValidateNested, IsNotEmpty, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LandingPageCheckoutItemDto {
  @ApiProperty({ description: 'Product ID from the POS system' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 1, description: 'Quantity of the service/product' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class LandingPageCheckoutDto {
  @ApiProperty({ type: [LandingPageCheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LandingPageCheckoutItemDto)
  items: LandingPageCheckoutItemDto[];

  @ApiProperty({ example: 'Cash', description: 'Payment method' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'Nadia Putri' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ example: 'nadia@email.com' })
  @IsOptional()
  @IsString()
  customerEmail?: string;

  @ApiPropertyOptional({ example: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ example: 'Booking dari Landing Page' })
  @IsOptional()
  @IsString()
  note?: string;
}
