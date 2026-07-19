import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { WhatsappSessionManager } from './whatsapp-session.manager';
import { UpdateWhatsappConfigDto } from './dto/whatsapp.dto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationGateway,
    private sessionManager: WhatsappSessionManager,
  ) {}

  // ─── Config Management ────────────────────────────────

  async getOrCreateConfig(tenantId: string) {
    let config = await this.prisma.whatsappConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      config = await this.prisma.whatsappConfig.create({
        data: {
          tenantId,
          botName: tenant ? `${tenant.name} Bot` : 'WhatsApp Bot',
        },
      });
    }

    // Enrich with live session status
    const liveStatus = this.sessionManager.getStatus(tenantId);
    if (liveStatus !== config.connectionStatus) {
      // Sync live status to DB if they differ
      config = await this.prisma.whatsappConfig.update({
        where: { id: config.id },
        data: { connectionStatus: liveStatus },
      });
    }

    return config;
  }

  async updateConfig(tenantId: string, dto: UpdateWhatsappConfigDto) {
    const config = await this.getOrCreateConfig(tenantId);
    return this.prisma.whatsappConfig.update({
      where: { id: config.id },
      data: dto,
    });
  }

  async connectSession(tenantId: string) {
    await this.getOrCreateConfig(tenantId);
    await this.sessionManager.startSession(tenantId);
    return { message: 'Pairing started. Scan the QR code from your WhatsApp app.' };
  }

  async disconnectSession(tenantId: string) {
    await this.sessionManager.logoutSession(tenantId);
    return { message: 'WhatsApp disconnected successfully.' };
  }

  // ─── Template Builder ─────────────────────────────────

  private formatCurrency(n: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(n);
  }

  buildMessage(template: string, data: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return result;
  }

  private buildTransactionData(
    tenantName: string,
    transaction: any,
    customerName: string,
  ): Record<string, string> {
    const items = (transaction.items || [])
      .map(
        (item: any) =>
          `• ${item.product?.name || 'Item'} x${item.quantity} = ${this.formatCurrency(item.subtotal)}`,
      )
      .join('\n');

    return {
      customer_name: customerName,
      store_name: tenantName,
      receipt_id: transaction.receiptId || '',
      date: new Date(transaction.createdAt || new Date()).toLocaleString('id-ID'),
      items,
      subtotal: this.formatCurrency(transaction.subtotal || 0),
      tax: this.formatCurrency(transaction.tax || 0),
      total: this.formatCurrency(transaction.total || 0),
      payment_method: transaction.paymentMethod || '',
      amount_paid: this.formatCurrency(transaction.amountPaid || 0),
      change_due: this.formatCurrency(transaction.changeDue || 0),
    };
  }

  // ─── Notification Enqueue (called by TransactionService) ─

  async enqueueNotification(
    tenantId: string,
    event: 'CHECKOUT_SUCCESS' | 'REFUND_SUCCESS',
    transaction: any,
  ): Promise<void> {
    try {
      // 1. Check feature is enabled for this tenant
      const featureCheck = await this.prisma.tenantFeature.findFirst({
        where: {
          tenantId,
          enabled: true,
          feature: { code: 'WHATSAPP_RECEIPT', isActive: true },
        },
      });
      if (!featureCheck) return;

      // 2. Get config
      const config = await this.getOrCreateConfig(tenantId);
      if (!config.enabled) return;

      // 3. Get customer info
      const customerId = transaction.customerId;
      if (!customerId) return;

      const customer = await this.prisma.customer.findFirst({
        where: { id: customerId, tenantId },
      });
      if (!customer?.phone) return;

      // 4. Get tenant info
      const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) return;

      // 5. Build message from template
      const template =
        event === 'CHECKOUT_SUCCESS' ? config.checkoutTemplate : config.refundTemplate;
      const data = this.buildTransactionData(tenant.name, transaction, customer.name);
      const messageBody = this.buildMessage(template, data);

      // 6. Create log entry
      const log = await this.prisma.whatsappLog.create({
        data: {
          event,
          recipientPhone: customer.phone,
          recipientName: customer.name,
          messageBody,
          status: 'PENDING',
          transactionId: transaction.id,
          configId: config.id,
        },
      });

      this.logger.log(
        `Enqueued WA notification for tenant ${tenantId} → ${customer.phone} (log: ${log.id})`,
      );

      // 7. Process immediately (fire-and-forget)
      this.processLog(log.id, tenantId).catch((err) =>
        this.logger.error(`Failed to process log ${log.id}: ${err.message}`),
      );
    } catch (error) {
      this.logger.error(`Failed to enqueue WA notification: ${error}`);
    }
  }

  // ─── Message Processing ───────────────────────────────

  async processLog(logId: string, tenantId: string): Promise<void> {
    // Update status to SENDING
    await this.prisma.whatsappLog.update({
      where: { id: logId },
      data: { status: 'SENDING' },
    });
    this.broadcastLogUpdate(tenantId, logId);

    try {
      // Check if session is connected
      if (!this.sessionManager.isConnected(tenantId)) {
        throw new Error('WhatsApp session not connected. Please scan QR code first.');
      }

      // Get log data
      const log = await this.prisma.whatsappLog.findUnique({ where: { id: logId } });
      if (!log) throw new Error('Log not found');

      // Send via Baileys
      await this.sessionManager.sendMessage(tenantId, log.recipientPhone, log.messageBody);

      // Success
      await this.prisma.whatsappLog.update({
        where: { id: logId },
        data: {
          status: 'SENT',
          sentAt: new Date(),
          errorMessage: null,
        },
      });
      this.broadcastLogUpdate(tenantId, logId);
      this.logger.log(`WA message sent successfully (log: ${logId})`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';

      const log = await this.prisma.whatsappLog.findUnique({ where: { id: logId } });
      const retryCount = (log?.retryCount || 0) + 1;
      const maxRetries = log?.maxRetries || 3;

      await this.prisma.whatsappLog.update({
        where: { id: logId },
        data: {
          status: 'FAILED',
          errorMessage,
          retryCount,
          nextRetryAt:
            retryCount < maxRetries ? new Date(Date.now() + 30000) : null,
        },
      });
      this.broadcastLogUpdate(tenantId, logId);
      this.logger.warn(
        `WA message failed (log: ${logId}, retry: ${retryCount}/${maxRetries}): ${errorMessage}`,
      );
    }
  }

  // ─── Manual Retry ─────────────────────────────────────

  async retryFailedLog(tenantId: string, logId: string) {
    const log = await this.prisma.whatsappLog.findFirst({
      where: { id: logId, config: { tenantId } },
    });
    if (!log) throw new NotFoundException('Log not found');
    if (log.status !== 'FAILED') {
      throw new Error('Only failed messages can be retried');
    }

    // Reset for retry
    await this.prisma.whatsappLog.update({
      where: { id: logId },
      data: { status: 'PENDING', errorMessage: null },
    });
    this.broadcastLogUpdate(tenantId, logId);

    // Process immediately
    await this.processLog(logId, tenantId);
    return { message: 'Retry initiated' };
  }

  // ─── Background Retry Processor (every 30s) ──────────

  @Interval(30000)
  async processRetryQueue(): Promise<void> {
    try {
      const failedLogs = await this.prisma.whatsappLog.findMany({
        where: {
          status: 'FAILED',
          nextRetryAt: { lte: new Date() },
          retryCount: { lt: 3 }, // Will be compared with maxRetries in processLog
        },
        include: {
          config: { select: { tenantId: true, enabled: true } },
        },
        take: 10, // Process max 10 per cycle
        orderBy: { nextRetryAt: 'asc' },
      });

      for (const log of failedLogs) {
        if (!log.config.enabled) continue;
        if (log.retryCount >= log.maxRetries) continue;

        this.logger.log(
          `Auto-retrying WA log ${log.id} for tenant ${log.config.tenantId} (attempt ${log.retryCount + 1})`,
        );

        await this.prisma.whatsappLog.update({
          where: { id: log.id },
          data: { status: 'PENDING', nextRetryAt: null },
        });

        this.processLog(log.id, log.config.tenantId).catch((err) =>
          this.logger.error(`Auto-retry failed for log ${log.id}: ${err.message}`),
        );
      }
    } catch (error) {
      this.logger.error('Retry queue processing error:', error);
    }
  }

  // ─── Log Queries ──────────────────────────────────────

  async getLogs(
    tenantId: string,
    status?: string,
    page = 1,
    limit = 20,
  ) {
    const config = await this.prisma.whatsappConfig.findUnique({
      where: { tenantId },
    });
    if (!config) return { data: [], total: 0, page, limit, totalPages: 0 };

    const where: any = { configId: config.id };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.whatsappLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.whatsappLog.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getLogStats(tenantId: string) {
    const config = await this.prisma.whatsappConfig.findUnique({
      where: { tenantId },
    });
    if (!config) {
      return { total: 0, pending: 0, sending: 0, sent: 0, failed: 0 };
    }

    const [total, pending, sending, sent, failed] = await Promise.all([
      this.prisma.whatsappLog.count({ where: { configId: config.id } }),
      this.prisma.whatsappLog.count({
        where: { configId: config.id, status: 'PENDING' },
      }),
      this.prisma.whatsappLog.count({
        where: { configId: config.id, status: 'SENDING' },
      }),
      this.prisma.whatsappLog.count({
        where: { configId: config.id, status: 'SENT' },
      }),
      this.prisma.whatsappLog.count({
        where: { configId: config.id, status: 'FAILED' },
      }),
    ]);

    return { total, pending, sending, sent, failed };
  }

  // ─── WebSocket Broadcast Helper ───────────────────────

  private async broadcastLogUpdate(tenantId: string, logId: string) {
    try {
      const log = await this.prisma.whatsappLog.findUnique({ where: { id: logId } });
      if (log) {
        this.notifications.broadcastWhatsappLogUpdate(tenantId, log);
      }
    } catch { /* ignore */ }
  }
}
