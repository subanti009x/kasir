"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const whatsapp_session_manager_1 = require("./whatsapp-session.manager");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    prisma;
    notifications;
    sessionManager;
    logger = new common_1.Logger(WhatsappService_1.name);
    constructor(prisma, notifications, sessionManager) {
        this.prisma = prisma;
        this.notifications = notifications;
        this.sessionManager = sessionManager;
    }
    async getOrCreateConfig(tenantId) {
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
        const liveStatus = this.sessionManager.getStatus(tenantId);
        if (liveStatus !== config.connectionStatus) {
            config = await this.prisma.whatsappConfig.update({
                where: { id: config.id },
                data: { connectionStatus: liveStatus },
            });
        }
        return config;
    }
    async updateConfig(tenantId, dto) {
        const config = await this.getOrCreateConfig(tenantId);
        return this.prisma.whatsappConfig.update({
            where: { id: config.id },
            data: dto,
        });
    }
    async connectSession(tenantId) {
        await this.getOrCreateConfig(tenantId);
        await this.sessionManager.startSession(tenantId);
        return { message: 'Pairing started. Scan the QR code from your WhatsApp app.' };
    }
    async disconnectSession(tenantId) {
        await this.sessionManager.logoutSession(tenantId);
        return { message: 'WhatsApp disconnected successfully.' };
    }
    formatCurrency(n) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(n);
    }
    buildMessage(template, data) {
        let result = template;
        for (const [key, value] of Object.entries(data)) {
            result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        }
        return result;
    }
    buildTransactionData(tenantName, transaction, customerName) {
        const items = (transaction.items || [])
            .map((item) => `• ${item.product?.name || 'Item'} x${item.quantity} = ${this.formatCurrency(item.subtotal)}`)
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
    async enqueueNotification(tenantId, event, transaction) {
        try {
            const featureCheck = await this.prisma.tenantFeature.findFirst({
                where: {
                    tenantId,
                    enabled: true,
                    feature: { code: 'WHATSAPP_RECEIPT', isActive: true },
                },
            });
            if (!featureCheck)
                return;
            const config = await this.getOrCreateConfig(tenantId);
            if (!config.enabled)
                return;
            const customerId = transaction.customerId;
            if (!customerId)
                return;
            const customer = await this.prisma.customer.findFirst({
                where: { id: customerId, tenantId },
            });
            if (!customer?.phone)
                return;
            const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
            if (!tenant)
                return;
            const template = event === 'CHECKOUT_SUCCESS' ? config.checkoutTemplate : config.refundTemplate;
            const data = this.buildTransactionData(tenant.name, transaction, customer.name);
            const messageBody = this.buildMessage(template, data);
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
            this.logger.log(`Enqueued WA notification for tenant ${tenantId} → ${customer.phone} (log: ${log.id})`);
            this.processLog(log.id, tenantId).catch((err) => this.logger.error(`Failed to process log ${log.id}: ${err.message}`));
        }
        catch (error) {
            this.logger.error(`Failed to enqueue WA notification: ${error}`);
        }
    }
    async processLog(logId, tenantId) {
        await this.prisma.whatsappLog.update({
            where: { id: logId },
            data: { status: 'SENDING' },
        });
        this.broadcastLogUpdate(tenantId, logId);
        try {
            if (!this.sessionManager.isConnected(tenantId)) {
                throw new Error('WhatsApp session not connected. Please scan QR code first.');
            }
            const log = await this.prisma.whatsappLog.findUnique({ where: { id: logId } });
            if (!log)
                throw new Error('Log not found');
            await this.sessionManager.sendMessage(tenantId, log.recipientPhone, log.messageBody);
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
        }
        catch (error) {
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
                    nextRetryAt: retryCount < maxRetries ? new Date(Date.now() + 30000) : null,
                },
            });
            this.broadcastLogUpdate(tenantId, logId);
            this.logger.warn(`WA message failed (log: ${logId}, retry: ${retryCount}/${maxRetries}): ${errorMessage}`);
        }
    }
    async retryFailedLog(tenantId, logId) {
        const log = await this.prisma.whatsappLog.findFirst({
            where: { id: logId, config: { tenantId } },
        });
        if (!log)
            throw new common_1.NotFoundException('Log not found');
        if (log.status !== 'FAILED') {
            throw new Error('Only failed messages can be retried');
        }
        await this.prisma.whatsappLog.update({
            where: { id: logId },
            data: { status: 'PENDING', errorMessage: null },
        });
        this.broadcastLogUpdate(tenantId, logId);
        await this.processLog(logId, tenantId);
        return { message: 'Retry initiated' };
    }
    async processRetryQueue() {
        try {
            const failedLogs = await this.prisma.whatsappLog.findMany({
                where: {
                    status: 'FAILED',
                    nextRetryAt: { lte: new Date() },
                    retryCount: { lt: 3 },
                },
                include: {
                    config: { select: { tenantId: true, enabled: true } },
                },
                take: 10,
                orderBy: { nextRetryAt: 'asc' },
            });
            for (const log of failedLogs) {
                if (!log.config.enabled)
                    continue;
                if (log.retryCount >= log.maxRetries)
                    continue;
                this.logger.log(`Auto-retrying WA log ${log.id} for tenant ${log.config.tenantId} (attempt ${log.retryCount + 1})`);
                await this.prisma.whatsappLog.update({
                    where: { id: log.id },
                    data: { status: 'PENDING', nextRetryAt: null },
                });
                this.processLog(log.id, log.config.tenantId).catch((err) => this.logger.error(`Auto-retry failed for log ${log.id}: ${err.message}`));
            }
        }
        catch (error) {
            this.logger.error('Retry queue processing error:', error);
        }
    }
    async getLogs(tenantId, status, page = 1, limit = 20) {
        const config = await this.prisma.whatsappConfig.findUnique({
            where: { tenantId },
        });
        if (!config)
            return { data: [], total: 0, page, limit, totalPages: 0 };
        const where = { configId: config.id };
        if (status)
            where.status = status;
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
    async getLogStats(tenantId) {
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
    async broadcastLogUpdate(tenantId, logId) {
        try {
            const log = await this.prisma.whatsappLog.findUnique({ where: { id: logId } });
            if (log) {
                this.notifications.broadcastWhatsappLogUpdate(tenantId, log);
            }
        }
        catch { }
    }
};
exports.WhatsappService = WhatsappService;
__decorate([
    (0, schedule_1.Interval)(30000),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappService.prototype, "processRetryQueue", null);
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway,
        whatsapp_session_manager_1.WhatsappSessionManager])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map