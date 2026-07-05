import { BadRequestException, Controller, Get, Patch, Body, UseGuards, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTenantDto } from '../tenant/dto/tenant.dto';

type UploadedLogo = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

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

  @Post('logo')
  @Roles('OWNER', 'SUPER_ADMIN')
  @UseInterceptors(FileInterceptor('logo'))
  async uploadLogo(@UploadedFile() file: UploadedLogo, @CurrentUser() user: any) {
    if (!file) {
      throw new BadRequestException('Logo file is required');
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and SVG logos are allowed');
    }
    if (file.size > 1024 * 1024) {
      throw new BadRequestException('Logo must be 1MB or smaller');
    }

    const extension = extname(file.originalname).toLowerCase() || '.png';
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(extension) ? extension : '.png';
    const directory = join(process.cwd(), 'uploads', 'logos', user.tenantId);
    const filename = `logo-${Date.now()}${safeExtension}`;
    await mkdir(directory, { recursive: true });
    await writeFile(join(directory, filename), file.buffer);

    return this.prisma.tenant.update({
      where: { id: user.tenantId },
      data: { logo: `/uploads/logos/${user.tenantId}/${filename}` },
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
