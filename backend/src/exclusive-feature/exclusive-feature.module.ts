import { Module } from '@nestjs/common';
import { ExclusiveFeatureService } from './exclusive-feature.service.js';
import { ExclusiveFeatureController } from './exclusive-feature.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ExclusiveFeatureController],
  providers: [ExclusiveFeatureService],
  exports: [ExclusiveFeatureService],
})
export class ExclusiveFeatureModule {}
