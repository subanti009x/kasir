import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { WhatsappSessionManager } from './whatsapp-session.manager';
import { UpdateWhatsappConfigDto } from './dto/whatsapp.dto';
export declare class WhatsappService {
    private prisma;
    private notifications;
    private sessionManager;
    private readonly logger;
    constructor(prisma: PrismaService, notifications: NotificationGateway, sessionManager: WhatsappSessionManager);
    getOrCreateConfig(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        enabled: boolean;
        botName: string;
        connectionStatus: string;
        connectedPhone: string | null;
        checkoutTemplate: string;
        refundTemplate: string;
    }>;
    updateConfig(tenantId: string, dto: UpdateWhatsappConfigDto): Promise<{
        id: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        enabled: boolean;
        botName: string;
        connectionStatus: string;
        connectedPhone: string | null;
        checkoutTemplate: string;
        refundTemplate: string;
    }>;
    connectSession(tenantId: string): Promise<{
        message: string;
    }>;
    disconnectSession(tenantId: string): Promise<{
        message: string;
    }>;
    private formatCurrency;
    buildMessage(template: string, data: Record<string, string>): string;
    private buildTransactionData;
    enqueueNotification(tenantId: string, event: 'CHECKOUT_SUCCESS' | 'REFUND_SUCCESS', transaction: any): Promise<void>;
    processLog(logId: string, tenantId: string): Promise<void>;
    retryFailedLog(tenantId: string, logId: string): Promise<{
        message: string;
    }>;
    processRetryQueue(): Promise<void>;
    getLogs(tenantId: string, status?: string, page?: number, limit?: number): Promise<{
        data: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            transactionId: string | null;
            event: string;
            recipientPhone: string;
            recipientName: string;
            messageBody: string;
            retryCount: number;
            maxRetries: number;
            errorMessage: string | null;
            sentAt: Date | null;
            nextRetryAt: Date | null;
            configId: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getLogStats(tenantId: string): Promise<{
        total: number;
        pending: number;
        sending: number;
        sent: number;
        failed: number;
    }>;
    private broadcastLogUpdate;
}
