import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto.js';
import { NotificationGateway } from '../notification/notification.gateway.js';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService, @Optional() private notifications?: NotificationGateway) {}

  async findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId },
      include: {
        _count: { select: { purchaseOrders: true } },
        purchaseOrders: {
          select: { totalAmount: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        purchaseOrders: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { purchaseOrders: true } },
      },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(dto: CreateSupplierDto, tenantId: string) {
    const supplier = await this.prisma.supplier.create({ data: { ...dto, tenantId } });
    this.notifications?.notifyDataChanged(tenantId, 'suppliers');
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, tenantId: string) {
    await this.findOne(id, tenantId);
    const supplier = await this.prisma.supplier.update({ where: { id }, data: dto });
    this.notifications?.notifyDataChanged(tenantId, 'suppliers');
    return supplier;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    const supplier = await this.prisma.supplier.delete({ where: { id } });
    this.notifications?.notifyDataChanged(tenantId, 'suppliers');
    return supplier;
  }
}
