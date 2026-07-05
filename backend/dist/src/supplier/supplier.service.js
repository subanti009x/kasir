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
exports.SupplierService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SupplierService = class SupplierService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId) {
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
    async findOne(id, tenantId) {
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
        if (!supplier)
            throw new common_1.NotFoundException('Supplier not found');
        return supplier;
    }
    async create(dto, tenantId) {
        return this.prisma.supplier.create({ data: { ...dto, tenantId } });
    }
    async update(id, dto, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.supplier.update({ where: { id }, data: dto });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.supplier.delete({ where: { id } });
    }
};
exports.SupplierService = SupplierService;
exports.SupplierService = SupplierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SupplierService);
//# sourceMappingURL=supplier.service.js.map