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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_dto_1 = require("../tenant/dto/tenant.dto");
let SettingsController = class SettingsController {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getSettings(user) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: user.tenantId },
            include: { paymentMethods: true },
        });
        return tenant;
    }
    async updateSettings(dto, user) {
        return this.prisma.tenant.update({
            where: { id: user.tenantId },
            data: dto,
            include: { paymentMethods: true },
        });
    }
    async uploadLogo(file, user) {
        if (!file) {
            throw new common_1.BadRequestException('Logo file is required');
        }
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(file.mimetype)) {
            throw new common_1.BadRequestException('Only JPEG, PNG, WebP, and SVG logos are allowed');
        }
        if (file.size > 1024 * 1024) {
            throw new common_1.BadRequestException('Logo must be 1MB or smaller');
        }
        const extension = (0, path_1.extname)(file.originalname).toLowerCase() || '.png';
        const safeExtension = ['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(extension) ? extension : '.png';
        const directory = (0, path_1.join)(process.cwd(), 'uploads', 'logos', user.tenantId);
        const filename = `logo-${Date.now()}${safeExtension}`;
        await (0, promises_1.mkdir)(directory, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(directory, filename), file.buffer);
        return this.prisma.tenant.update({
            where: { id: user.tenantId },
            data: { logo: `/uploads/logos/${user.tenantId}/${filename}` },
        });
    }
    async getPaymentMethods(user) {
        return this.prisma.paymentMethod.findMany({
            where: { tenantId: user.tenantId },
            orderBy: { name: 'asc' },
        });
    }
    async updatePaymentMethod(dto, user) {
        return this.prisma.paymentMethod.updateMany({
            where: { id: dto.id, tenantId: user.tenantId },
            data: { enabled: dto.enabled },
        });
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)(),
    (0, roles_decorator_1.Roles)('OWNER', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [tenant_dto_1.UpdateTenantDto, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('logo'),
    (0, roles_decorator_1.Roles)('OWNER', 'SUPER_ADMIN'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Get)('payment-methods'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Patch)('payment-methods'),
    (0, roles_decorator_1.Roles)('OWNER', 'SUPER_ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updatePaymentMethod", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map