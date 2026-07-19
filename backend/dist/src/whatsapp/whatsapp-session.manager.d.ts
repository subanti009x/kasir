import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from '../notification/notification.gateway';
export type SessionStatus = 'DISCONNECTED' | 'QR_READY' | 'CONNECTING' | 'CONNECTED';
export declare class WhatsappSessionManager implements OnModuleInit, OnModuleDestroy {
    private prisma;
    private notifications;
    private readonly logger;
    private sessions;
    constructor(prisma: PrismaService, notifications: NotificationGateway);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    startSession(tenantId: string): Promise<void>;
    stopSession(tenantId: string): Promise<void>;
    logoutSession(tenantId: string): Promise<void>;
    sendMessage(tenantId: string, phone: string, message: string): Promise<void>;
    getStatus(tenantId: string): SessionStatus;
    isConnected(tenantId: string): boolean;
    private updateDbStatus;
}
