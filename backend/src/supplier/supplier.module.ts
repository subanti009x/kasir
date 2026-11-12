import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service.js';
import { SupplierController } from './supplier.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierController],
  providers: [SupplierService],
  exports: [SupplierService],
})
export class SupplierModule {}
