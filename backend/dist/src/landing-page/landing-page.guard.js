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
exports.LandingPageGuard = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LandingPageGuard = class LandingPageGuard {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const slug = request.params.slug;
        if (!slug) {
            throw new common_1.NotFoundException('Tenant slug is required');
        }
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            select: { id: true, name: true, status: true },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Store not found');
        }
        if (tenant.status !== 'ACTIVE') {
            throw new common_1.ForbiddenException('Store is not active');
        }
        const landingPageFeature = await this.prisma.tenantFeature.findFirst({
            where: {
                tenantId: tenant.id,
                enabled: true,
                feature: {
                    code: 'LANDING_PAGE',
                    isActive: true,
                },
            },
            include: {
                feature: { select: { code: true } },
            },
        });
        if (!landingPageFeature) {
            throw new common_1.ForbiddenException('Landing Page feature is not available for this store');
        }
        request.tenantId = tenant.id;
        request.tenantName = tenant.name;
        return true;
    }
};
exports.LandingPageGuard = LandingPageGuard;
exports.LandingPageGuard = LandingPageGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LandingPageGuard);
//# sourceMappingURL=landing-page.guard.js.map