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
exports.LandingPageController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const landing_page_service_1 = require("./landing-page.service");
const landing_page_guard_1 = require("./landing-page.guard");
const landing_page_dto_1 = require("./dto/landing-page.dto");
let LandingPageController = class LandingPageController {
    service;
    constructor(service) {
        this.service = service;
    }
    getStoreInfo(req) {
        return this.service.getStoreInfo(req.tenantId);
    }
    getProducts(req, categoryId, search) {
        return this.service.getProducts(req.tenantId, categoryId, search);
    }
    getCategories(req) {
        return this.service.getCategories(req.tenantId);
    }
    checkout(req, dto) {
        return this.service.checkout(req.tenantId, dto);
    }
};
exports.LandingPageController = LandingPageController;
__decorate([
    (0, common_1.Get)(':slug/info'),
    (0, common_1.UseGuards)(landing_page_guard_1.LandingPageGuard),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPageController.prototype, "getStoreInfo", null);
__decorate([
    (0, common_1.Get)(':slug/products'),
    (0, common_1.UseGuards)(landing_page_guard_1.LandingPageGuard),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], LandingPageController.prototype, "getProducts", null);
__decorate([
    (0, common_1.Get)(':slug/categories'),
    (0, common_1.UseGuards)(landing_page_guard_1.LandingPageGuard),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], LandingPageController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Post)(':slug/checkout'),
    (0, common_1.UseGuards)(landing_page_guard_1.LandingPageGuard),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Tenant slug', example: 'aderose-glowing-salon' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, landing_page_dto_1.LandingPageCheckoutDto]),
    __metadata("design:returntype", void 0)
], LandingPageController.prototype, "checkout", null);
exports.LandingPageController = LandingPageController = __decorate([
    (0, swagger_1.ApiTags)('landing-page'),
    (0, common_1.Controller)('landing'),
    __metadata("design:paramtypes", [landing_page_service_1.LandingPageService])
], LandingPageController);
//# sourceMappingURL=landing-page.controller.js.map