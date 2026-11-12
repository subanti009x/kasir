import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service.js';
import { PurchaseOrderController } from './purchase-order.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AccountingModule } from '../accounting/accounting.module.js';

@Module({
  imports: [PrismaModule, AccountingModule],
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
