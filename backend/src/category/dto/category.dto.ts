import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bakery' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Bread, pastries, and baked goods' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '#D97706' })
  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
