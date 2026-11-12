import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
