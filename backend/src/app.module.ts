import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
