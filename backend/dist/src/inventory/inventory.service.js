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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const inventory_dto_1 = require("./dto/inventory.dto");
const notification_gateway_1 = require("../notification/notification.gateway");
let InventoryService = class InventoryService {
    prisma;
    notifications;
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async findAll(tenantId, productId) {
        const where = { tenantId };
        if (productId)
            where.productId = productId;
        return this.prisma.inventoryLog.findMany({
            where,
            include: {
                product: { select: { id: true, name: true, sku: true, stock: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async create(dto, tenantId) {
        const product = await this.prisma.product.findFirst({
            where: { id: dto.productId, tenantId },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found in this tenant');
        let stockDelta;
        if (dto.type === inventory_dto_1.InventoryType.STOCK_IN) {
            stockDelta = Math.abs(dto.quantity);
        }
        else if (dto.type === inventory_dto_1.InventoryType.STOCK_OUT) {
            stockDelta = -Math.abs(dto.quantity);
            if (product.stock + stockDelta < 0) {
                throw new common_1.BadRequestException(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
            }
        }
        else {
            stockDelta = dto.quantity;
            if (product.stock + stockDelta < 0) {
                throw new common_1.BadRequestException(`Adjustment would result in negative stock for ${product.name}`);
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
    async getLowStock(tenantId) {
        return this.prisma.product.findMany({
            where: {
                tenantId,
                status: 'ACTIVE',
                stock: { lte: this.prisma.product.fields?.minStock },
            },
            orderBy: { stock: 'asc' },
        });
    }
    async getLowStockProducts(tenantId) {
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map