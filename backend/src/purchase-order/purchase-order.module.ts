import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderController } from './purchase-order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
