import { WhatsappService } from './whatsapp.service';
import { UpdateWhatsappConfigDto } from './dto/whatsapp.dto';
export declare class WhatsappController {
    private readonly whatsappService;
    constructor(whatsappService: WhatsappService);
    getConfig(user: any): Promise<{
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
    updateConfig(dto: UpdateWhatsappConfigDto, user: any): Promise<{
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
    connect(user: any): Promise<{
        message: string;
    }>;
    disconnect(user: any): Promise<{
        message: string;
    }>;
    getLogs(user: any, status?: string, page?: number, limit?: number): Promise<{
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
    getLogStats(user: any): Promise<{
        total: number;
        pending: number;
        sending: number;
        sent: number;
        failed: number;
    }>;
    retryLog(id: string, user: any): Promise<{
        message: string;
    }>;
}
