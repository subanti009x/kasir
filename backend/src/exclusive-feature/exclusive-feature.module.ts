import { Module } from '@nestjs/common';
import { ExclusiveFeatureService } from './exclusive-feature.service';
import { ExclusiveFeatureController } from './exclusive-feature.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExclusiveFeatureController],
  providers: [ExclusiveFeatureService],
  exports: [ExclusiveFeatureService],
})
export class ExclusiveFeatureModule {}
