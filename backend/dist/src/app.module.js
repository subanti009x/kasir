"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const tenant_module_1 = require("./tenant/tenant.module");
const user_module_1 = require("./user/user.module");
const product_module_1 = require("./product/product.module");
const category_module_1 = require("./category/category.module");
const customer_module_1 = require("./customer/customer.module");
const supplier_module_1 = require("./supplier/supplier.module");
const inventory_module_1 = require("./inventory/inventory.module");
const transaction_module_1 = require("./transaction/transaction.module");
const purchase_order_module_1 = require("./purchase-order/purchase-order.module");
const report_module_1 = require("./report/report.module");
const settings_module_1 = require("./settings/settings.module");
const notification_module_1 = require("./notification/notification.module");
const accounting_module_1 = require("./accounting/accounting.module");
const exclusive_feature_module_1 = require("./exclusive-feature/exclusive-feature.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const landing_page_module_1 = require("./landing-page/landing-page.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            tenant_module_1.TenantModule,
            user_module_1.UserModule,
            product_module_1.ProductModule,
            category_module_1.CategoryModule,
            customer_module_1.CustomerModule,
            supplier_module_1.SupplierModule,
            inventory_module_1.InventoryModule,
            transaction_module_1.TransactionModule,
            purchase_order_module_1.PurchaseOrderModule,
            report_module_1.ReportModule,
            settings_module_1.SettingsModule,
            notification_module_1.NotificationModule,
            accounting_module_1.AccountingModule,
            exclusive_feature_module_1.ExclusiveFeatureModule,
            whatsapp_module_1.WhatsappModule,
            landing_page_module_1.LandingPageModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map