import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdateWhatsappConfigDto {
  @ApiPropertyOptional({ example: 'Nusantara Bakery Bot' })
  @IsOptional()
  @IsString()
  botName?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    example:
      'Halo {{customer_name}}! 🧾\n\nTerima kasih telah berbelanja di *{{store_name}}*.\n\nNo. Struk: {{receipt_id}}\n{{items}}\n\n*Total: {{total}}*',
  })
  @IsOptional()
  @IsString()
  checkoutTemplate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  refundTemplate?: string;
}

export class WhatsappLogQueryDto {
  @ApiPropertyOptional({ enum: ['PENDING', 'SENDING', 'SENT', 'FAILED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
