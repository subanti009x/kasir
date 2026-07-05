"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseOrderService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PurchaseOrderService = class PurchaseOrderService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, status) {
        const where = { tenantId };
        if (status)
            where.status = status;
        return this.prisma.purchaseOrder.findMany({
            where,
            include: {
                supplier: { select: { id: true, name: true } },
                items: { include: { product: { select: { id: true, name: true, sku: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, tenantId) {
        const po = await this.prisma.purchaseOrder.findFirst({
            where: { id, tenantId },
            include: {
                supplier: true,
                items: { include: { product: true } },
            },
        });
        if (!po)
            throw new common_1.NotFoundException('Purchase order not found');
        return po;
    }
    async create(dto, tenantId) {
        const supplier = await this.prisma.supplier.findFirst({
            where: { id: dto.supplierId, tenantId },
        });
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
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
    async receive(id, dto, tenantId) {
        const po = await this.findOne(id, tenantId);
        if (po.status === 'CANCELLED') {
            throw new common_1.BadRequestException('Cannot receive a cancelled PO');
        }
        return this.prisma.$transaction(async (tx) => {
            let allReceived = true;
            for (const receiveItem of dto.items) {
                const poItem = po.items.find((i) => i.id === receiveItem.purchaseOrderItemId);
                if (!poItem)
                    throw new common_1.NotFoundException(`PO item ${receiveItem.purchaseOrderItemId} not found`);
                const newReceivedQty = poItem.receivedQty + receiveItem.receivedQty;
                if (newReceivedQty > poItem.quantity) {
                    throw new common_1.BadRequestException(`Received qty (${newReceivedQty}) exceeds ordered qty (${poItem.quantity}) for product`);
                }
                if (newReceivedQty < poItem.quantity)
                    allReceived = false;
                await tx.purchaseOrderItem.update({
                    where: { id: poItem.id },
                    data: { receivedQty: newReceivedQty },
                });
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
    async cancel(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.purchaseOrder.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });
    }
};
exports.PurchaseOrderService = PurchaseOrderService;
exports.PurchaseOrderService = PurchaseOrderService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PurchaseOrderService);
//# sourceMappingURL=purchase-order.service.js.map