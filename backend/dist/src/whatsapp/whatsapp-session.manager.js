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
var WhatsappSessionManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappSessionManager = void 0;
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
const IS_SERVERLESS = !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
async function loadBaileys() {
    const baileys = await import('@whiskeysockets/baileys');
    return {
        makeWASocket: baileys.default,
        useMultiFileAuthState: baileys.useMultiFileAuthState,
        DisconnectReason: baileys.DisconnectReason,
        Browsers: baileys.Browsers,
    };
}
const AUTH_BASE_DIR = (0, path_1.join)(process.cwd(), 'auth_info_baileys');
const MAX_RECONNECT_RETRIES = 5;
let WhatsappSessionManager = WhatsappSessionManager_1 = class WhatsappSessionManager {
    prisma;
    notifications;
    logger = new common_1.Logger(WhatsappSessionManager_1.name);
    sessions = new Map();
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async onModuleInit() {
        if (IS_SERVERLESS) {
            this.logger.log('Running in serverless environment — WhatsApp sessions disabled');
            return;
        }
        await (0, promises_1.mkdir)(AUTH_BASE_DIR, { recursive: true });
        try {
            const configs = await this.prisma.whatsappConfig.findMany({
                where: { enabled: true, connectionStatus: 'CONNECTED' },
                select: { tenantId: true },
            });
            for (const config of configs) {
                const authDir = (0, path_1.join)(AUTH_BASE_DIR, config.tenantId);
                if ((0, fs_1.existsSync)(authDir)) {
                    this.logger.log(`Restoring WhatsApp session for tenant ${config.tenantId}`);
                    this.startSession(config.tenantId).catch((err) => this.logger.error(`Failed to restore session for ${config.tenantId}: ${err.message}`));
                }
            }
        }
        catch (error) {
            this.logger.warn('Could not restore WhatsApp sessions on startup:', error);
        }
    }
    async onModuleDestroy() {
        for (const [tenantId, session] of this.sessions) {
            try {
                session.socket?.end(undefined);
                this.logger.log(`Closed session for tenant ${tenantId}`);
            }
            catch { }
        }
        this.sessions.clear();
    }
    async startSession(tenantId) {
        if (IS_SERVERLESS) {
            throw new Error('WhatsApp sessions are not available in serverless environment. Use a persistent server deployment.');
        }
        const existing = this.sessions.get(tenantId);
        if (existing?.status === 'CONNECTED' || existing?.status === 'CONNECTING') {
            return;
        }
        await this.stopSession(tenantId);
        const authDir = (0, path_1.join)(AUTH_BASE_DIR, tenantId);
        await (0, promises_1.mkdir)(authDir, { recursive: true });
        const { makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = await loadBaileys();
        const pino = (await import('pino')).default;
        const { state, saveCreds } = await useMultiFileAuthState(authDir);
        const socket = makeWASocket({
            auth: state,
            browser: Browsers.ubuntu('POS Kasir'),
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: false,
            generateHighQualityLinkPreview: false,
        });
        const session = {
            socket,
            status: 'CONNECTING',
            retryCount: 0,
        };
        this.sessions.set(tenantId, session);
        await this.updateDbStatus(tenantId, 'CONNECTING');
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            if (qr) {
                session.status = 'QR_READY';
                await this.updateDbStatus(tenantId, 'QR_READY');
                this.notifications.broadcastWhatsappQR(tenantId, qr);
                this.logger.log(`QR Code generated for tenant ${tenantId}`);
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                this.logger.warn(`Connection closed for tenant ${tenantId} (code: ${statusCode}). Reconnect: ${shouldReconnect}`);
                session.status = 'DISCONNECTED';
                session.socket = null;
                await this.updateDbStatus(tenantId, 'DISCONNECTED', null);
                this.notifications.broadcastWhatsappStatus(tenantId, 'DISCONNECTED');
                if (shouldReconnect && session.retryCount < MAX_RECONNECT_RETRIES) {
                    session.retryCount++;
                    const delay = Math.min(session.retryCount * 2000, 10000);
                    this.logger.log(`Reconnecting tenant ${tenantId} in ${delay}ms (attempt ${session.retryCount})`);
                    setTimeout(() => this.startSession(tenantId), delay);
                }
                else if (statusCode === DisconnectReason.loggedOut) {
                    this.logger.log(`Tenant ${tenantId} logged out — session cleared`);
                    this.sessions.delete(tenantId);
                }
            }
            if (connection === 'open') {
                session.status = 'CONNECTED';
                session.retryCount = 0;
                const phoneNumber = socket.user?.id?.split(':')[0] || socket.user?.id?.split('@')[0] || null;
                await this.updateDbStatus(tenantId, 'CONNECTED', phoneNumber);
                this.notifications.broadcastWhatsappStatus(tenantId, 'CONNECTED', phoneNumber);
                this.logger.log(`WhatsApp connected for tenant ${tenantId} (phone: ${phoneNumber})`);
            }
        });
        socket.ev.on('creds.update', saveCreds);
    }
    async stopSession(tenantId) {
        const session = this.sessions.get(tenantId);
        if (session) {
            try {
                session.socket?.end(undefined);
            }
            catch { }
            this.sessions.delete(tenantId);
        }
        await this.updateDbStatus(tenantId, 'DISCONNECTED', null);
        this.notifications.broadcastWhatsappStatus(tenantId, 'DISCONNECTED');
    }
    async logoutSession(tenantId) {
        if (IS_SERVERLESS) {
            throw new Error('WhatsApp sessions are not available in serverless environment.');
        }
        const session = this.sessions.get(tenantId);
        if (session?.socket) {
            try {
                await session.socket.logout();
            }
            catch { }
            session.socket = null;
        }
        this.sessions.delete(tenantId);
        await this.updateDbStatus(tenantId, 'DISCONNECTED', null);
        this.notifications.broadcastWhatsappStatus(tenantId, 'DISCONNECTED');
        const authDir = (0, path_1.join)(AUTH_BASE_DIR, tenantId);
        try {
            const { rm } = await import('fs/promises');
            await rm(authDir, { recursive: true, force: true });
        }
        catch { }
    }
    async sendMessage(tenantId, phone, message) {
        if (IS_SERVERLESS) {
            throw new Error('WhatsApp sessions are not available in serverless environment.');
        }
        const session = this.sessions.get(tenantId);
        if (!session?.socket || session.status !== 'CONNECTED') {
            throw new Error('WhatsApp session not connected');
        }
        const normalizedPhone = phone
            .replace(/[^0-9]/g, '')
            .replace(/^0/, '62');
        const jid = `${normalizedPhone}@s.whatsapp.net`;
        await session.socket.sendMessage(jid, { text: message });
    }
    getStatus(tenantId) {
        return this.sessions.get(tenantId)?.status || 'DISCONNECTED';
    }
    isConnected(tenantId) {
        return this.getStatus(tenantId) === 'CONNECTED';
    }
    async updateDbStatus(tenantId, status, connectedPhone) {
        try {
            const data = { connectionStatus: status };
            if (connectedPhone !== undefined) {
                data.connectedPhone = connectedPhone;
            }
            await this.prisma.whatsappConfig.updateMany({
                where: { tenantId },
                data,
            });
        }
        catch {
        }
    }
};
exports.WhatsappSessionManager = WhatsappSessionManager;
exports.WhatsappSessionManager = WhatsappSessionManager = WhatsappSessionManager_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_gateway_1.NotificationGateway])
], WhatsappSessionManager);
//# sourceMappingURL=whatsapp-session.manager.js.map