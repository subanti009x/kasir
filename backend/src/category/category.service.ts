import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto.js';
import { NotificationGateway } from '../notification/notification.gateway.js';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService, @Optional() private notifications?: NotificationGateway) {}

  async findAll(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: { _count: { select: { products: true } } },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto, tenantId: string) {
    const category = await this.prisma.category.create({
      data: { ...dto, tenantId },
    });
    this.notifications?.notifyDataChanged(tenantId, 'categories');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, tenantId: string) {
    await this.findOne(id, tenantId);
    const category = await this.prisma.category.update({ where: { id }, data: dto });
    this.notifications?.notifyDataChanged(tenantId, 'categories');
    return category;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    const category = await this.prisma.category.delete({ where: { id } });
    this.notifications?.notifyDataChanged(tenantId, 'categories');
    return category;
  }
}
