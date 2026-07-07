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
exports.AccountingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const accounting_service_1 = require("./accounting.service");
const accounting_dto_1 = require("./dto/accounting.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const current_user_decorator_1 = require("../auth/current-user.decorator");
let AccountingController = class AccountingController {
    accountingService;
    constructor(accountingService) {
        this.accountingService = accountingService;
    }
    createExpense(user, dto) {
        return this.accountingService.createExpense(user.tenantId, user.id, dto);
    }
    listExpenses(user, startDate, endDate) {
        return this.accountingService.listExpenses(user.tenantId, startDate, endDate);
    }
    deleteExpense(user, id) {
        return this.accountingService.deleteExpense(user.tenantId, id);
    }
    getBalanceSheet(user, asOfDate) {
        return this.accountingService.getBalanceSheet(user.tenantId, asOfDate);
    }
    getProfitLoss(user, startDate, endDate) {
        return this.accountingService.getProfitLoss(user.tenantId, startDate, endDate);
    }
};
exports.AccountingController = AccountingController;
__decorate([
    (0, common_1.Post)('expenses'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, accounting_dto_1.CreateExpenseDto]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "createExpense", null);
__decorate([
    (0, common_1.Get)('expenses'),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, example: '2026-07-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, example: '2026-07-31' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "listExpenses", null);
__decorate([
    (0, common_1.Delete)('expenses/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "deleteExpense", null);
__decorate([
    (0, common_1.Get)('balance-sheet'),
    (0, swagger_1.ApiQuery)({ name: 'asOfDate', required: false, example: '2026-07-06' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('asOfDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getBalanceSheet", null);
__decorate([
    (0, common_1.Get)('profit-loss'),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, example: '2026-07-01' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, example: '2026-07-31' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AccountingController.prototype, "getProfitLoss", null);
exports.AccountingController = AccountingController = __decorate([
    (0, swagger_1.ApiTags)('accounting'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('OWNER', 'SUPER_ADMIN'),
    (0, common_1.Controller)('accounting'),
    __metadata("design:paramtypes", [accounting_service_1.AccountingService])
], AccountingController);
//# sourceMappingURL=accounting.controller.js.map