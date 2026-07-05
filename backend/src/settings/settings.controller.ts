import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from '../tenant/dto/tenant.dto';

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getSettings(@CurrentUser() user: any) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { paymentMethods: true },
    });
    return tenant;
  }

  @Patch()
  @Roles('OWNER', 'SUPER_ADMIN')
  async updateSettings(@Body() dto: UpdateTenantDto, @CurrentUser() user: any) {
    return this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: dto,
      include: { paymentMethods: true },
    });
  }

  @Get('payment-methods')
  async getPaymentMethods(@CurrentUser() user: any) {
    return this.prisma.paymentMethod.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: 'asc' },
    });
  }

  @Patch('payment-methods')
  @Roles('OWNER', 'SUPER_ADMIN')
  async updatePaymentMethod(
    @Body() dto: { id: string; enabled: boolean },
    @CurrentUser() user: any,
  ) {
    return this.prisma.paymentMethod.updateMany({
      where: { id: dto.id, tenantId: user.tenantId },
      data: { enabled: dto.enabled },
    });
  }
}
