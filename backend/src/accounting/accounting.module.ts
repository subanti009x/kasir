import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service.js';
import { AccountingController } from './accounting.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AccountingController],
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
