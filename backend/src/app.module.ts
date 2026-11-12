import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { TenantModule } from './tenant/tenant.module.js';
import { UserModule } from './user/user.module.js';
import { ProductModule } from './product/product.module.js';
import { CategoryModule } from './category/category.module.js';
import { CustomerModule } from './customer/customer.module.js';
import { SupplierModule } from './supplier/supplier.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { TransactionModule } from './transaction/transaction.module.js';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module.js';
import { ReportModule } from './report/report.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { NotificationModule } from './notification/notification.module.js';
import { AccountingModule } from './accounting/accounting.module.js';
import { ExclusiveFeatureModule } from './exclusive-feature/exclusive-feature.module.js';
import { WhatsappModule } from './whatsapp/whatsapp.module.js';
import { LandingPageModule } from './landing-page/landing-page.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    TenantModule,
    UserModule,
    ProductModule,
    CategoryModule,
    CustomerModule,
    SupplierModule,
    InventoryModule,
    TransactionModule,
    PurchaseOrderModule,
    ReportModule,
    SettingsModule,
    NotificationModule,
    AccountingModule,
    ExclusiveFeatureModule,
    WhatsappModule,
    LandingPageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

