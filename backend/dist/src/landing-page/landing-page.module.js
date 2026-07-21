"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingPageModule = void 0;
const common_1 = require("@nestjs/common");
const landing_page_controller_1 = require("./landing-page.controller");
const landing_page_service_1 = require("./landing-page.service");
const landing_page_guard_1 = require("./landing-page.guard");
const prisma_module_1 = require("../prisma/prisma.module");
const notification_module_1 = require("../notification/notification.module");
const accounting_module_1 = require("../accounting/accounting.module");
const whatsapp_module_1 = require("../whatsapp/whatsapp.module");
let LandingPageModule = class LandingPageModule {
};
exports.LandingPageModule = LandingPageModule;
exports.LandingPageModule = LandingPageModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, notification_module_1.NotificationModule, accounting_module_1.AccountingModule, whatsapp_module_1.WhatsappModule],
        controllers: [landing_page_controller_1.LandingPageController],
        providers: [landing_page_service_1.LandingPageService, landing_page_guard_1.LandingPageGuard],
    })
], LandingPageModule);
//# sourceMappingURL=landing-page.module.js.map