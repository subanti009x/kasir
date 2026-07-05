import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryLogDto, InventoryType } from './dto/inventory.dto';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationGateway,
  ) {}

  async findAll(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) where.productId = productId;

    return this.prisma.inventoryLog.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, stock: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async create(dto: CreateInventoryLogDto, tenantId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, tenantId },
    });

    if (!product) throw new NotFoundException('Product not found in this tenant');

    let stockDelta: number;
    if (dto.type === InventoryType.STOCK_IN) {
      stockDelta = Math.abs(dto.quantity);
    } else if (dto.type === InventoryType.STOCK_OUT) {
      stockDelta = -Math.abs(dto.quantity);
      if (product.stock + stockDelta < 0) {
        throw new BadRequestException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        );
      }
    } else {
      // ADJUSTMENT — quantity can be positive or negative
      stockDelta = dto.quantity;
      if (product.stock + stockDelta < 0) {
        throw new BadRequestException(
          `Adjustment would result in negative stock for ${product.name}`,
        );
      }
    }

    const [log, updatedProduct] = await this.prisma.$transaction([
      this.prisma.inventoryLog.create({
        data: {
          type: dto.type,
          quantity: stockDelta,
          note: dto.note,
          reference: dto.reference,
          productId: dto.productId,
          tenantId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { stock: { increment: stockDelta } },
      }),
    ]);

    if (updatedProduct.stock <= updatedProduct.minStock) {
      this.notifications.notifyLowStock(tenantId, {
        id: updatedProduct.id,
        name: updatedProduct.name,
        stock: updatedProduct.stock,
        minStock: updatedProduct.minStock,
      });
    }

    return log;
  }

  async getLowStock(tenantId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        status: 'ACTIVE',
        stock: { lte: this.prisma.product.fields?.minStock as any },
      },
      orderBy: { stock: 'asc' },
    });
  }

  async getLowStockProducts(tenantId: string) {
    // Raw query to compare stock <= minStock
    const products = await this.prisma.product.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        minStock: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });
    return products.filter((p) => p.stock <= p.minStock);
  }
}
