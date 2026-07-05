import { IsString, IsArray, IsOptional, IsInt, IsNumber, Min, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class PurchaseOrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 18000 })
  @IsNumber()
  @Min(0)
  unitCost: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty()
  @IsString()
  supplierId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items: PurchaseOrderItemDto[];
}

export enum POStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  PARTIAL = 'PARTIAL',
  CANCELLED = 'CANCELLED',
}

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({ enum: POStatus })
  @IsEnum(POStatus)
  status: POStatus;
}

export class ReceivePurchaseOrderDto {
  @ApiProperty({ description: 'Items with received quantities' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}

export class ReceiveItemDto {
  @ApiProperty()
  @IsString()
  purchaseOrderItemId: string;

  @ApiProperty({ example: 25 })
  @IsInt()
  @Min(0)
  receivedQty: number;
}
