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
exports.ExclusiveFeatureService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExclusiveFeatureService = class ExclusiveFeatureService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.exclusiveFeature.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                _count: { select: { tenantFeatures: true } },
            },
        });
    }
    async findOne(id) {
        const feature = await this.prisma.exclusiveFeature.findUnique({
            where: { id },
            include: {
                tenantFeatures: {
                    include: { tenant: { select: { id: true, name: true, slug: true } } },
                },
            },
        });
        if (!feature)
            throw new common_1.NotFoundException('Feature not found');
        return feature;
    }
    async create(dto) {
        const existing = await this.prisma.exclusiveFeature.findUnique({
            where: { code: dto.code },
        });
        if (existing)
            throw new common_1.ConflictException(`Feature code "${dto.code}" already exists`);
        return this.prisma.exclusiveFeature.create({
            data: {
                code: dto.code,
                name: dto.name,
                description: dto.description,
                category: dto.category || 'GENERAL',
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.exclusiveFeature.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.exclusiveFeature.delete({ where: { id } });
    }
    async getTenantFeatures(tenantId) {
        return this.prisma.tenantFeature.findMany({
            where: { tenantId },
            include: {
                feature: true,
            },
            orderBy: { assignedAt: 'asc' },
        });
    }
    async assign(dto) {
        const feature = await this.prisma.exclusiveFeature.findUnique({
            where: { id: dto.featureId },
        });
        if (!feature)
            throw new common_1.NotFoundException('Feature not found');
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: dto.tenantId },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        const existing = await this.prisma.tenantFeature.findUnique({
            where: { tenantId_featureId: { tenantId: dto.tenantId, featureId: dto.featureId } },
        });
        if (existing)
            throw new common_1.ConflictException('Feature already assigned to this tenant');
        return this.prisma.tenantFeature.create({
            data: {
                tenantId: dto.tenantId,
                featureId: dto.featureId,
                enabled: dto.enabled ?? true,
            },
            include: { feature: true, tenant: { select: { id: true, name: true } } },
        });
    }
    async updateAssignment(id, dto) {
        const assignment = await this.prisma.tenantFeature.findUnique({ where: { id } });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        return this.prisma.tenantFeature.update({
            where: { id },
            data: { enabled: dto.enabled },
            include: { feature: true },
        });
    }
    async removeAssignment(id) {
        const assignment = await this.prisma.tenantFeature.findUnique({ where: { id } });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        return this.prisma.tenantFeature.delete({ where: { id } });
    }
    async checkTenantFeatures(tenantId) {
        const assignments = await this.prisma.tenantFeature.findMany({
            where: {
                tenantId,
                enabled: true,
                feature: { isActive: true },
            },
            include: {
                feature: {
                    select: { id: true, code: true, name: true, description: true, category: true },
                },
            },
        });
        const featureMap = {};
        const features = assignments.map((a) => {
            featureMap[a.feature.code] = true;
            return a.feature;
        });
        return { features, featureMap };
    }
};
exports.ExclusiveFeatureService = ExclusiveFeatureService;
exports.ExclusiveFeatureService = ExclusiveFeatureService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExclusiveFeatureService);
//# sourceMappingURL=exclusive-feature.service.js.map