import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Dewi Lestari' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: '+62 812 4000 1881' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'dewi@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'True jika pelanggan adalah pembeli bakul/reseller.' })
  @IsOptional()
  @IsBoolean()
  isWholesale?: boolean;
}

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
