import { Module } from '@nestjs/common';
import { LandingPageController } from './landing-page.controller.js';
import { LandingPageService } from './landing-page.service.js';
import { LandingPageGuard } from './landing-page.guard.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { AccountingModule } from '../accounting/accounting.module.js';
import { WhatsappModule } from '../whatsapp/whatsapp.module.js';

@Module({
  imports: [PrismaModule, NotificationModule, AccountingModule, WhatsappModule],
  controllers: [LandingPageController],
  providers: [LandingPageService, LandingPageGuard],
})
export class LandingPageModule {}

