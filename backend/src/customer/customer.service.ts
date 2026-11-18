import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto.js';
import { NotificationGateway } from '../notification/notification.gateway.js';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService, @Optional() private notifications?: NotificationGateway) {}

  private async assertWholesaleFeature(tenantId: string, isWholesale?: boolean) {
    if (!isWholesale) return;
    const feature = await this.prisma.tenantFeature.findFirst({
      where: { tenantId, enabled: true, feature: { code: 'WHOLESALE_PRICING', isActive: true } },
      select: { id: true },
    });
    if (!feature) throw new BadRequestException('Harga bakul belum diaktifkan untuk toko ini');
  }

  async findAll(tenantId: string, search?: string) {
    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.customer.findMany({
      where,
      include: {
        _count: { select: { transactions: true } },
        transactions: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, tenantId },
      include: {
        transactions: {
          include: { items: { include: { product: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { transactions: true } },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async create(dto: CreateCustomerDto, tenantId: string) {
    await this.assertWholesaleFeature(tenantId, dto.isWholesale);
    const customer = await this.prisma.customer.create({
      data: { ...dto, tenantId },
    });
    this.notifications?.notifyDataChanged(tenantId, 'customers');
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, tenantId: string) {
    await this.assertWholesaleFeature(tenantId, dto.isWholesale);
    await this.findOne(id, tenantId);
    const customer = await this.prisma.customer.update({ where: { id }, data: dto });
    this.notifications?.notifyDataChanged(tenantId, 'customers');
    return customer;
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    const customer = await this.prisma.customer.delete({ where: { id } });
    this.notifications?.notifyDataChanged(tenantId, 'customers');
    return customer;
  }
}
