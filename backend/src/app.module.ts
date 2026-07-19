import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TenantModule } from './tenant/tenant.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CategoryModule } from './category/category.module';
import { CustomerModule } from './customer/customer.module';
import { SupplierModule } from './supplier/supplier.module';
import { InventoryModule } from './inventory/inventory.module';
import { TransactionModule } from './transaction/transaction.module';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { ReportModule } from './report/report.module';
import { SettingsModule } from './settings/settings.module';
import { NotificationModule } from './notification/notification.module';
import { AccountingModule } from './accounting/accounting.module';
import { ExclusiveFeatureModule } from './exclusive-feature/exclusive-feature.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { LandingPageModule } from './landing-page/landing-page.module';

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

