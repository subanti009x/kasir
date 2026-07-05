import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrderService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: string) {
    const where: any = { tenantId };
    if (status) where.status = status;

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
    if (!po) throw new NotFoundException('Purchase order not found');
    return po;
  }

  async create(dto: CreatePurchaseOrderDto, tenantId: string) {
    // Verify supplier belongs to tenant
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, tenantId },
    });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const poCount = await this.prisma.purchaseOrder.count({ where: { tenantId } });
    const orderNumber = `PO-${(poCount + 1).toString().padStart(5, '0')}`;
    const totalAmount = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: dto.supplierId,
        orderNumber,
        totalAmount,
        note: dto.note,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
  }

  async receive(id: string, dto: ReceivePurchaseOrderDto, tenantId: string) {
    const po = await this.findOne(id, tenantId);
    if (po.status === 'CANCELLED') {
      throw new BadRequestException('Cannot receive a cancelled PO');
    }

    return this.prisma.$transaction(async (tx) => {
      let allReceived = true;

      for (const receiveItem of dto.items) {
        const poItem = po.items.find((i) => i.id === receiveItem.purchaseOrderItemId);
        if (!poItem) throw new NotFoundException(`PO item ${receiveItem.purchaseOrderItemId} not found`);

        const newReceivedQty = poItem.receivedQty + receiveItem.receivedQty;
        if (newReceivedQty > poItem.quantity) {
          throw new BadRequestException(
            `Received qty (${newReceivedQty}) exceeds ordered qty (${poItem.quantity}) for product`,
          );
        }

        if (newReceivedQty < poItem.quantity) allReceived = false;

        // Update PO item
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: newReceivedQty },
        });

        // Increment product stock
        if (receiveItem.receivedQty > 0) {
          await tx.product.update({
            where: { id: poItem.productId },
            data: { stock: { increment: receiveItem.receivedQty } },
          });

          await tx.inventoryLog.create({
            data: {
              type: 'STOCK_IN',
              quantity: receiveItem.receivedQty,
              note: `PO ${po.orderNumber} received`,
              reference: po.id,
              productId: poItem.productId,
              tenantId,
            },
          });
        }
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: { status: allReceived ? 'RECEIVED' : 'PARTIAL' },
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
      });
    });
  }

  async cancel(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
