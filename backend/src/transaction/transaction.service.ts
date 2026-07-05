import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/transaction.dto';

@Injectable()
export class TransactionService {
  constructor(private prisma: PrismaService) {}

  async checkout(userId: string, tenantId: string, dto: CheckoutDto) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate all products and calculate totals
      let subtotal = 0;
      const validatedItems: { productId: string; quantity: number; unitPrice: number; subtotal: number; product: any }[] = [];

      for (const item of dto.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, tenantId, status: 'ACTIVE' },
        });

        if (!product) {
          throw new BadRequestException(`Product ${item.productId} not found or inactive`);
        }
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        }

        const itemSubtotal = item.unitPrice * item.quantity;
        subtotal += itemSubtotal;
        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: itemSubtotal,
          product,
        });
      }

      // 2. Calculate discount
      let discount = 0;
      if (dto.discount && dto.discount > 0) {
        if (dto.discountType === 'PERCENTAGE') {
          discount = subtotal * (dto.discount / 100);
        } else {
          discount = dto.discount;
        }
      }

      // 3. Get tenant tax rate
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      const taxRate = tenant?.taxRate || 0;
      const taxableAmount = subtotal - discount;
      const tax = taxableAmount * (taxRate / 100);
      const total = taxableAmount + tax;

      // 4. Calculate change
      const amountPaid = dto.amountPaid || total;
      const changeDue = Math.max(amountPaid - total, 0);

      // 5. Generate receipt ID
      const txCount = await tx.transaction.count({ where: { tenantId } });
      const receiptId = `REC-${Date.now().toString(36).toUpperCase()}-${(txCount + 1).toString().padStart(5, '0')}`;

      // 6. Create transaction
      const transaction = await tx.transaction.create({
        data: {
          tenantId,
          cashierId: userId,
          customerId: dto.customerId || null,
          receiptId,
          subtotal,
          discount,
          discountType: dto.discountType,
          tax,
          total,
          paymentMethod: dto.paymentMethod,
          amountPaid,
          changeDue,
          status: 'COMPLETED',
          note: dto.note,
          items: {
            create: validatedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
        },
      });

      // 7. Decrement stock and create inventory logs
      for (const item of validatedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            type: 'STOCK_OUT',
            quantity: -item.quantity,
            note: `Sale ${receiptId}`,
            reference: transaction.id,
            productId: item.productId,
            tenantId,
          },
        });
      }

      return transaction;
    });
  }

  async findAll(tenantId: string, page = 1, limit = 20, startDate?: string, endDate?: string) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          cashier: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, tenantId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, tenantId },
      include: {
        cashier: { select: { id: true, name: true } },
        customer: true,
        items: { include: { product: true } },
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async refund(id: string, tenantId: string) {
    const transaction = await this.findOne(id, tenantId);
    if (transaction.status === 'REFUNDED') {
      throw new BadRequestException('Transaction already refunded');
    }

    return this.prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of transaction.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            type: 'STOCK_IN',
            quantity: item.quantity,
            note: `Refund ${transaction.receiptId}`,
            reference: transaction.id,
            productId: item.productId,
            tenantId,
          },
        });
      }

      return tx.transaction.update({
        where: { id },
        data: { status: 'REFUNDED' },
      });
    });
  }
}
