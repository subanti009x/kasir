import {
  BadRequestException,
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Post,
  UseInterceptors,
  UploadedFile,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateTenantDto } from '../tenant/dto/tenant.dto.js';
import { NotificationGateway } from '../notification/notification.gateway.js';

type UploadedLogo = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type TenantUser = {
  tenantId: string;
};

@ApiTags('settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private prisma: PrismaService, @Optional() private notifications?: NotificationGateway) {}

  @Get()
  @Roles('OWNER')
  async getSettings(@CurrentUser() user: TenantUser) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      include: { paymentMethods: true },
    });
    return tenant;
  }

  @Get('pos')
  @Roles('OWNER', 'CASHIER')
  async getPosSettings(@CurrentUser() user: TenantUser) {
    return this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: {
        name: true,
        address: true,
        phone: true,
        logo: true,
        taxRate: true,
      },
    });
  }

  @Patch()
  @Roles('OWNER')
  async updateSettings(
    @Body() dto: UpdateTenantDto,
    @CurrentUser() user: TenantUser,
  ) {
    const settings = await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: dto,
      include: { paymentMethods: true },
    });
    this.notifications?.notifyDataChanged(user.tenantId, 'settings');
    return settings;
  }

  @Post('logo')
  @Roles('OWNER')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(
    @UploadedFile() file: UploadedLogo,
    @CurrentUser() user: TenantUser,
  ) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, and SVG logos are allowed',
      );
    }
    if (file.size > 1024 * 1024) {
      throw new BadRequestException('Logo must be 1MB or smaller');
    }

    const extension = extname(file.originalname).toLowerCase() || '.png';
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(
      extension,
    )
      ? extension
      : '.png';
    const directory = join(process.cwd(), 'uploads', 'logos', user.tenantId);
    const filename = `logo-${Date.now()}${safeExtension}`;
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), file.buffer);

    const settings = await this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { logo: `/uploads/logos/${user.tenantId}/${filename}` },
    });
    this.notifications?.notifyDataChanged(user.tenantId, 'settings');
    return settings;
  }

  @Get('payment-methods')
  @Roles('OWNER', 'CASHIER')
  async getPaymentMethods(@CurrentUser() user: TenantUser) {
    return this.prisma.paymentMethod.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { name: 'asc' },
    });
  }

  @Patch('payment-methods')
  @Roles('OWNER')
  async updatePaymentMethod(
    @Body() dto: { id: string; enabled: boolean },
    @CurrentUser() user: TenantUser,
  ) {
    const result = await this.prisma.paymentMethod.updateMany({
      where: { id: dto.id, tenantId: user.tenantId },
      data: { enabled: dto.enabled },
    });
    this.notifications?.notifyDataChanged(user.tenantId, 'settings');
    return result;
  }
}
