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
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TenantService = class TenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(page = 1, limit = 20, status) {
        const where = status ? { status } : {};
        const [data, total] = await Promise.all([
            this.prisma.tenant.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { users: true, products: true, transactions: true } },
                },
            }),
            this.prisma.tenant.count({ where }),
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findOne(id) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        transactions: true,
                        customers: true,
                        suppliers: true,
                    },
                },
                paymentMethods: true,
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async create(dto) {
        const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
        if (existing)
            throw new common_1.ConflictException('Tenant slug already exists');
        return this.prisma.tenant.create({
            data: {
                ...dto,
                paymentMethods: {
                    createMany: {
                        data: [
                            { name: 'Cash' },
                            { name: 'QRIS' },
                            { name: 'Bank Transfer' },
                            { name: 'E-Wallet' },
                        ],
                    },
                },
            },
            include: { paymentMethods: true },
        });
    }
    async update(id, dto) {
        const tenant = await this.findOne(id);
        const planChanged = dto.plan && dto.plan !== tenant.plan;
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.tenant.update({
                where: { id },
                data: {
                    ...dto,
                    ...(planChanged ? { planStartedAt: new Date() } : {}),
                },
            });
            if (planChanged) {
                await tx.subscriptionPlanHistory.create({
                    data: {
                        tenantId: id,
                        plan: dto.plan,
                        previousPlan: tenant.plan,
                        note: 'Plan changed by Super Admin',
                        startsAt: updated.planStartedAt,
                        expiresAt: updated.planExpiresAt,
                    },
                });
            }
            return updated;
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.tenant.delete({ where: { id } });
    }
    async getStats() {
        const [totalTenants, activeTenants, totalUsers, totalTransactions, plans] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.tenant.count({ where: { status: 'ACTIVE' } }),
            this.prisma.user.count(),
            this.prisma.transaction.count(),
            this.prisma.tenant.groupBy({
                by: ['plan'],
                _count: true,
            }),
        ]);
        const revenueResult = await this.prisma.transaction.aggregate({
            _sum: { total: true },
        });
        return {
            totalTenants,
            activeTenants,
            totalUsers,
            totalTransactions,
            totalRevenue: revenueResult._sum.total || 0,
            plans: plans.map((plan) => ({ plan: plan.plan, count: plan._count })),
        };
    }
    getPlans() {
        return [
            {
                id: 'BASIC',
                name: 'Basic',
                monthlyPrice: 99000,
                limits: { products: 500, employees: 5, registers: 1 },
                features: ['Product and inventory management', 'Cash and QRIS payments', 'Basic reports'],
            },
            {
                id: 'GROWTH',
                name: 'Growth',
                monthlyPrice: 249000,
                limits: { products: 5000, employees: 25, registers: 5 },
                features: ['Advanced reports', 'Purchase orders', 'Low-stock notifications', 'Split payments'],
            },
            {
                id: 'ENTERPRISE',
                name: 'Enterprise',
                monthlyPrice: 799000,
                limits: { products: null, employees: null, registers: null },
                features: ['Priority support', 'Custom receipt templates', 'Unlimited outlets', 'High-volume operations'],
            },
        ];
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map