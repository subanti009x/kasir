import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { TransactionController } from './transaction.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { AccountingModule } from '../accounting/accounting.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';

@Module({
  imports: [PrismaModule, NotificationModule, AccountingModule, WhatsappModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}

