import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { CreateInventoryLogDto } from './dto/inventory.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiQuery({ name: 'productId', required: false })
  findAll(@CurrentUser() user: any, @Query('productId') productId?: string) {
    return this.inventoryService.findAll(user.tenantId, productId);
  }

  @Get('low-stock')
  getLowStock(@CurrentUser() user: any) {
    return this.inventoryService.getLowStockProducts(user.tenantId);
  }

  @Post()
  @Roles('OWNER', 'SUPER_ADMIN')
  create(@Body() dto: CreateInventoryLogDto, @CurrentUser() user: any) {
    return this.inventoryService.create(dto, user.tenantId);
  }
}
