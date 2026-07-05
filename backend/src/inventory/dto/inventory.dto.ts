import { IsString, IsInt, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum InventoryType {
  STOCK_IN = 'STOCK_IN',
  STOCK_OUT = 'STOCK_OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export class CreateInventoryLogDto {
  @ApiProperty({ enum: InventoryType })
  @IsEnum(InventoryType)
  type: InventoryType;

  @ApiProperty({ example: 10 })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ example: 'Supplier delivery batch #42' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  productId: string;
}
