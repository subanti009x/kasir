import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getPublicStats() {
    const activeSMEs = await this.prisma.tenant.count({
      where: { status: 'ACTIVE' },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyTransactions = await this.prisma.transaction.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: todayStart },
      },
    });

    return {
      activeSMEs,
      dailyTransactions,
      uptime: 99.98,
    };
  }
}
