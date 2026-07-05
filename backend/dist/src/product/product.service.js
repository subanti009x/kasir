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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProductService = class ProductService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(tenantId, search, categoryId) {
        const where = { tenantId };
        if (categoryId)
            where.categoryId = categoryId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search } },
            ];
        }
        return this.prisma.product.findMany({
            where,
            include: { category: { select: { id: true, name: true, color: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id, tenantId) {
        const product = await this.prisma.product.findFirst({
            where: { id, tenantId },
            include: { category: true },
        });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    async create(dto, tenantId) {
        if (dto.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: dto.categoryId, tenantId },
            });
            if (!category)
                throw new common_1.NotFoundException('Category not found in this tenant');
        }
        return this.prisma.product.create({
            data: { ...dto, tenantId },
            include: { category: true },
        });
    }
    async update(id, dto, tenantId) {
        await this.findOne(id, tenantId);
        if (dto.categoryId) {
            const category = await this.prisma.category.findFirst({
                where: { id: dto.categoryId, tenantId },
            });
            if (!category)
                throw new common_1.NotFoundException('Category not found in this tenant');
        }
        return this.prisma.product.update({
            where: { id },
            data: dto,
            include: { category: true },
        });
    }
    async remove(id, tenantId) {
        await this.findOne(id, tenantId);
        return this.prisma.product.delete({ where: { id } });
    }
    async uploadImage(id, tenantId, file) {
        await this.findOne(id, tenantId);
        if (!file) {
            throw new common_1.BadRequestException('Image file is required');
        }
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
            throw new common_1.BadRequestException('Only JPEG, PNG, and WebP product images are allowed');
        }
        if (file.size > 2 * 1024 * 1024) {
            throw new common_1.BadRequestException('Product image must be 2MB or smaller');
        }
        const image = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        return this.prisma.product.update({
            where: { id },
            data: { image },
            include: { category: true },
        });
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductService);
//# sourceMappingURL=product.service.js.map