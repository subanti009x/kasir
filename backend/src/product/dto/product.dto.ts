import { IsString, IsOptional, IsNumber, Min, IsArray, ValidateNested, IsInt, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class ProductUnitDto {
  @ApiProperty({ example: 'Renteng' })
  @IsString()
  name: string;

  @ApiProperty({ example: 10, description: 'Jumlah unit dasar dalam satu satuan ini.' })
  @IsInt()
  @Min(1)
  conversionFactor: number;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 23500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Sourdough Loaf' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'BRD-SRD-01' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ example: '899100010001' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 18000 })
  @IsNumber()
  @Min(0)
  purchasePrice: number;

  @ApiProperty({ example: 32000 })
  @IsNumber()
  @Min(0)
  sellingPrice: number;

  @ApiPropertyOptional({ example: 26500, description: 'Harga reseller untuk pelanggan bakul.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wholesalePrice?: number;

  @ApiPropertyOptional({ example: 'pcs', description: 'Satuan dasar stok, misalnya pcs atau gram.' })
  @IsOptional()
  @IsString()
  baseUnit?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;

  @ApiPropertyOptional({ type: [ProductUnitDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductUnitDto)
  units?: ProductUnitDto[];

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED'] })
  @IsOptional()
  @IsString()
  status?: string;
}
