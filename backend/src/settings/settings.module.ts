import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
