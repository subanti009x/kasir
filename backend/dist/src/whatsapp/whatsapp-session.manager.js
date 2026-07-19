"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsappSessionManager_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappSessionManager = void 0;
const common_1 = require("@nestjs/common");
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const pino_1 = __importDefault(require("pino"));
const prisma_service_1 = require("../prisma/prisma.service");
const notification_gateway_1 = require("../notification/notification.gateway");
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
        const existing = this.sessions.get(tenantId);
        if (existing?.status === 'CONNECTED' || existing?.status === 'CONNECTING') {
            return;
        }
        await this.stopSession(tenantId);
        const authDir = (0, path_1.join)(AUTH_BASE_DIR, tenantId);
        await (0, promises_1.mkdir)(authDir, { recursive: true });
        const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(authDir);
        const socket = (0, baileys_1.default)({
            auth: state,
            browser: baileys_1.Browsers.ubuntu('POS Kasir'),
            printQRInTerminal: false,
            logger: (0, pino_1.default)({ level: 'silent' }),
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
                const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut;
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
                else if (statusCode === baileys_1.DisconnectReason.loggedOut) {
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