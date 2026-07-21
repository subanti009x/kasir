import { Module } from '@nestjs/common';
import { LandingPageController } from './landing-page.controller';
import { LandingPageService } from './landing-page.service';
import { LandingPageGuard } from './landing-page.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationModule } from '../notification/notification.module';
import { AccountingModule } from '../accounting/accounting.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, NotificationModule, AccountingModule, WhatsappModule],
  controllers: [LandingPageController],
  providers: [LandingPageService, LandingPageGuard],
})
export class LandingPageModule {}

